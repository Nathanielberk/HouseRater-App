# API Research Summary for House Management

## Research Date: January 2025

## Overview

This document summarizes research into available APIs for automating house data entry in the HouseRater application.

## Google Maps Platform APIs ✅ RECOMMENDED

### 1. Google Places API (Address Autocomplete)

**What it provides:**
- ✅ Address autocomplete as user types
- ✅ Full formatted address validation
- ✅ City, state, ZIP extraction
- ✅ Latitude/longitude coordinates
- ✅ Neighborhood/district names

**What it does NOT provide:**
- ❌ Property details (bedrooms, bathrooms, square footage)
- ❌ Price information
- ❌ Property characteristics

**Pricing:**
- Free tier: $200/month credit
- Autocomplete: $2.83 per 1,000 requests
- Geocoding: $5 per 1,000 requests
- **Typical usage**: 100 houses/month = $0.28 (FREE)

**Recommendation:** ✅ **YES - Implement in Phase 1**

---

### 2. Google Street View Static API

**What it provides:**
- ✅ Static images of properties from street level
- ✅ Works directly with addresses (auto-geocodes)
- ✅ Multiple image sizes (max 640x640px)
- ✅ No manual photo upload needed
- ✅ Automatically updated by Google

**Pricing:**
- $0.007 per image
- Same $200/month free credit
- **Typical usage**: 100 houses = $0.70 (FREE)

**Recommendation:** ✅ **YES - Implement in Phase 1**

**Example usage:**
```typescript
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(address)}&key=${apiKey}`
```

---

### 3. Google Maps JavaScript API (Map View)

**What it provides:**
- ✅ Interactive map display
- ✅ Custom markers for houses
- ✅ Info windows on click
- ✅ Automatic centering and zoom
- ✅ Mobile-responsive

**Pricing:**
- Dynamic Maps: $7 per 1,000 loads
- **Typical usage**: 100 map views/month = $0.70 (FREE)

**Recommendation:** ✅ **YES - Implement in Phase 2**

---

## Property Data APIs ⚠️ NOT RECOMMENDED

### 1. Public Tax Assessor Records

**What's available:**
- ✅ Bedrooms, bathrooms
- ✅ Square footage, lot size
- ✅ Year built
- ✅ Property type
- ✅ Tax assessment values
- ✅ Last sale price/date

**Problems:**
- ❌ No free national API
- ❌ Each county has different system
- ❌ Most counties don't offer APIs
- ❌ Would require web scraping (unreliable)

**Sources:**
- Individual county assessor websites (free, but manual)
- Commercial aggregators (expensive)

**Recommendation:** ❌ **NO - Skip for MVP**

---

### 2. Commercial Real Estate APIs

#### Option A: ATTOM Data Solutions
- **Coverage**: 158M+ US properties
- **Data**: Full property details, tax records, sales history
- **Pricing**: $850-$2,000/month
- **Free trial**: 30 days
- **Verdict**: ❌ Too expensive for consumer app

#### Option B: Estated API
- **Coverage**: Nationwide US properties
- **Data**: Bedrooms, bathrooms, sqft, lot size, year built, tax values
- **Pricing**: $49/month for 10,000 calls
- **Free trial**: 14 days, 500 calls/day
- **Verdict**: ⚠️ Consider for Phase 2 (optional auto-fill)

#### Option C: TaxNetUSA
- **Coverage**: 300+ counties (TX and FL focus)
- **Data**: Property characteristics, tax data
- **Pricing**: Custom quotes
- **Verdict**: ❌ Limited coverage

#### Option D: Zillow API
- **Status**: ❌ Deprecated
- **Availability**: No longer available for new developers
- **Verdict**: ❌ Not an option

---

### 3. MLS (Multiple Listing Service) APIs

**What they provide:**
- ✅ Active listings data
- ✅ Property details
- ✅ Photos
- ✅ Pricing

**Problems:**
- ❌ Requires real estate license or partnership
- ❌ Expensive for small-scale use
- ❌ Only shows active listings (not all properties)

**Recommendation:** ❌ **NO - Not practical**

---

## Final Recommendations

### Phase 1 (MVP) - CONFIRMED

**Implement:**
1. ✅ Google Places API - Address autocomplete and validation
2. ✅ Google Street View API - Automatic property images
3. ✅ Manual entry - All property details (bedrooms, price, etc.)

**Don't implement:**
- ❌ Property data APIs (too expensive or unavailable)
- ❌ Public records scraping (unreliable, violates TOS)

**Why this approach:**
- **Free**: Within Google's $200/month credit
- **Simple**: No complex API integrations
- **Reliable**: Google's APIs are stable and well-documented
- **User-friendly**: Users can copy/paste from Zillow/Realtor.com
- **Flexible**: Works for unlisted properties, new construction

---

### Phase 2 (Future Enhancement)

**Consider adding:**
1. ⏭️ Estated API integration ($49/month)
   - Auto-fill property details when available
   - Keep manual entry as fallback
   - User can override auto-filled data

2. ⏭️ Manual photo upload
   - Supplement Street View with interior photos
   - Allow multiple photos per house

3. ⏭️ Additional Google Maps features
   - Driving distance calculator
   - Commute time estimates
   - Nearby amenities (schools, parks, grocery)

---

## Cost Summary

### Phase 1 (MVP)
- **Monthly cost**: $0 (free tier covers usage)
- **APIs used**:
  - Google Places Autocomplete
  - Google Street View Static
  - Google Maps JavaScript (Phase 2)

**Expected usage for 100 houses/month:**
- Autocomplete: $0.28
- Street View: $0.70
- **Total: $0.98 (covered by $200 credit)**

### Phase 2 (with Estated)
- **Monthly cost**: $49 + $0.98 = ~$50/month
- **Benefit**: Auto-fill property details
- **Decision**: Optional, evaluate based on user feedback

---

## Technical Implementation

### Required Environment Variables

```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Required NPM Packages

```bash
npm install @react-google-maps/api
```

### APIs to Enable in Google Cloud Console

1. Places API
2. Maps JavaScript API
3. Geocoding API
4. Street View Static API

---

## User Experience Comparison

### With APIs (Recommended):
```
1. User types "123 Main..."
2. Google suggests addresses
3. User selects → Address, city, state, ZIP auto-filled
4. Street View image auto-loads
5. User enters bedrooms, price, etc. (30 seconds)
6. Total time: ~1-2 minutes per house ✅
```

### Without APIs (Manual only):
```
1. User types full address manually
2. User types city, state, ZIP
3. User uploads photo manually
4. User enters all property details
5. Total time: ~3-5 minutes per house ❌
```

**Time savings**: 50-60% faster with APIs

---

## Security Considerations

### API Key Protection

✅ **Properly configured:**
- API key in environment variables (not committed to git)
- API restrictions enabled (HTTP referrers)
- API scope limited (only needed APIs enabled)
- Rate limiting enforced by Google

❌ **Avoid:**
- Hardcoding API keys in code
- Exposing keys in client-side code without restrictions
- Enabling unnecessary APIs

### Data Privacy

✅ **Good practices:**
- Addresses are public information
- Google Street View shows public street view only
- No private interior photos via API
- User data stays in our database

---

## Conclusion

**For HouseRater MVP, use:**
- ✅ Google Places API (address autocomplete)
- ✅ Google Street View API (automatic images)
- ✅ Google Maps JavaScript API (map view - Phase 2)
- ✅ Manual entry (property details)

**Skip for now:**
- ❌ Property data APIs (expensive, unnecessary)
- ❌ Public records scraping (unreliable, violates TOS)
- ❌ MLS integration (impractical for consumer app)

**Cost**: $0/month (free tier)

**User experience**: Fast, simple, reliable

**Implementation time**: ~12 hours for complete Phase 1
