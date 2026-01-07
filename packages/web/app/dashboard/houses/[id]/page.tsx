'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { House, HouseholdUser } from '@/lib/types/database'

export default function HouseDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const houseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [house, setHouse] = useState<House | null>(null)
  const [error, setError] = useState('')
  const [ratingStats, setRatingStats] = useState<{ rated: number; total: number; percentage: number } | null>(null)

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

      setHouse(houseData)

      // Get rating progress for current user
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', householdUser.household_id)
        .eq('is_active', true)

      const { data: ratingsData } = await supabase
        .from('house_ratings')
        .select('id')
        .eq('household_user_id', householdUser.id)
        .eq('house_id', houseId)

      if (categoriesData && ratingsData) {
        const total = categoriesData.length
        const rated = ratingsData.length
        const percentage = total > 0 ? Math.round((rated / total) * 100) : 0
        setRatingStats({ rated, total, percentage })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading house:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!house) return

    if (!confirm('Archive this house? It will be moved to your archive and can be restored later.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('houses')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', house.id)

    if (error) {
      console.error('Error archiving house:', error)
      setError('Failed to archive house')
    } else {
      router.push('/dashboard/houses')
    }
  }

  const handleRestore = async () => {
    if (!house) return

    const supabase = createClient()
    const { error } = await supabase
      .from('houses')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', house.id)

    if (error) {
      console.error('Error restoring house:', error)
      setError('Failed to restore house')
    } else {
      // Reload house
      loadHouse()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading house details...</p>
        </div>
      </div>
    )
  }

  if (error || !house) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              HouseRater
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">House Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'The house you are looking for does not exist.'}</p>
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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const streetViewUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${encodeURIComponent(house.address + ', ' + (house.city || '') + ', ' + (house.state || '') + ' ' + (house.zip || ''))}&key=${apiKey}`
    : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                HouseRater
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                House Details
              </p>
            </div>
            <Link
              href="/dashboard/houses"
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Back to Houses
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Archive Banner */}
        {!house.is_active && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex justify-between items-center">
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">This house is archived</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Restore it to make it active again.</p>
            </div>
            <button
              onClick={handleRestore}
              className="px-4 py-2 bg-yellow-600 dark:bg-yellow-500 text-white rounded-lg hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors font-medium"
            >
              Restore House
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* House Image */}
        <div className="mb-6">
          {streetViewUrl ? (
            <div className="relative h-96 rounded-lg overflow-hidden">
              <img
                src={streetViewUrl}
                alt={house.address}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if Street View fails
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div className="hidden h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 items-center justify-center">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="text-lg">No Street View available</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400 dark:text-gray-500">
                <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <p className="text-lg">Street View (API key needed)</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            href={`/dashboard/houses/${house.id}/rate`}
            className="px-6 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Rate This House
          </Link>
          <Link
            href={`/dashboard/houses/${house.id}/edit`}
            className="px-6 py-3 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Details
          </Link>
          {house.listing_url && (
            <a
              href={house.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Listing
            </a>
          )}
          {house.is_active && (
            <button
              onClick={handleArchive}
              className="px-6 py-3 border-2 border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive House
            </button>
          )}
        </div>

        {/* House Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Address</h2>
              <div className="space-y-2">
                <p className="text-lg text-gray-900 dark:text-white">{house.address}</p>
                {(house.city || house.state || house.zip) && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {[house.city, house.state, house.zip].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Property Details Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Property Details</h2>
              <div className="grid grid-cols-2 gap-4">
                {house.property_type && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Property Type</p>
                    <p className="text-lg text-gray-900 dark:text-white capitalize">{house.property_type.replace('_', ' ')}</p>
                  </div>
                )}
                {house.bedrooms !== null && house.bedrooms !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bedrooms</p>
                    <p className="text-lg text-gray-900 dark:text-white">{house.bedrooms}</p>
                  </div>
                )}
                {house.bathrooms !== null && house.bathrooms !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bathrooms</p>
                    <p className="text-lg text-gray-900 dark:text-white">{house.bathrooms}</p>
                  </div>
                )}
                {house.square_feet && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Square Feet</p>
                    <p className="text-lg text-gray-900 dark:text-white">{house.square_feet.toLocaleString()} sqft</p>
                  </div>
                )}
                {house.lot_size_sqft && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Lot Size</p>
                    <p className="text-lg text-gray-900 dark:text-white">{house.lot_size_sqft.toLocaleString()} sqft</p>
                  </div>
                )}
                {house.year_built && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Year Built</p>
                    <p className="text-lg text-gray-900 dark:text-white">{house.year_built}</p>
                  </div>
                )}
              </div>
              {!house.property_type && !house.bedrooms && !house.bathrooms && !house.square_feet && !house.lot_size_sqft && !house.year_built && (
                <p className="text-gray-500 dark:text-gray-400 italic">No property details available</p>
              )}
            </div>

            {/* Notes Card */}
            {house.notes && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notes</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{house.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            {house.price && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Price</h2>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${house.price.toLocaleString()}
                </p>
              </div>
            )}

            {/* Rating Progress Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Progress</h2>
              {ratingStats ? (
                <div className="text-center py-4">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {ratingStats.rated}/{ratingStats.total}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ratingStats.percentage}% complete
                    </p>
                  </div>
                  {ratingStats.percentage === 100 ? (
                    <div className="mb-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">All categories rated!</p>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-2">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {ratingStats.rated === 0 ? 'Not rated yet' : `${ratingStats.total - ratingStats.rated} more to go`}
                      </p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/houses/${house.id}/rate`}
                    className="inline-block px-4 py-2 bg-green-600 dark:bg-green-500 text-white text-sm rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    {ratingStats.percentage === 100 ? 'Review Ratings' : ratingStats.rated === 0 ? 'Start Rating' : 'Continue Rating'}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Loading...</p>
                </div>
              )}
            </div>

            {/* Overall Score Card (Placeholder for Module 6) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Score</h2>
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-gray-300 dark:text-gray-700">--</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Complete rating to see score</p>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Added</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(house.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(house.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`font-medium ${house.is_active ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                    {house.is_active ? 'Active' : 'Archived'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
