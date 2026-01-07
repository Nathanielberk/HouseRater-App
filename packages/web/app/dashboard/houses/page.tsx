'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { House, HouseholdUser } from '@/lib/types/database'

interface CategoryScore {
  categoryId: string
  categoryName: string
  categoryGroup: string
  rating: number | null
  weight: number
  weightedScore: number | null
}

interface HouseScore {
  houseId: string
  overallScore: number | null
  categoryScores: CategoryScore[]
  ratedCount: number
  totalCount: number
}

export default function HousesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [houses, setHouses] = useState<House[]>([])
  const [houseScores, setHouseScores] = useState<Map<string, HouseScore>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHouses()
  }, [showArchived])

  const loadHouses = async () => {
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

      // Get houses for household
      const { data: housesData, error: housesError } = await supabase
        .from('houses')
        .select('*')
        .eq('household_id', householdUser.household_id)
        .eq('is_active', !showArchived)
        .order('created_at', { ascending: false })

      if (housesError) {
        console.error('Error loading houses:', housesError)
        setError('Failed to load houses')
        setLoading(false)
        return
      }

      setHouses(housesData || [])

      // Load scoring data for all houses
      if (housesData && housesData.length > 0) {
        await loadHouseScores(supabase, householdUser.id, householdUser.household_id, housesData.map(h => h.id))
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading houses:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const loadHouseScores = async (
    supabase: ReturnType<typeof createClient>,
    householdUserId: string,
    householdId: string,
    houseIds: string[]
  ) => {
    try {
      // Load all active categories for the household
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, category_group')
        .eq('household_id', householdId)
        .eq('is_active', true)
        .order('category_group')
        .order('name')

      if (!categories) return

      // Load user's weights for all categories
      const { data: weights } = await supabase
        .from('category_weights')
        .select('category_id, weight')
        .eq('household_user_id', householdUserId)

      const weightMap = new Map(weights?.map(w => [w.category_id, w.weight]) || [])

      // Load all ratings for all houses
      const { data: ratings } = await supabase
        .from('house_ratings')
        .select('house_id, category_id, rating')
        .eq('household_user_id', householdUserId)
        .in('house_id', houseIds)

      // Group ratings by house
      const ratingsByHouse = new Map<string, Map<string, number>>()
      ratings?.forEach(r => {
        if (!ratingsByHouse.has(r.house_id)) {
          ratingsByHouse.set(r.house_id, new Map())
        }
        ratingsByHouse.get(r.house_id)!.set(r.category_id, r.rating)
      })

      // Calculate scores for each house
      const scoresMap = new Map<string, HouseScore>()
      houseIds.forEach(houseId => {
        const houseRatings = ratingsByHouse.get(houseId) || new Map()
        const categoryScores: CategoryScore[] = []
        let totalWeightedScore = 0
        let totalMaxScore = 0
        let ratedCount = 0

        categories.forEach(cat => {
          const weight = weightMap.get(cat.id) || 0
          const rating = houseRatings.get(cat.id) ?? null

          // Calculate category percentage: (rating / 5) * 100
          // This shows how well the house meets this specific category (0-100%)
          const weightedScore = rating !== null
            ? (rating / 5) * 100
            : null

          categoryScores.push({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryGroup: cat.category_group,
            rating,
            weight,
            weightedScore
          })

          // For overall score: sum of (weight × rating) / sum of (weight × 5)
          if (rating !== null && weight > 0) {
            totalWeightedScore += (weight * rating)
            totalMaxScore += (weight * 5)
            ratedCount++
          }
        })

        // Calculate overall score as percentage
        // Formula: (sum of weight × rating) / (sum of weight × 5) × 100
        const overallScore = totalMaxScore > 0
          ? Math.round((totalWeightedScore / totalMaxScore) * 100)
          : null

        scoresMap.set(houseId, {
          houseId,
          overallScore,
          categoryScores,
          ratedCount,
          totalCount: categories.length
        })
      })

      setHouseScores(scoresMap)
    } catch (err) {
      console.error('Error loading house scores:', err)
    }
  }

  const handleArchive = async (houseId: string) => {
    if (!confirm('Archive this house? It will be moved to your archive and can be restored later.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('houses')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', houseId)

    if (error) {
      console.error('Error archiving house:', error)
      setError('Failed to archive house')
    } else {
      // Reload houses
      loadHouses()
    }
  }

  const handleRestore = async (houseId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('houses')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', houseId)

    if (error) {
      console.error('Error restoring house:', error)
      setError('Failed to restore house')
    } else {
      // Reload houses
      loadHouses()
    }
  }

  // Helper: Get chiclet color based on weighted score (with 0.5 opacity)
  const getChicletColor = (weightedScore: number | null, weight: number): string => {
    // Special case: weight of 0 means category is ignored (white with low opacity)
    if (weight === 0) return 'rgba(255, 255, 255, 0.15)'

    // Unrated categories
    if (weightedScore === null) return 'rgba(209, 213, 219, 0.5)' // gray-300

    // Score-based gradient (0.5 opacity)
    if (weightedScore >= 90) return 'rgba(16, 185, 129, 0.5)'   // emerald-500
    if (weightedScore >= 75) return 'rgba(34, 197, 94, 0.5)'    // green-500
    if (weightedScore >= 60) return 'rgba(132, 204, 22, 0.5)'   // lime-500
    if (weightedScore >= 45) return 'rgba(234, 179, 8, 0.5)'    // yellow-500
    if (weightedScore >= 30) return 'rgba(249, 115, 22, 0.5)'   // orange-500
    return 'rgba(239, 68, 68, 0.5)' // red-500
  }

  // Helper: Get score label
  const getScoreLabel = (score: number | null): string => {
    if (score === null) return 'Not rated'
    if (score >= 90) return 'Excellent Match'
    if (score >= 75) return 'Great Match'
    if (score >= 60) return 'Good Match'
    if (score >= 45) return 'Fair Match'
    return 'Needs Work'
  }

  // Helper: Get grid columns for category group - normalized to max 16 columns
  const getGridCols = (count: number): number => {
    if (count <= 16) return count
    return 16 // Always max 16 columns for consistency
  }

  const filteredHouses = houses.filter(house => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      house.address?.toLowerCase().includes(query) ||
      house.city?.toLowerCase().includes(query) ||
      house.state?.toLowerCase().includes(query) ||
      house.zip?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading houses...</p>
        </div>
      </div>
    )
  }

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
                Houses Under Consideration
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-3">
            <Link
              href="/dashboard/houses/new"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New House
            </Link>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                showArchived
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
          </div>

          {/* Search */}
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search addresses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* House List */}
        {filteredHouses.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showArchived ? 'No archived houses' : 'No houses yet!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {showArchived
                ? 'Houses you archive will appear here.'
                : 'Add your first house to start rating and comparing.'
              }
            </p>
            {!showArchived && (
              <Link
                href="/dashboard/houses/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First House
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredHouses.map((house) => {
              const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              const streetViewUrl = apiKey
                ? `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(house.address + ', ' + (house.city || '') + ', ' + (house.state || '') + ' ' + (house.zip || ''))}&key=${apiKey}`
                : null

              const houseScore = houseScores.get(house.id)
              const groupedScores = houseScore?.categoryScores.reduce((acc, score) => {
                if (!acc[score.categoryGroup]) {
                  acc[score.categoryGroup] = []
                }
                acc[score.categoryGroup].push(score)
                return acc
              }, {} as Record<string, CategoryScore[]>) || {}

              return (
                <div
                  key={house.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* House Image */}
                  {streetViewUrl ? (
                    <div className="relative h-48">
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
                      <div className="hidden h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 items-center justify-center">
                        <div className="text-center text-gray-400 dark:text-gray-500">
                          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <p className="text-sm">No Street View available</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className="text-sm">Street View (API key needed)</p>
                      </div>
                    </div>
                  )}

                {/* House Details & Scoring */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: House Details (40%) */}
                    <div className="lg:w-2/5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {house.address}
                      </h3>
                      {(house.city || house.state || house.zip) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {[house.city, house.state, house.zip].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {house.price && (
                        <p className="text-xl font-bold text-green-600 dark:text-green-400 mb-3">
                          ${house.price.toLocaleString()}
                        </p>
                      )}

                      {/* Property Stats */}
                      {(house.bedrooms || house.bathrooms || house.square_feet) && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                          {house.bedrooms && (
                            <span className="flex items-center gap-1">
                              🛏️ {house.bedrooms} bed
                            </span>
                          )}
                          {house.bathrooms && (
                            <span className="flex items-center gap-1">
                              🛁 {house.bathrooms} bath
                            </span>
                          )}
                          {house.square_feet && (
                            <span className="flex items-center gap-1">
                              📏 {house.square_feet.toLocaleString()} sqft
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Scoring Visualization (60%) */}
                    <div className="lg:w-3/5 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-6">
                      {houseScore && houseScore.ratedCount > 0 ? (
                        <div className="flex gap-4">
                          {/* Overall Score - Left */}
                          <div className="flex-shrink-0">
                            <div className="text-4xl font-bold mb-1" style={{
                              color: houseScore.overallScore! >= 75 ? 'rgb(34, 197, 94)' :
                                     houseScore.overallScore! >= 60 ? 'rgb(132, 204, 22)' :
                                     houseScore.overallScore! >= 45 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)'
                            }}>
                              {houseScore.overallScore}%
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {getScoreLabel(houseScore.overallScore)}
                            </div>
                          </div>

                          {/* Chiclet Heatmap - Right */}
                          <div className="flex-1 space-y-2">
                            {Object.entries(groupedScores).map(([groupName, scores]) => {
                              const cols = getGridCols(scores.length)
                              return (
                                <div key={groupName}>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5 font-medium">
                                    {groupName} ({scores.length})
                                  </div>
                                  <div
                                    className="grid gap-0.5"
                                    style={{
                                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                      maxWidth: `${cols * 8}px` // 8px per chiclet
                                    }}
                                  >
                                    {scores.map((score) => (
                                      <div
                                        key={score.categoryId}
                                        className="aspect-square rounded-sm relative group"
                                        style={{
                                          backgroundColor: score.weightedScore !== null
                                            ? getChicletColor(score.weightedScore, score.weight)
                                            : 'transparent',
                                          border: score.weightedScore === null
                                            ? '1px solid rgba(209, 213, 219, 0.5)'
                                            : 'none',
                                          minWidth: '6px',
                                          minHeight: '6px'
                                        }}
                                        title={score.weightedScore !== null
                                          ? `${score.categoryName}: ${Math.round(score.weightedScore)}%\nRating: ${score.rating}/5 | Weight: ${score.weight}/5`
                                          : `${score.categoryName}: Not rated yet`
                                        }
                                      >
                                        {/* Tooltip on hover (optional enhancement) */}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-400 dark:text-gray-500 mb-2">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Not rated yet</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click "Rate House" to begin</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/dashboard/houses/${house.id}`}
                      className="px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/dashboard/houses/${house.id}/rate`}
                      className="px-3 py-1.5 text-sm bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    >
                      Rate House
                    </Link>
                    <Link
                      href={`/dashboard/houses/${house.id}/edit`}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Edit
                    </Link>
                    {showArchived ? (
                      <button
                        onClick={() => handleRestore(house.id)}
                        className="px-3 py-1.5 text-sm border border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchive(house.id)}
                        className="px-3 py-1.5 text-sm border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
