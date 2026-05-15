"""
Market intelligence scraper.

CLI:
    python market_scraper.py <industry> <region> [limit]

Produces a JSON list of records suitable for the `market_data` table:
[
  {
    "source": "google_maps" | "manual",
    "data_type": "competitor_listing" | "pricing_signal" | "industry_news"
                  | "trend_signal" | "demand_signal" | "regulatory",
    "title": "...",
    "url": "...",
    "industry": "...",
    "region": "...",
    "payload": { ... }
  },
  ...
]

For the hackathon scope this is a thin scraper:
 - Tries to pull competitor listings via scrapling (same dynamic fetcher as
   maps_scraper.py)
 - If scrapling fails (no Playwright, network blocked, etc.) we still return
   a small synthetic-fallback set so the downstream multi-agent pipeline has
   something to reason about. The fallback is clearly tagged with source =
   "manual" so the AI agents know its provenance.
"""

import sys
import json
from datetime import datetime, timezone

try:
    from scrapling.fetchers import DynamicFetcher  # type: ignore
    SCRAPLING_AVAILABLE = True
except Exception:  # pragma: no cover - depends on env
    SCRAPLING_AVAILABLE = False


def scrape_competitors_via_maps(industry: str, region: str, limit: int):
    """Best-effort Google Maps scrape for competitor listings in the segment."""
    if not SCRAPLING_AVAILABLE:
        return []

    results = []

    def extract(page):
        try:
            page.wait_for_selector('div[role="feed"]', timeout=15000)
        except Exception:
            return

        for _ in range(4):
            if len(results) >= limit:
                break
            feed = page.query_selector('div[role="feed"]')
            if feed:
                feed.evaluate('el => el.scrollBy(0, el.scrollHeight)')
            page.wait_for_timeout(1200)

        seen = set()
        cards = page.query_selector_all('div[role="article"]')
        for card in cards:
            if len(results) >= limit:
                break
            name = card.get_attribute('aria-label') or ''
            if not name or name in seen:
                continue
            seen.add(name)

            results.append({
                "source": "google_maps",
                "data_type": "competitor_listing",
                "title": name,
                "url": None,
                "industry": industry,
                "region": region,
                "payload": {
                    "name": name,
                    "category": industry,
                    "region": region,
                    "discovered_at": datetime.now(timezone.utc).isoformat(),
                },
            })

    try:
        query = f"{industry} in {region}".replace(" ", "+")
        DynamicFetcher.fetch(
            f'https://www.google.com/maps/search/{query}',
            headless=True,
            network_idle=True,
            timeout=45000,
            page_action=extract,
        )
    except Exception as e:  # pragma: no cover
        print(f"[market_scraper] scrapling fetch failed: {e}", file=sys.stderr)

    return results[:limit]


def synthetic_fallback(industry: str, region: str, limit: int):
    """
    Produces a deterministic-ish fallback set across all 5 data_types so the
    multi-agent pipeline has something to reason about even when live scraping
    is unavailable. Tagged source='manual' for transparency.
    """
    now = datetime.now(timezone.utc).isoformat()

    fallback = [
        {
            "source": "manual",
            "data_type": "competitor_listing",
            "title": f"Sample Competitor A ({industry})",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "name": f"Sample Competitor A",
                "category": industry,
                "price_position": "mid-market",
                "signal": "active in segment, moderate reviews",
                "discovered_at": now,
            },
        },
        {
            "source": "manual",
            "data_type": "competitor_listing",
            "title": f"Sample Competitor B ({industry})",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "name": f"Sample Competitor B",
                "category": industry,
                "price_position": "premium",
                "signal": "premium positioning, strong brand",
                "discovered_at": now,
            },
        },
        {
            "source": "manual",
            "data_type": "pricing_signal",
            "title": f"Median pricing band — {industry} / {region}",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "median_idr": 35000,
                "low_idr": 22000,
                "high_idr": 60000,
                "sample_size": 12,
                "note": "fallback baseline — replace with live scrape",
            },
        },
        {
            "source": "manual",
            "data_type": "industry_news",
            "title": f"{industry} category growing in {region}",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "headline": f"{industry} sector sees double-digit growth in {region}",
                "sentiment": "positive",
                "summary": "Sample synthetic news fallback for demo.",
                "published_at": now,
            },
        },
        {
            "source": "manual",
            "data_type": "trend_signal",
            "title": f"Search demand trend — {industry}",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "trend_direction": "growing",
                "growth_pct_yoy": 18,
                "source": "synthetic baseline",
                "captured_at": now,
            },
        },
        {
            "source": "manual",
            "data_type": "demand_signal",
            "title": f"Consumer sentiment — {industry} / {region}",
            "url": None,
            "industry": industry,
            "region": region,
            "payload": {
                "willingness_to_pay": "moderate",
                "buying_triggers": ["quality", "convenience", "price"],
                "captured_at": now,
            },
        },
    ]
    return fallback[:limit]


def main():
    industry = sys.argv[1] if len(sys.argv) > 1 else "coffee shop"
    region = sys.argv[2] if len(sys.argv) > 2 else "Jakarta"
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    results = scrape_competitors_via_maps(industry, region, limit)

    # Top up with fallback if live scrape was thin or empty.
    if len(results) < 4:
        fallback = synthetic_fallback(industry, region, limit)
        # Avoid duplicating competitor entries we already have.
        existing_titles = {r["title"] for r in results}
        for r in fallback:
            if r["title"] not in existing_titles and len(results) < limit:
                results.append(r)

    print(json.dumps(results))


if __name__ == "__main__":
    main()
