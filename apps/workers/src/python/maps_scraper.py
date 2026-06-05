import sys
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urljoin, urlparse
from scrapling.fetchers import DynamicFetcher
from curl_cffi import requests as http

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
WA_RE    = re.compile(r'(?:wa\.me/|api\.whatsapp\.com/send\?phone=|whatsapp\.com/send\?phone=)(\d{8,15})', re.IGNORECASE)

JUNK_DOMAINS = (
    'example.com', 'sentry.io', 'wixpress.com', 'w3.org',
    'schema.org', 'googleapis.com', 'gstatic.com', 'facebook.com',
    'twitter.com', 'instagram.com', 'youtube.com', 'whatsapp.com',
    'tiktok.com', 'linkedin.com', 'pngtree.com', 'localhost',
    'no-reply', 'noreply', '.png', '.jpg', '.gif', '.svg',
)

HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
}

# Check high-yield paths for email/WhatsApp enrichment
CONTACT_PATHS = ['/', '/contact', '/kontak', '/hubungi-kami', '/about', '/about-us', '/contact-us', '/email', '/team']


# ── Helpers ────────────────────────────────────────────────────────────────────

def coords_from_href(href: str):
    # Primary: !3d!4d URL encoding
    m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', href)
    if m:
        return float(m.group(1)), float(m.group(2))
    # Fallback: @lat,lng
    m2 = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', href)
    if m2:
        return float(m2.group(1)), float(m2.group(2))
    return None, None


def _val(el, attr=None):
    try:
        return el.get_attribute(attr).strip() if attr else el.inner_text().strip()
    except Exception:
        return ''


def _is_valid_email(email: str) -> bool:
    e = email.lower()
    return not any(j in e for j in JUNK_DOMAINS)


# ── Website enrichment (email + WhatsApp) ─────────────────────────────────────

def enrich_from_website(url: str) -> dict:
    """Scrape emails and WhatsApp numbers from a business website."""
    parsed = urlparse(url)
    base = f'{parsed.scheme}://{parsed.netloc}'
    emails = set()
    whatsapp = set()

    for path in CONTACT_PATHS:
        try:
            resp = http.get(
                urljoin(base, path),
                headers=HTTP_HEADERS,
                timeout=6,
                impersonate='chrome',
            )
            if resp.status_code != 200:
                continue

            html = resp.text

            # Emails
            for m in EMAIL_RE.finditer(html):
                e = m.group(0).strip().lower()
                if _is_valid_email(e):
                    emails.add(e)
            for m in re.finditer(r'mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})', html, re.IGNORECASE):
                e = m.group(1).strip().lower()
                if _is_valid_email(e):
                    emails.add(e)

            # WhatsApp numbers
            for m in WA_RE.finditer(html):
                number = m.group(1).lstrip('0')
                # Normalize Indonesian numbers: 62xxxx
                if not number.startswith('62'):
                    number = '62' + number
                whatsapp.add('+' + number)

            # Stop early if we already found both
            if emails and whatsapp:
                break

        except Exception:
            continue

    return {
        'emails': sorted(emails),
        'whatsapp': sorted(whatsapp),
    }


def enrich_all_parallel(website_map: dict) -> dict:
    """
    Enrich all leads with emails + WhatsApp in parallel.
    website_map: {lead_name: website_url}
    Returns: {lead_name: {emails: [...], whatsapp: [...]}}
    """
    results = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(enrich_from_website, url): name
            for name, url in website_map.items() if url
        }
        for future in as_completed(futures, timeout=50):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception:
                results[name] = {'emails': [], 'whatsapp': []}
    return results


# ── Main scraper ───────────────────────────────────────────────────────────────

def scrape_maps(query: str, limit: int):
    raw_leads = []

    def extract(page):
        page.wait_for_selector('div[role="feed"]', timeout=15000)

        # Smart scroll — stop when card count stops growing
        prev_count = 0
        for _ in range(12):
            if len(raw_leads) >= limit:
                break
            feed = page.query_selector('div[role="feed"]')
            if feed:
                feed.evaluate('el => el.scrollBy(0, el.scrollHeight)')
            page.wait_for_timeout(900)
            curr_count = len(page.query_selector_all('div[role="article"]'))
            if curr_count == prev_count and curr_count > 0:
                break
            prev_count = curr_count

        seen = set()
        cards = page.query_selector_all('div[role="article"]')

        # ── Phase 1: collect map data for each card ──
        for card in cards:
            if len(raw_leads) >= limit:
                break

            name = (card.get_attribute('aria-label') or '').strip()
            # Skip empty, too short, junk system strings, or already-seen
            JUNK_NAMES = {'json', 'null', 'undefined', 'loading', 'load'}
            if not name or len(name) < 3 or name.lower() in JUNK_NAMES or 'Kunjungi situs' in name:
                continue
            if name in seen:
                continue
            seen.add(name)

            lat = lng = None
            maps_url = address = phone = website = category = ''

            try:
                link = card.query_selector('a.hfpxzc')
                if not link:
                    continue

                href = link.get_attribute('href') or ''
                lat, lng = coords_from_href(href)
                maps_url = href.split('?')[0] if href else ''

                # Best-effort address from card text (before clicking)
                try:
                    text = card.evaluate('el => el.innerText') or ''
                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    for line in lines[1:4]:
                        if not line.startswith(('★', '·', '(', '+')) and len(line) > 8:
                            address = line
                            break
                except Exception:
                    pass

                # Click card → get phone, website, full address, category from panel
                try:
                    link.click()
                    # Wait for any of the detail fields to appear — retry up to 2x
                    panel_found = False
                    for _attempt in range(2):
                        try:
                            page.wait_for_selector(
                                '[data-item-id^="phone:tel:"], [data-item-id="authority"], [data-item-id="address"]',
                                timeout=4000,
                                state='attached',
                            )
                            panel_found = True
                            break
                        except Exception:
                            if _attempt == 0:
                                page.wait_for_timeout(800)
                            continue

                    panel = (
                        page.query_selector('[role="main"]') or
                        page.query_selector('div.m6QErb')
                    )

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

                        # Real category from panel (not just the search query)
                        for sel in ['button[jsaction*="category"]', '[jsaction*="category"]', '[data-item-id="category"]']:
                            cat_el = panel.query_selector(sel)
                            if cat_el:
                                category = _val(cat_el)
                                break

                    # Close the panel
                    page.evaluate('() => { const btn = document.querySelector("[aria-label=Close],[aria-label=Tutup]"); if(btn) btn.click(); }')
                    page.wait_for_timeout(400)

                except Exception as e:
                    print(f'[WARN] Panel error for "{name}": {e}', file=sys.stderr)

            except Exception as e:
                print(f'[WARN] Card error for "{name}": {e}', file=sys.stderr)
                continue

            raw_leads.append({
                'name':     name,
                'address':  address,
                'phone':    phone,
                'website':  website,
                'maps_url': maps_url,
                'lat':      lat,
                'lng':      lng,
                'category': category or query,
                'emails':   [],
                'whatsapp': [],
            })

        # ── Phase 2: parallel email + WhatsApp enrichment ──
        website_map = {r['name']: r['website'] for r in raw_leads if r.get('website')}
        if website_map:
            print(f'[Info] Enriching {len(website_map)} websites in parallel...', file=sys.stderr)
            enriched = enrich_all_parallel(website_map)
            for r in raw_leads:
                data = enriched.get(r['name'], {})
                r['emails']   = data.get('emails', [])
                r['whatsapp'] = data.get('whatsapp', [])

    DynamicFetcher.fetch(
        f'https://www.google.com/maps/search/{query.replace(" ", "+")}',
        headless=True,
        network_idle=True,
        timeout=180000,
        page_action=extract,
    )

    print(json.dumps(raw_leads[:limit]))


if __name__ == '__main__':
    query = sys.argv[1] if len(sys.argv) > 1 else 'klinik gigi'
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    scrape_maps(query, limit)
