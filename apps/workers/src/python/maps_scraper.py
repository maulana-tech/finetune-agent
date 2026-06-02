import sys
import json
import re
from urllib.parse import urljoin, urlparse
from scrapling.fetchers import DynamicFetcher
from curl_cffi import requests as http

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
JUNK_DOMAINS = (
    'example.com', 'sentry.io', 'wixpress.com', 'w3.org',
    'schema.org', 'googleapis.com', 'gstatic.com', 'facebook.com',
    'twitter.com', 'instagram.com', 'youtube.com', 'whatsapp.com',
    'tiktok.com', 'linkedin.com', 'pngtree.com', 'localhost',
    'no-reply', 'noreply', '.png', '.jpg', '.gif', '.svg',
)
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
}
CONTACT_PATHS = ['/', '/contact', '/kontak', '/about', '/tentang', '/tentang-kami', '/hubungi-kami']


def coords_from_href(href: str):
    m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', href)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


def _val(el, attr=None):
    try:
        return el.get_attribute(attr).strip() if attr else el.inner_text().strip()
    except Exception:
        return ''


def _is_valid_email(email: str) -> bool:
    e = email.lower()
    return not any(j in e for j in JUNK_DOMAINS)


def scrape_emails_from_website(url: str) -> list:
    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    emails = set()
    for path in CONTACT_PATHS:
        try:
            resp = http.get(urljoin(base, path), headers=HTTP_HEADERS, timeout=8, impersonate="chrome")
            if resp.status_code == 200:
                html = resp.text
                for m in EMAIL_RE.finditer(html):
                    e = m.group(0).strip().lower()
                    if _is_valid_email(e):
                        emails.add(e)
                for m in re.finditer(r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', html, re.IGNORECASE):
                    e = m.group(1).strip().lower()
                    if _is_valid_email(e):
                        emails.add(e)
        except Exception:
            continue
    return sorted(emails)


def scrape_maps(query: str, limit: int):
    results = []

    def extract(page):
        page.wait_for_selector('div[role="feed"]', timeout=15000)

        for _ in range(6):
            if len(results) >= limit:
                break
            feed = page.query_selector('div[role="feed"]')
            if feed:
                feed.evaluate('el => el.scrollBy(0, el.scrollHeight)')
            page.wait_for_timeout(1500)

        seen = set()
        cards = page.query_selector_all('div[role="article"]')
        for card in cards:
            if len(results) >= limit:
                break

            name = card.get_attribute('aria-label') or ''
            if not name or name in seen or 'Kunjungi situs' in name:
                continue
            seen.add(name)

            lat = lng = None
            maps_url = address = phone = website = ''
            emails = []

            try:
                link = card.query_selector('a.hfpxzc')
                if not link:
                    continue

                href = link.get_attribute('href') or ''
                lat, lng = coords_from_href(href)
                maps_url = href.split('?')[0] if href else ''

                try:
                    text = card.evaluate('el => el.innerText') or ''
                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    for i, line in enumerate(lines):
                        if i == 2 and line and not line.startswith(('★', '·')) and len(line) > 8:
                            address = line
                            break
                except Exception:
                    pass

                try:
                    link.click()
                    page.wait_for_timeout(2500)

                    panel = (page.query_selector('[role="main"]') or
                             page.query_selector('div.m6QErb'))

                    if panel:
                        p = _val(panel.query_selector('[data-item-id^="phone:tel:"]'), 'data-item-id')
                        if p:
                            phone = p.replace('phone:tel:', '')

                        w = _val(panel.query_selector('[data-item-id="authority"]'), 'href')
                        if w and w.startswith('http'):
                            website = w

                        a = _val(panel.query_selector('[data-item-id="address"]'), 'aria-label')
                        if not a:
                            a = _val(panel.query_selector('[data-item-id="address"]'))
                        if a:
                            address = a

                    page.evaluate('() => { document.querySelector("[aria-label=Close]")?.click(); }')
                    page.wait_for_timeout(1000)
                except Exception:
                    pass

                if website:
                    try:
                        emails = scrape_emails_from_website(website)
                    except Exception:
                        pass
            except Exception:
                pass

            results.append({
                "name": name,
                "address": address,
                "phone": phone,
                "website": website,
                "emails": emails,
                "maps_url": maps_url,
                "lat": lat,
                "lng": lng,
                "category": query,
            })

    DynamicFetcher.fetch(
        f'https://www.google.com/maps/search/{query.replace(" ", "+")}',
        headless=True,
        network_idle=True,
        timeout=180000,
        page_action=extract,
    )

    print(json.dumps(results[:limit]))


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "klinik gigi"
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    scrape_maps(query, limit)
