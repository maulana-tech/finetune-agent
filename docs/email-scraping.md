# Email Scraping Documentation

## Overview

Email scraping **sudah terintegrasi** dalam maps scraper. Setiap kali scrape business dari Google Maps, sistem otomatis:
1. ✅ Extract website URL dari business listing
2. ✅ Visit website untuk mencari email addresses
3. ✅ Check multiple contact pages (`/contact`, `/kontak`, `/about`, dll)
4. ✅ Extract & filter emails
5. ✅ Save ke database sebagai JSONB array

---

## Flow Diagram

```
User trigger scrape
        ↓
[Maps Scraper Python]
        ↓
For each business:
  1. Extract from Google Maps:
     - Name, address, phone
     - Website URL
     - Maps URL, coordinates
        ↓
  2. IF website exists:
     → scrape_emails_from_website(url)
        ↓
     Visit pages:
       - / (homepage)
       - /contact
       - /kontak
       - /about
       - /tentang
       - /tentang-kami
       - /hubungi-kami
        ↓
     Extract emails using regex:
       - Pattern: name@domain.com
       - Filter junk domains
       - Return unique emails
        ↓
  3. Return JSON:
     {
       "name": "...",
       "emails": ["contact@example.com", ...],
       ...
     }
        ↓
[Worker saves to DB]
  - Table: leads
  - Column: emails (JSONB)
  - AI prompt includes emails
```

---

## Code Locations

### 1. Python Scraper
**File:** `apps/workers/src/python/maps_scraper.py`

**Key Functions:**

#### `scrape_emails_from_website(url: str) -> list`
```python
def scrape_emails_from_website(url: str) -> list:
    """
    Visit contact pages and extract email addresses.
    
    Checks pages:
    - / (homepage)
    - /contact, /kontak
    - /about, /tentang, /tentang-kami
    - /hubungi-kami
    
    Returns:
        list: Unique, validated email addresses
    """
```

**Email Validation:**
- Regex: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Filters junk domains:
  - example.com, sentry.io, wixpress.com
  - no-reply, noreply
  - Social media (facebook, twitter, instagram, etc)
  - Image extensions (.png, .jpg, .gif, .svg)

**Integration Point:**
```python
# Line 140-144
if website:
    try:
        emails = scrape_emails_from_website(website)
    except Exception:
        pass

# Line 153
results.append({
    "emails": emails,  # ← Included in result
    ...
})
```

---

### 2. Worker
**File:** `apps/workers/src/queues/scrape.worker.ts`

**Processing:**
```typescript
// Line 49: Extract emails from scraper result
const emails = (res.emails as string[]) || [];

// Line 59: Save to database
emails: emails.length > 0 ? emails : undefined,

// Line 72: Include in AI agent prompt
emails.length > 0 && `Emails: ${emails.join(', ')}`
```

**AI Agent Context:**
Emails dikirim ke AI agent untuk:
- Lead scoring (contact availability)
- Personalized outreach suggestions
- Business legitimacy assessment

---

### 3. Database Schema
**File:** `packages/db/src/schema/leads.ts`

```typescript
export const leads = pgTable('leads', {
  // ...
  emails: jsonb('emails').$type<string[]>(),
  // ...
});
```

**Storage:**
- Type: JSONB array
- Example: `["contact@business.com", "info@business.com"]`
- Nullable: Jika tidak ada email, field = `null`

---

## Dependencies

### Python Packages
```txt
# requirements.txt
scrapling[fetchers]>=0.4  # For maps scraping
curl-cffi>=0.6.0          # For HTTP requests (email scraping)
```

**Install:**
```bash
cd apps/workers
source .venv/bin/activate
pip install -r requirements.txt
```

---

## Testing

### Manual Test
```bash
# Test scraper directly
cd apps/workers
.venv/bin/python src/python/maps_scraper.py "coffee shop jakarta" 3

# Expected output (JSON):
[
  {
    "name": "Kopi Kenangan",
    "address": "Jl. Sudirman No. 123",
    "phone": "+62 21 1234567",
    "website": "https://kopikenangan.com",
    "emails": ["hello@kopikenangan.com"],  ← Should have emails!
    "maps_url": "https://maps.google.com/...",
    "lat": -6.123,
    "lng": 106.456,
    "category": "coffee shop jakarta"
  }
]
```

### Automated Test
```bash
# Run test script
pnpm scraper:test

# Shows:
# - Number of results
# - Websites found
# - Emails extracted
# - Success rate
```

---

## Troubleshooting

### No emails found

**Possible causes:**

1. **Website tidak punya contact page**
   - Solution: Expand contact page paths
   - Add more common Indonesian contact page paths

2. **Email format tidak standard**
   - Solution: Improve regex pattern
   - Add support for obfuscated emails (e.g., "hello [at] domain [dot] com")

3. **Website blocks scraping**
   - Solution: Already using `curl_cffi` with Chrome impersonation
   - Add rate limiting if needed

4. **Timeout issues**
   - Current: 8s per page
   - Adjust if needed for slow websites

### curl_cffi import error

```bash
# Install dependency
cd apps/workers
source .venv/bin/activate
pip install curl-cffi>=0.6.0
```

### Rate limiting

If too many requests:
```python
# Add delay between page visits in scrape_emails_from_website()
import time
time.sleep(1)  # 1 second delay
```

---

## Performance

### Current Settings
- **Contact pages checked:** 7 pages per business
- **Timeout per page:** 8 seconds
- **Max emails per business:** Unlimited (all unique emails found)
- **Concurrent requests:** Sequential (one page at a time)

### Optimization Options

1. **Reduce pages checked:**
   ```python
   CONTACT_PATHS = ['/', '/contact']  # Only 2 pages
   ```

2. **Parallel page checking:**
   ```python
   # Use asyncio for concurrent requests
   # Trade-off: Faster but may trigger rate limits
   ```

3. **Cache website visits:**
   ```python
   # Store website -> emails mapping in Redis
   # Skip re-scraping if website already checked
   ```

---

## Configuration

### Environment Variables
None required — email scraping is always-on when website exists.

### Disable Email Scraping (if needed)
```python
# In maps_scraper.py, comment out:
# if website:
#     try:
#         emails = scrape_emails_from_website(website)
#     except Exception:
#         pass
```

---

## Example Output

### With Emails
```json
{
  "name": "Warung Makan Sederhana",
  "address": "Jl. Kebon Jeruk No. 45",
  "phone": "+62 812 3456 7890",
  "website": "https://warungmakan.com",
  "emails": [
    "info@warungmakan.com",
    "order@warungmakan.com"
  ],
  "maps_url": "https://maps.google.com/?cid=123456789",
  "lat": -6.2,
  "lng": 106.8,
  "category": "restaurant jakarta"
}
```

### Without Emails
```json
{
  "name": "Toko Kelontong",
  "address": "Jl. Raya No. 1",
  "phone": "+62 21 9876543",
  "website": null,
  "emails": [],  ← Empty array if no website or emails found
  "maps_url": "https://maps.google.com/?cid=987654321",
  "lat": -6.3,
  "lng": 106.9,
  "category": "grocery store jakarta"
}
```

---

## Database Query Examples

### Find leads with emails
```sql
SELECT name, website, emails 
FROM leads 
WHERE emails IS NOT NULL 
  AND jsonb_array_length(emails) > 0;
```

### Count leads by email availability
```sql
SELECT 
  COUNT(*) FILTER (WHERE emails IS NOT NULL) as with_email,
  COUNT(*) FILTER (WHERE emails IS NULL) as without_email
FROM leads;
```

### Get all unique emails
```sql
SELECT DISTINCT jsonb_array_elements_text(emails) as email
FROM leads
WHERE emails IS NOT NULL;
```

---

## Future Improvements

### 1. Email Verification
- Validate email format more strictly
- Check MX records for domain validity
- Verify email deliverability

### 2. Enhanced Extraction
- Support for obfuscated emails
- Extract from JavaScript-rendered content
- Parse structured data (schema.org)

### 3. Caching
- Store website → emails mapping in Redis
- TTL: 30 days (emails don't change often)
- Reduce redundant scraping

### 4. Analytics
- Track email extraction success rate
- Monitor which contact page paths are most effective
- Identify businesses with/without emails

---

## API Response

When fetching leads via API, emails are included:

**GET /leads/:id**
```json
{
  "id": "uuid",
  "name": "Business Name",
  "emails": ["contact@business.com"],
  ...
}
```

**GET /leads**
```json
{
  "leads": [
    {
      "id": "uuid",
      "emails": ["info@example.com", "sales@example.com"],
      ...
    }
  ]
}
```

---

## Summary

✅ **Email scraping SUDAH AKTIF** di maps scraper  
✅ **Automatically runs** saat business punya website  
✅ **Saves to database** sebagai JSONB array  
✅ **Sent to AI agents** untuk lead intelligence  
✅ **No additional setup needed** — works out of the box  

**To verify:** Run a scrape job dari dashboard → check leads table → `emails` column should be populated untuk businesses dengan website yang punya contact info.
