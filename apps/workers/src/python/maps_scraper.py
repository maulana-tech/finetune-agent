import sys
import json
import re
from scrapling.fetchers import DynamicFetcher


def coords_from_href(href: str):
    # Google Maps place URLs encode coords as !3d<lat>!4d<lng>
    m = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', href)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


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

            lat, lng = None, None
            snippet = ''

            try:
                link = card.query_selector('a.hfpxzc')
                if link:
                    href = link.get_attribute('href') or ''
                    lat, lng = coords_from_href(href)
            except Exception:
                pass

            try:
                detail = card.query_selector('[role="article"] > div > div > div')
            except Exception:
                detail = None

            results.append({
                "name": name,
                "address": '',
                "phone": '',
                "website": '',
                "lat": lat,
                "lng": lng,
                "category": query,
            })

    DynamicFetcher.fetch(
        f'https://www.google.com/maps/search/{query.replace(" ", "+")}',
        headless=True,
        network_idle=True,
        timeout=45000,
        page_action=extract,
    )

    print(json.dumps(results[:limit]))


if __name__ == "__main__":
    query = sys.argv[1] if len(sys.argv) > 1 else "klinik gigi"
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    scrape_maps(query, limit)
