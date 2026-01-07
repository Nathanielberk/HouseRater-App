# Module 5: House Management - Implementation Plan

## Overview

Module 5 enables household members to add, view, edit, and manage houses they're considering. This is a prerequisite for Module 4 (House Rating) - users need houses to rate!

## Key Goals

1. **Quick house addition** via address lookup
2. **Auto-populate** publicly available property data when possible
3. **Simple manual entry** for fields that can't be auto-filled
4. **Clean house list** view with key details
5. **Detailed house view** with all information
6. **Easy editing** of house details
7. **Safe deletion** with confirmation

## Publicly Available House Data

### Easily Obtainable (via APIs)

Based on research, here's what can be reliably auto-filled:

#### **Google Places API / Geocoding** (Free tier available) ✅ CONFIRMED
- ✅ **Full formatted address** (street, city, state, ZIP)
- ✅ **Latitude/longitude** (for mapping)
- ✅ **Address validation** (ensure address is real)
- ✅ **Address autocomplete** (as user types)
- ✅ **Neighborhood/district** name
- ❌ Property details (bedrooms, bathrooms, sqft) - NOT available

**Cost**:
- Free tier: $200/month credit (≈40,000 autocomplete requests)
- Address autocomplete: ~$2.83 per 1,000 requests
- Geocoding: ~$5 per 1,000 requests
- **Verdict**: Affordable for most use cases

#### **Google Street View Static API** (For house images) ✅ NEW!
- ✅ **Static image** of property from street
- ✅ **Works with addresses** (automatically geocodes)
- ✅ **Multiple sizes** available (max 640x640px)
- ✅ **No manual photo upload** needed
- ✅ **Automatically updated** by Google

**Cost**:
- $0.007 per image (≈28,000 images for $200 credit)
- Same $200/month credit as other Google APIs
- **Verdict**: Very affordable, excellent UX

**Usage**:
```typescript
// Generate Street View image URL from address
const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(address)}&key=${apiKey}`
```

**Benefits**:
- Instant visual of property
- No manual photo upload required
- Always current (Google updates regularly)
- Helps users remember which house is which

#### **Public Property Records** (Tax Assessor Data) ⚠️ LIMITED FREE ACCESS
- ✅ **Available**: Bedrooms, bathrooms, square footage, lot size, year built
- ✅ **Source**: County tax assessor databases
- ❌ **Free API access**: Very limited (most counties don't offer APIs)
- ❌ **National coverage**: No free nationwide API

**Options**:
1. **Commercial APIs** (ATTOM, TaxNetUSA)
   - ✅ 158M+ properties nationwide
   - ✅ Bedrooms, bathrooms, sqft, lot size, year built
   - ❌ Expensive: $850-$2,000/month
   - ❌ Overkill for consumer app

2. **Individual County Websites** (Free but manual)
   - ✅ Free access
   - ✅ Same data as commercial APIs
   - ❌ No API (must scrape or manual lookup)
   - ❌ Different interface per county
   - ❌ Not practical for our use case

**Recommendation**: **Manual entry only** for MVP
- Property data varies by county
- No free nationwide API solution
- Commercial APIs too expensive for consumer app
- Users can easily copy from listing sites (Zillow, Realtor.com)

#### **Real Estate APIs** (Property details)

**Option 1: Estated API** (Recommended)
- ✅ Bedrooms, bathrooms
- ✅ Square footage, lot size
- ✅ Year built
- ✅ Property type (single-family, condo, etc.)
- ✅ Last sale price & date
- ✅ Tax assessment value
- ✅ **Free tier**: 500 calls/day for 14-day trial
- ✅ **Paid**: $49/month for 10,000 calls

**Option 2: ATTOM Data**
- ✅ Comprehensive property data
- ✅ 30-day free trial
- ❌ Expensive: $850+/month after trial

**Option 3: Zillow (Deprecated)**
- ❌ API no longer publicly available for new developers
- ❌ Not recommended

**Option 4: Manual Entry Only (MVP Recommendation)**
- ✅ Free forever
- ✅ No API dependencies
- ✅ User controls data accuracy
- ✅ Works for unlisted/new construction
- ❌ More user effort

### Recommendation: Phased Approach ✅ UPDATED

**Phase 1 (MVP)** - CONFIRMED:
- ✅ **Google Places Autocomplete** for address validation and coordinates
- ✅ **Google Street View** for automatic house images
- ✅ **Manual entry** for all property details (bedrooms, price, etc.)
- ✅ **Map view** option for visualizing house locations
- ✅ **Archive** (soft delete) for houses no longer under consideration
- ✅ Only **address required**, all other fields optional

**Cost estimate**: **$0/month** (within free tier for typical use)

**Phase 2 (Enhanced)**:
- ⏭️ Manual photo upload (supplement Street View)
- ⏭️ Estated API integration for optional auto-fill
- ⏭️ Driving distance/time calculator
- ⏭️ School district lookup

**Phase 3 (Advanced)**:
- ⏭️ Multiple API sources with fallback
- ⏭️ MLS data integration (if available)
- ⏭️ Neighborhood data (crime, walkability, etc.)

## Data Model

### Database Schema: `houses` table

Already exists in initial schema:

```sql
CREATE TABLE houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  price DECIMAL(12, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),  -- e.g., 2.5 bathrooms
  square_feet INTEGER,
  lot_size_sqft INTEGER,
  year_built INTEGER,
  property_type TEXT,  -- 'single_family', 'condo', 'townhouse', 'multi_family'
  listing_url TEXT,
  notes TEXT,
  image_urls TEXT[],  -- Array of image URLs
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_houses_household ON houses(household_id);
CREATE INDEX idx_houses_active ON houses(household_id, is_active);
```

**No schema changes needed!** ✅

### Field Categorization

#### **Auto-filled (via Google Places API)**
- `address` - Validated, formatted address
- `city` - Extracted from address
- `state` - Extracted from address
- `zip_code` - Extracted from address
- `latitude` - For mapping
- `longitude` - For mapping

#### **User-entered (Always Manual)**
- `price` - Current asking price
- `bedrooms` - Number of bedrooms
- `bathrooms` - Number of bathrooms (can be .5 increments)
- `square_feet` - Total square footage
- `lot_size_sqft` - Lot size in square feet
- `year_built` - Year house was built
- `property_type` - Single-family, condo, townhouse, etc.
- `listing_url` - Link to Zillow/Realtor.com listing
- `notes` - General notes about the house
- `image_urls` - Photos of the house

#### **System-generated**
- `id` - UUID
- `household_id` - Current household
- `is_active` - Whether house is still under consideration
- `created_at` - When added
- `updated_at` - Last modified

## UI/UX Design

### 1. House List Page: `/dashboard/houses`

```
┌─────────────────────────────────────────────────────────┐
│ HouseRater | Dashboard                                    │
├─────────────────────────────────────────────────────────┤
│ Houses Under Consideration                               │
│                                                           │
│ [+ Add New House]                           🔍 Search    │
│                                                           │
│ Filters: [All] [Favorites] [Not Rated] [High Score]     │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 📍 123 Main St, Anytown, CA 90210                 │   │
│ │ $450,000                                           │   │
│ │ 🛏️ 3 bed  🛁 2 bath  📏 1,850 sqft                 │   │
│ │                                                    │   │
│ │ Rating Progress: ████████░░ 25/34 categories      │   │
│ │ Your Score: 4.2/5 ⭐                               │   │
│ │                                                    │   │
│ │ [View Details] [Rate House] [Edit] [Delete]      │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 📍 456 Oak Ave, Somewhere, CA 90211                │   │
│ │ $525,000                                           │   │
│ │ 🛏️ 4 bed  🛁 2.5 bath  📏 2,100 sqft               │   │
│ │                                                    │   │
│ │ Rating Progress: ░░░░░░░░░░ 0/34 categories       │   │
│ │ Not rated yet                                      │   │
│ │                                                    │   │
│ │ [View Details] [Rate House] [Edit] [Delete]      │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ Empty State (if no houses):                              │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🏠 No houses yet!                                  │   │
│ │ Add your first house to start rating.             │   │
│ │                                                    │   │
│ │ [+ Add Your First House]                          │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2. Add House Modal/Page: `/dashboard/houses/new`

```
┌─────────────────────────────────────────────────────────┐
│ Add New House                                      [✕]   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ Step 1: Find Address                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔍 Search for address...                            │ │
│ │                                                      │ │
│ │ Suggestions (as you type):                          │ │
│ │ • 123 Main Street, Anytown, CA 90210                │ │
│ │ • 1234 Main Street, Anytown, CA 90210               │ │
│ │ • 12345 Main Avenue, Anytown, CA 90210              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Selected Address: ✅ 123 Main St, Anytown, CA 90210      │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                           │
│ Step 2: Property Details                                 │
│                                                           │
│ Basic Information:                                        │
│ ┌──────────────────┐ ┌──────────────────┐               │
│ │ Price            │ │ Property Type    │               │
│ │ $450,000         │ │ Single Family ▼  │               │
│ └──────────────────┘ └──────────────────┘               │
│                                                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Bedrooms │ │ Bathrooms│ │ Sq Ft    │ │ Lot Size │    │
│ │    3     │ │   2.5    │ │  1,850   │ │  6,500   │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Year Built                                            ││
│ │ 1998                                                  ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ Additional Information:                                   │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Listing URL (optional)                                ││
│ │ https://zillow.com/...                                ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Notes (optional)                                      ││
│ │ Great neighborhood, near schools...                   ││
│ │                                                       ││
│ └──────────────────────────────────────────────────────┘│
│                                                           │
│              [Cancel]  [Save House]                       │
└─────────────────────────────────────────────────────────┘
```

### 3. House Details Page: `/dashboard/houses/[houseId]`

```
┌─────────────────────────────────────────────────────────┐
│ HouseRater | Back to Houses                               │
├─────────────────────────────────────────────────────────┤
│ 123 Main Street, Anytown, CA 90210                       │
│                                                           │
│ [🌍 View on Map] [🔗 View Listing] [✏️ Edit] [🗑️ Delete] │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                           │
│ Property Details                                          │
│                                                           │
│ Price:           $450,000                                │
│ Property Type:   Single Family Home                      │
│ Bedrooms:        3                                       │
│ Bathrooms:       2.5                                     │
│ Square Feet:     1,850                                   │
│ Lot Size:        6,500 sqft                              │
│ Year Built:      1998                                    │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                           │
│ Rating Progress                                           │
│                                                           │
│ Your Progress:   ████████░░░░░░ 25/34 (74%)             │
│ Your Score:      4.2 / 5.0 ⭐                            │
│                                                           │
│ Household Progress: ██████░░░░░░░░ 15/34 (44%)          │
│ Household Score:    3.8 / 5.0 ⭐                         │
│                                                           │
│ [Rate This House] [View Ratings]                        │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                           │
│ Notes                                                     │
│                                                           │
│ Great neighborhood, walkable to schools and parks.       │
│ Needs some kitchen updates but otherwise move-in ready.  │
│                                                           │
│ [Edit Notes]                                             │
│                                                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                           │
│ Added: Jan 15, 2025 by John Doe                         │
│ Last Updated: Jan 20, 2025                              │
└─────────────────────────────────────────────────────────┘
```

## Component Structure

```
HousesPage (Client Component)
├── HouseListHeader (search, filters, add button)
├── HouseCard[] (for each house)
│   ├── HouseAddress
│   ├── HouseBasicInfo (price, bed, bath, sqft)
│   ├── RatingProgress (progress bar)
│   ├── HouseScore (if rated)
│   └── ActionButtons (view, rate, edit, delete)
└── EmptyState (if no houses)

AddHouseModal/Page (Client Component)
├── AddressAutocomplete (Google Places)
├── AddressDisplay (selected address)
├── PropertyDetailsForm
│   ├── PriceInput
│   ├── PropertyTypeSelect
│   ├── BedroomsInput
│   ├── BathroomsInput
│   ├── SquareFeetInput
│   ├── LotSizeInput
│   ├── YearBuiltInput
│   ├── ListingURLInput
│   └── NotesTextarea
└── FormActions (cancel, save)

HouseDetailsPage (Client Component)
├── HouseHeader (address, action buttons)
├── PropertyDetailsSection
├── RatingProgressSection
│   ├── UserProgress
│   └── HouseholdProgress
├── NotesSection
└── MetadataSection (created, updated)
```

## Data Flow

### 1. Load Houses List

```typescript
const loadHouses = async () => {
  const supabase = createClient()

  // Get current household
  const { data: { user } } = await supabase.auth.getUser()
  const { data: householdUser } = await supabase
    .from('household_users')
    .select('household_id')
    .eq('auth_user_id', user.id)
    .single()

  // Get all active houses for household
  const { data: houses } = await supabase
    .from('houses')
    .select('*')
    .eq('household_id', householdUser.household_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // For each house, get rating progress
  // (optional - can be done on-demand)

  setHouses(houses)
}
```

### 2. Address Autocomplete (Google Places)

```typescript
import { useLoadScript, Autocomplete } from '@react-google-maps/api'

const AddressAutocomplete = ({ onAddressSelect }) => {
  const [autocomplete, setAutocomplete] = useState(null)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  })

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete)
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()

      // Extract address components
      const addressComponents = place.address_components
      const formattedAddress = place.formatted_address
      const location = place.geometry.location

      const address = {
        fullAddress: formattedAddress,
        street: getComponent(addressComponents, 'route'),
        streetNumber: getComponent(addressComponents, 'street_number'),
        city: getComponent(addressComponents, 'locality'),
        state: getComponent(addressComponents, 'administrative_area_level_1'),
        zipCode: getComponent(addressComponents, 'postal_code'),
        latitude: location.lat(),
        longitude: location.lng(),
      }

      onAddressSelect(address)
    }
  }

  if (!isLoaded) return <div>Loading...</div>

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['address'],  // Only show addresses, not businesses
        componentRestrictions: { country: 'us' },  // US only (adjust as needed)
      }}
    >
      <input
        type="text"
        placeholder="Search for address..."
        className="w-full px-4 py-2 border rounded-lg"
      />
    </Autocomplete>
  )
}
```

### 3. Add House

```typescript
const handleAddHouse = async (houseData) => {
  setSaving(true)

  try {
    const supabase = createClient()

    // Get current household
    const { data: householdUser } = await getCurrentHouseholdUser()

    // Insert house
    const { data: house, error } = await supabase
      .from('houses')
      .insert({
        household_id: householdUser.household_id,
        address: houseData.fullAddress,
        city: houseData.city,
        state: houseData.state,
        zip_code: houseData.zipCode,
        latitude: houseData.latitude,
        longitude: houseData.longitude,
        price: houseData.price,
        bedrooms: houseData.bedrooms,
        bathrooms: houseData.bathrooms,
        square_feet: houseData.squareFeet,
        lot_size_sqft: houseData.lotSize,
        year_built: houseData.yearBuilt,
        property_type: houseData.propertyType,
        listing_url: houseData.listingUrl,
        notes: houseData.notes,
      })
      .select()
      .single()

    if (error) throw error

    // Redirect to house details or list
    router.push(`/dashboard/houses/${house.id}`)
  } catch (err) {
    console.error('Error adding house:', err)
    setError('Failed to add house')
  } finally {
    setSaving(false)
  }
}
```

### 4. Edit House

```typescript
const handleEditHouse = async (houseId, updates) => {
  const { error } = await supabase
    .from('houses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', houseId)

  if (error) {
    console.error('Error updating house:', error)
  }
}
```

### 5. Archive House (Soft Delete)

```typescript
const handleArchiveHouse = async (houseId) => {
  // Confirm archival
  if (!confirm('Archive this house? It will be moved to your archive and can be restored later.')) {
    return
  }

  // Soft delete (set is_active = false) - moves to archive
  const { error } = await supabase
    .from('houses')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', houseId)

  if (error) {
    console.error('Error archiving house:', error)
  } else {
    // Redirect to house list with success message
    router.push('/dashboard/houses?archived=true')
  }
}

// Restore from archive
const handleRestoreHouse = async (houseId) => {
  const { error } = await supabase
    .from('houses')
    .update({
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', houseId)

  if (error) {
    console.error('Error restoring house:', error)
  }
}

// View archived houses
const loadArchivedHouses = async () => {
  const { data: houses } = await supabase
    .from('houses')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', false)  // Only archived
    .order('updated_at', { ascending: false })

  return houses
}
```

### 6. Get Rating Progress

```typescript
const getRatingProgress = async (houseId, userId) => {
  const supabase = createClient()

  // Get total active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', householdId)
    .eq('is_active', true)

  // Get user's ratings for this house
  const { data: ratings } = await supabase
    .from('house_ratings')
    .select('id')
    .eq('house_id', houseId)
    .eq('household_user_id', userId)

  const total = categories.length
  const rated = ratings.length
  const percentage = (rated / total) * 100

  return { rated, total, percentage }
}
```

## Features to Implement

### Phase 1: Core House Management (MVP)
1. ✅ Add house with Google Places address autocomplete
2. ✅ Manual entry for all property details
3. ✅ View list of all houses
4. ✅ View individual house details
5. ✅ Edit house details
6. ✅ Soft delete houses (set is_active = false)
7. ✅ Basic validation (required fields)

### Phase 2: Enhanced UX
1. ✅ Search/filter houses
2. ✅ Sort by price, date added, score
3. ✅ Favorite/star houses
4. ✅ Show rating progress on house cards
5. ✅ Quick actions (rate, edit, archive) on cards
6. ✅ **Map view** of all houses (using Google Maps)
7. ✅ **Street View integration** (automatic house images)
8. ✅ **Archive view** (see archived houses, restore if needed)

### Phase 3: Advanced Features
1. ⏭️ Manual image upload (supplement Street View)
2. ⏭️ Estated API integration for auto-fill
3. ⏭️ Bulk import from CSV
4. ⏭️ Export house list to PDF/Excel
5. ⏭️ House comparison view (side-by-side)
6. ⏭️ Driving distance calculator
7. ⏭️ School district lookup

## Map View Implementation

### Overview

The map view allows users to visualize all houses on an interactive map, making it easy to:
- See geographic distribution of houses
- Identify proximity to work, schools, amenities
- Compare commute distances visually
- Switch between list and map views

### UI Layout: Map View Toggle

```
┌─────────────────────────────────────────────────────────┐
│ Houses Under Consideration                               │
│                                                           │
│ View: [📋 List] [🗺️ Map] ← Toggle buttons              │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                    Google Map                        │ │
│ │                                                      │ │
│ │        📍 (Marker 1: 123 Main St)                   │ │
│ │                                                      │ │
│ │                  📍 (Marker 2: 456 Oak Ave)         │ │
│ │                                                      │ │
│ │   📍 (Marker 3: 789 Elm Rd)                         │ │
│ │                                                      │ │
│ │                                                      │ │
│ │   [Zoom controls]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Click marker to see house details                        │
└─────────────────────────────────────────────────────────┘
```

### Marker Info Window (on click)

```
┌─────────────────────────────────┐
│ 📍 123 Main St                  │
│ Anytown, CA 90210               │
│─────────────────────────────────│
│ $450,000                        │
│ 🛏️ 3 bed  🛁 2 bath             │
│ 📏 1,850 sqft                   │
│                                 │
│ Rating: ⭐ 4.2/5 (25/34 rated)  │
│                                 │
│ [View Details] [Rate House]    │
└─────────────────────────────────┘
```

### Implementation Code

```typescript
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'

const HousesMapView = ({ houses }) => {
  const [selectedHouse, setSelectedHouse] = useState(null)
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 })

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  })

  // Calculate map center based on houses
  useEffect(() => {
    if (houses.length > 0) {
      const avgLat = houses.reduce((sum, h) => sum + h.latitude, 0) / houses.length
      const avgLng = houses.reduce((sum, h) => sum + h.longitude, 0) / houses.length
      setMapCenter({ lat: avgLat, lng: avgLng })
    }
  }, [houses])

  if (!isLoaded) return <div>Loading map...</div>

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '600px' }}
      center={mapCenter}
      zoom={11}
    >
      {houses.map((house) => (
        <Marker
          key={house.id}
          position={{ lat: house.latitude, lng: house.longitude }}
          onClick={() => setSelectedHouse(house)}
          icon={{
            url: '/marker-house.svg',  // Custom house icon
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      ))}

      {selectedHouse && (
        <InfoWindow
          position={{ lat: selectedHouse.latitude, lng: selectedHouse.longitude }}
          onCloseClick={() => setSelectedHouse(null)}
        >
          <div className="p-2">
            <h3 className="font-bold">{selectedHouse.address}</h3>
            <p className="text-sm text-gray-600">
              {selectedHouse.city}, {selectedHouse.state} {selectedHouse.zip_code}
            </p>
            {selectedHouse.price && (
              <p className="font-semibold text-green-600">
                ${selectedHouse.price.toLocaleString()}
              </p>
            )}
            <p className="text-sm">
              {selectedHouse.bedrooms && `🛏️ ${selectedHouse.bedrooms} bed  `}
              {selectedHouse.bathrooms && `🛁 ${selectedHouse.bathrooms} bath`}
            </p>
            <div className="mt-2 flex gap-2">
              <Link href={`/dashboard/houses/${selectedHouse.id}`}>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                  View Details
                </button>
              </Link>
              <Link href={`/dashboard/houses/${selectedHouse.id}/rate`}>
                <button className="px-3 py-1 bg-green-600 text-white text-sm rounded">
                  Rate House
                </button>
              </Link>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
```

### Map View Features

1. **Automatic centering**: Centers map based on average position of all houses
2. **Custom markers**: House icon instead of default pin
3. **Info windows**: Click marker to see house preview
4. **Quick actions**: View details or rate house directly from map
5. **Responsive**: Works on mobile and desktop
6. **Color-coded markers** (Phase 2): Different colors based on rating status
   - Gray: Not rated yet
   - Yellow: Partially rated
   - Green: Fully rated

### Cost

Map views are covered by the same $200/month credit:
- **Dynamic Maps**: $7 per 1,000 loads
- **Static Maps**: $2 per 1,000 loads
- **Typical usage**: ~100 map loads/month = $0.70
- **Verdict**: Well within free tier

## Google Maps API Setup

### 1. Get API Key

```bash
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Go to Credentials → Create API Key
5. Restrict key (recommended):
   - Application restrictions: HTTP referrers
   - API restrictions: Places API, Geocoding API
6. Copy API key
```

### 2. Add to Environment Variables

```env
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
npm install @react-google-maps/api
```

## Field Validation Rules

### Required Fields
- `address` - Full address (via autocomplete)

### Optional Fields
- `price` - Numeric, positive
- `bedrooms` - Integer, 0-20
- `bathrooms` - Decimal, 0-10 (allow .5 increments)
- `square_feet` - Integer, positive
- `lot_size_sqft` - Integer, positive
- `year_built` - Integer, 1800-current year
- `property_type` - One of predefined options
- `listing_url` - Valid URL format
- `notes` - Max 2000 characters
- `image_urls` - Array of valid URLs

### Validation Messages

```typescript
const validateHouse = (data) => {
  const errors = {}

  if (!data.address) {
    errors.address = 'Address is required'
  }

  if (!data.price || data.price <= 0) {
    errors.price = 'Valid price is required'
  }

  if (data.bedrooms && (data.bedrooms < 0 || data.bedrooms > 20)) {
    errors.bedrooms = 'Bedrooms must be between 0 and 20'
  }

  if (data.bathrooms && (data.bathrooms < 0 || data.bathrooms > 10)) {
    errors.bathrooms = 'Bathrooms must be between 0 and 10'
  }

  if (data.yearBuilt && (data.yearBuilt < 1800 || data.yearBuilt > new Date().getFullYear())) {
    errors.yearBuilt = `Year must be between 1800 and ${new Date().getFullYear()}`
  }

  if (data.listingUrl && !isValidURL(data.listingUrl)) {
    errors.listingUrl = 'Must be a valid URL'
  }

  return errors
}
```

## Property Type Options

```typescript
const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'mobile', label: 'Mobile/Manufactured' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
]
```

## Edge Cases to Handle

### 1. No Google Maps API Key
- Show manual address entry form
- Skip autocomplete functionality
- User types full address manually

### 2. Address Not Found
- Allow manual entry of address components
- Show "Address not found, enter manually" message

### 3. Duplicate House
- Check if address already exists in household
- Show warning: "This house may already be added"
- Allow user to proceed or cancel

### 4. Invalid/Incomplete Address
- Require full address before proceeding
- Validate address format
- Show error if city/state/ZIP missing

### 5. Network Error
- Retry button for API calls
- Fallback to manual entry
- Don't lose user's data

### 6. Very Old Houses
- Allow year_built back to 1800
- Show warning if > 100 years old (potential data entry error)

### 7. Extremely Expensive Houses
- Allow any price
- Show warning if > $10M (potential error)

## User Flow

### Adding a House

```
1. User clicks "+ Add New House" button
   ↓
2. Modal/page opens with address search
   ↓
3. User types address
   ↓
4. Google Places suggests addresses
   ↓
5. User selects address from dropdown
   ↓
6. Address auto-fills with city, state, ZIP, coordinates
   ↓
7. User enters property details:
   - Price (required)
   - Bedrooms (optional)
   - Bathrooms (optional)
   - Etc.
   ↓
8. User clicks "Save House"
   ↓
9. House saved to database
   ↓
10. Redirect to house details page
   ↓
11. User can now rate this house
```

### Viewing Houses

```
1. User navigates to /dashboard/houses
   ↓
2. Sees list of all houses in household
   ↓
3. Each card shows:
   - Address
   - Price
   - Basic stats (bed/bath/sqft)
   - Rating progress
   - Actions
   ↓
4. User clicks "View Details"
   ↓
5. Full house details page loads
   ↓
6. User can see all info, ratings, notes
```

### Editing a House

```
1. User clicks "Edit" on house card or details page
   ↓
2. Edit form opens with pre-filled data
   ↓
3. User modifies fields
   ↓
4. Clicks "Save Changes"
   ↓
5. House updated in database
   ↓
6. Redirect back to house details
```

## Integration with Other Modules

### Module 1 (Auth)
- Only authenticated household members can add/view houses
- Houses belong to household, not individual users

### Module 3 (Weights)
- Houses page shows link to weights if not set
- "Set category weights before rating houses" message

### Module 4 (Rating)
- "Rate this house" button on each house card
- Show rating progress on house list
- Link to rating page: `/dashboard/houses/[id]/rate`

### Module 6 (Scoring)
- Calculate house scores based on ratings + weights
- Show score on house cards
- Sort houses by score

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading Images**
   - Load house images on-demand
   - Use Next.js Image component
   - Placeholder while loading

2. **Pagination**
   - If > 20 houses, paginate list
   - 10-20 houses per page
   - Infinite scroll or page buttons

3. **Caching**
   - Cache Google Places API responses
   - Cache house list in state
   - Invalidate on changes

4. **Debounced Search**
   - Search houses client-side (fast)
   - Debounce autocomplete (avoid API spam)

## Testing Checklist

### Functionality Tests
- [ ] Add house with valid address
- [ ] Google Places autocomplete works
- [ ] Address components extracted correctly
- [ ] Coordinates saved correctly
- [ ] Property details save correctly
- [ ] Edit house updates data
- [ ] Delete house (soft delete)
- [ ] View house list
- [ ] View house details
- [ ] Search houses
- [ ] Filter houses

### UI/UX Tests
- [ ] Responsive on mobile
- [ ] Dark mode works
- [ ] Form validation shows errors
- [ ] Loading states during API calls
- [ ] Success messages after save
- [ ] Confirmation before delete
- [ ] Empty state shows when no houses

### Edge Case Tests
- [ ] No Google Maps API key
- [ ] Address not found
- [ ] Duplicate house warning
- [ ] Invalid address format
- [ ] Network error during save
- [ ] Very large/small numbers
- [ ] Special characters in address
- [ ] Missing optional fields

## Success Metrics

1. **Time to Add House**: How long does it take?
2. **Autocomplete Usage**: % of users using autocomplete vs manual
3. **Field Completion**: Which fields are most commonly filled?
4. **Edit Rate**: How often do users edit houses?
5. **Delete Rate**: How often are houses removed?

## Cost Estimate (Google Maps API)

### Free Tier (Monthly)
- $200 credit = ~40,000 autocomplete requests
- Typical usage: 5-10 autocomplete requests per house added
- **Supports: ~4,000-8,000 houses added/month**
- **Verdict: Free tier is more than enough for most users**

### Paid Tier (if needed)
- Autocomplete: $2.83 per 1,000 requests
- Geocoding: $5 per 1,000 requests
- **100 houses/month**: ~$0.28 (well within free tier)
- **1,000 houses/month**: ~$2.83 (within free tier)

## Implementation Order

### Step 1: Basic House List
- Create `/dashboard/houses/page.tsx`
- Display all houses in a list
- Show basic info (address, price, bed/bath)
- Add house button (placeholder)

### Step 2: Add House Form (Manual)
- Create add house modal/page
- Manual address entry (no autocomplete yet)
- All property detail fields
- Form validation
- Save to database

### Step 3: Google Places Integration
- Set up Google Maps API
- Implement address autocomplete
- Extract address components
- Save coordinates

### Step 4: House Details Page
- Create `/dashboard/houses/[id]/page.tsx`
- Display all house information
- Show rating progress (if available)
- Action buttons (edit, delete)

### Step 5: Edit Functionality
- Edit house form (pre-filled)
- Update database
- Redirect back to details

### Step 6: Delete Functionality
- Soft delete (is_active = false)
- Confirmation dialog
- Redirect to list

### Step 7: Search & Filters
- Search by address
- Filter by price range, bedrooms, etc.
- Sort options

### Step 8: Polish & Testing
- Responsive design
- Dark mode
- Loading states
- Error handling
- Empty states
- Testing all flows

## Estimated Effort

- **Step 1**: 1.5 hours (basic list)
- **Step 2**: 2 hours (add house form)
- **Step 3**: 2 hours (Google Places)
- **Step 4**: 1.5 hours (details page)
- **Step 5**: 1 hour (edit)
- **Step 6**: 0.5 hours (delete)
- **Step 7**: 1.5 hours (search/filter)
- **Step 8**: 2 hours (polish)

**Total: 12 hours** for complete implementation

## Next Steps

After reviewing this plan:

1. **Approve House Management plan** (or suggest changes)
2. **Set up Google Maps API key**
3. **Implement House Management (Module 5)**
4. **Then implement House Rating (Module 4)**

---

## Confirmed Decisions ✅

Based on our discussion, here's what we're implementing:

1. ✅ **Google Places autocomplete** - YES (confirmed)
2. ✅ **Required fields** - Only address (price and all other fields optional)
3. ✅ **Property details** - Manual entry only for MVP
4. ✅ **Delete behavior** - Soft delete to archive (can restore later)
5. ✅ **Map view** - Include as Phase 2 feature (list/map toggle)
6. ✅ **Street View images** - Auto-generate from address (Phase 1)
7. ✅ **Public records API** - Skip (too expensive, manual entry is fine)

## Implementation Ready!

The plan is complete and approved. Ready to begin implementation with:

### Phase 1 Features:
- Google Places address autocomplete
- Google Street View automatic images
- Manual entry for all property details (all optional except address)
- House list view with cards
- House details page
- Add/Edit/Archive functionality
- Basic search and filters

### Phase 2 Features:
- Interactive map view with markers
- Archive view (see/restore archived houses)
- Advanced filters and sorting
- Image carousel (Street View + optional manual uploads)

### Estimated Cost:
**$0/month** for typical usage (well within Google's $200 free tier)

Once approved, I'll start implementing House Management!
