'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { House, HouseholdUser } from '@/lib/types/database'

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family Home' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'mobile', label: 'Mobile/Manufactured' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
]

export default function EditHousePage() {
  const router = useRouter()
  const params = useParams()
  const houseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [squareFeet, setSquareFeet] = useState('')
  const [lotSize, setLotSize] = useState('')
  const [yearBuilt, setYearBuilt] = useState('')
  const [propertyType, setPropertyType] = useState('single_family')
  const [listingUrl, setListingUrl] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadHouse()
  }, [houseId])

  const loadHouse = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get current household user
      const { data: householdUser, error: userError } = await supabase
        .from('household_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !householdUser) {
        router.push('/auth/household-setup')
        return
      }

      setCurrentUser(householdUser)

      // Get house details
      const { data: houseData, error: houseError } = await supabase
        .from('houses')
        .select('*')
        .eq('id', houseId)
        .eq('household_id', householdUser.household_id)
        .single()

      if (houseError || !houseData) {
        console.error('Error loading house:', houseError)
        setError('House not found')
        setLoading(false)
        return
      }

      // Populate form with existing data
      setAddress(houseData.address || '')
      setCity(houseData.city || '')
      setState(houseData.state || '')
      setZipCode(houseData.zip || '')
      setPrice(houseData.price?.toString() || '')
      setBedrooms(houseData.bedrooms?.toString() || '')
      setBathrooms(houseData.bathrooms?.toString() || '')
      setSquareFeet(houseData.square_feet?.toString() || '')
      setLotSize(houseData.lot_size_sqft?.toString() || '')
      setYearBuilt(houseData.year_built?.toString() || '')
      setPropertyType(houseData.property_type || 'single_family')
      setListingUrl(houseData.listing_url || '')
      setNotes(houseData.notes || '')

      setLoading(false)
    } catch (err) {
      console.error('Error loading house:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!address.trim()) {
      setError('Address is required')
      return false
    }

    if (price && (isNaN(Number(price)) || Number(price) < 0)) {
      setError('Price must be a valid positive number')
      return false
    }

    if (bedrooms && (isNaN(Number(bedrooms)) || Number(bedrooms) < 0 || Number(bedrooms) > 20)) {
      setError('Bedrooms must be between 0 and 20')
      return false
    }

    if (bathrooms && (isNaN(Number(bathrooms)) || Number(bathrooms) < 0 || Number(bathrooms) > 10)) {
      setError('Bathrooms must be between 0 and 10')
      return false
    }

    if (squareFeet && (isNaN(Number(squareFeet)) || Number(squareFeet) < 0)) {
      setError('Square feet must be a valid positive number')
      return false
    }

    if (lotSize && (isNaN(Number(lotSize)) || Number(lotSize) < 0)) {
      setError('Lot size must be a valid positive number')
      return false
    }

    const currentYear = new Date().getFullYear()
    if (yearBuilt && (isNaN(Number(yearBuilt)) || Number(yearBuilt) < 1800 || Number(yearBuilt) > currentYear)) {
      setError(`Year built must be between 1800 and ${currentYear}`)
      return false
    }

    if (listingUrl && !isValidUrl(listingUrl)) {
      setError('Listing URL must be a valid URL')
      return false
    }

    return true
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    if (!currentUser) {
      setError('User not found')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const houseData = {
        address: address.trim(),
        city: city.trim() || null,
        state: state.trim() || null,
        zip: zipCode.trim() || null,
        price: price ? Number(price) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        square_feet: squareFeet ? parseInt(squareFeet) : null,
        lot_size_sqft: lotSize ? parseInt(lotSize) : null,
        year_built: yearBuilt ? parseInt(yearBuilt) : null,
        property_type: propertyType || null,
        listing_url: listingUrl.trim() || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('houses')
        .update(houseData)
        .eq('id', houseId)
        .eq('household_id', currentUser.household_id)

      if (updateError) {
        console.error('Error updating house:', updateError)
        setError('Failed to update house. Please try again.')
        setSaving(false)
        return
      }

      // Redirect to house details
      router.push(`/dashboard/houses/${houseId}`)
    } catch (err) {
      console.error('Error updating house:', err)
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading house...</p>
        </div>
      </div>
    )
  }

  if (error && !address) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              HouseRater
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">House Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Link
              href="/dashboard/houses"
              className="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Back to Houses
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                HouseRater
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit House
              </p>
            </div>
            <Link
              href={`/dashboard/houses/${houseId}`}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <form onSubmit={handleSubmit}>
          {/* Address Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Address Information
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Anytown"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="90210"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Property Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="text"
                      id="price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="450000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property Type
                  </label>
                  <select
                    id="propertyType"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    id="bedrooms"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    min="0"
                    max="20"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>

                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    id="bathrooms"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    min="0"
                    max="10"
                    step="0.5"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Square Feet
                  </label>
                  <input
                    type="number"
                    id="squareFeet"
                    value={squareFeet}
                    onChange={(e) => setSquareFeet(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1850"
                  />
                </div>

                <div>
                  <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lot Size (sqft)
                  </label>
                  <input
                    type="number"
                    id="lotSize"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year Built
                </label>
                <input
                  type="number"
                  id="yearBuilt"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1998"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Additional Information
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="listingUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Listing URL
                </label>
                <input
                  type="url"
                  id="listingUrl"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://zillow.com/..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Link to Zillow, Realtor.com, or other listing site
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Great neighborhood, walkable to schools..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {notes.length} / 2000 characters
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && address && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/dashboard/houses/${houseId}`}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
