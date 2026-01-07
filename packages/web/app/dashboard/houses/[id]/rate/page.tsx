'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { House, HouseholdUser, Category } from '@/lib/types/database'

interface CategoryWeight {
  category_id: string
  weight: number
}

interface HouseRating {
  id: string
  category_id: string
  rating: number
  notes: string | null
}

interface CategoryWithRating extends Category {
  weight: number | null
  rating: number | null
  notes: string | null
  rating_id: string | null
}

const WEIGHT_LABELS = [
  'Not important',
  'Slightly important',
  'Somewhat important',
  'Important',
  'Very important',
  'Absolutely necessary!'
]

const RATING_LABELS = [
  'Poor',
  'Below Average',
  'Average',
  'Good',
  'Very Good',
  'Excellent'
]

export default function RateHousePage() {
  const router = useRouter()
  const params = useParams()
  const houseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [house, setHouse] = useState<House | null>(null)
  const [categories, setCategories] = useState<CategoryWithRating[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [notesTimeouts, setNotesTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [houseId])

  useEffect(() => {
    // Auto-expand first incomplete group
    if (categories.length > 0 && expandedGroups.size === 0) {
      const groups = Array.from(new Set(categories.map(c => c.category_group)))

      for (const group of groups) {
        const groupCats = categories.filter(c => c.category_group === group)
        const allRated = groupCats.every(c => c.rating !== null)

        if (!allRated) {
          setExpandedGroups(new Set([group]))
          break
        }
      }
    }
  }, [categories])

  const loadData = async () => {
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

      // Get active categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdUser.household_id)
        .eq('is_active', true)
        .order('category_group', { ascending: true })
        .order('name', { ascending: true })

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
        setError('Failed to load categories')
        setLoading(false)
        return
      }

      if (!categoriesData || categoriesData.length === 0) {
        setError('No categories found. Please set up categories first.')
        setLoading(false)
        return
      }

      // Get user's weights
      const { data: weightsData } = await supabase
        .from('category_weights')
        .select('category_id, weight')
        .eq('household_user_id', householdUser.id)

      // Get existing ratings for this house
      const { data: ratingsData } = await supabase
        .from('house_ratings')
        .select('*')
        .eq('household_user_id', householdUser.id)
        .eq('house_id', houseId)

      // Merge data
      const categoriesWithData: CategoryWithRating[] = categoriesData.map(cat => {
        const weight = weightsData?.find(w => w.category_id === cat.id)
        const rating = ratingsData?.find(r => r.category_id === cat.id)

        return {
          ...cat,
          weight: weight?.weight ?? null,
          rating: rating?.rating ?? null,
          notes: rating?.notes ?? null,
          rating_id: rating?.id ?? null
        }
      })

      setCategories(categoriesWithData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGroupCompletion = useCallback((completedGroup: string) => {
    const groups = Array.from(new Set(categories.map(c => c.category_group)))
    const currentIndex = groups.indexOf(completedGroup)
    const nextGroup = groups[currentIndex + 1]

    if (nextGroup) {
      setExpandedGroups(prev => {
        const newExpanded = new Set(prev)
        newExpanded.delete(completedGroup)
        newExpanded.add(nextGroup)
        return newExpanded
      })
    } else {
      // Last group - just collapse it
      setExpandedGroups(prev => {
        const newExpanded = new Set(prev)
        newExpanded.delete(completedGroup)
        return newExpanded
      })
    }
  }, [categories])

  const handleRatingChange = useCallback((categoryId: string, newRating: number) => {
    // Check if group was complete BEFORE this change
    const category = categories.find(cat => cat.id === categoryId)
    const wasGroupComplete = category ?
      categories.filter(cat => cat.category_group === category.category_group)
                .every(cat => cat.rating !== null) : false

    // Optimistic update
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, rating: newRating } : cat
    )
    setCategories(updatedCategories)

    // Check if the category's group is NOW complete (only trigger if it wasn't before)
    if (category && !wasGroupComplete) {
      const group = category.category_group
      const groupCategories = updatedCategories.filter(cat => cat.category_group === group)
      const isNowComplete = groupCategories.every(cat => cat.rating !== null)

      if (isNowComplete) {
        // Group just became complete (first time), trigger auto-collapse/expand after a brief delay
        setTimeout(() => {
          handleGroupCompletion(group)
        }, 800) // Slight delay to let user see the completion
      }
    }

    // Clear existing timeout
    if (saveTimeout) clearTimeout(saveTimeout)

    // Set new debounced save
    const timeout = setTimeout(() => {
      saveRating(categoryId, newRating)
    }, 500)
    setSaveTimeout(timeout)
  }, [categories, saveTimeout, handleGroupCompletion])

  const saveRating = async (categoryId: string, rating: number) => {
    if (!currentUser) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('house_ratings')
        .upsert({
          household_user_id: currentUser.id,
          house_id: houseId,
          category_id: categoryId,
          rating: rating,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'household_user_id,house_id,category_id'
        })

      if (error) {
        console.error('Failed to save rating:', error)
        setError('Failed to save rating. Please try again.')
        // Reload to revert optimistic update
        loadData()
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleNotesChange = (categoryId: string, notes: string) => {
    // Optimistic update
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, notes } : cat
    ))

    // Clear existing timeout for this category
    const existingTimeout = notesTimeouts.get(categoryId)
    if (existingTimeout) clearTimeout(existingTimeout)

    // Set new debounced save
    const timeout = setTimeout(() => {
      saveNotes(categoryId, notes)
    }, 1000)

    setNotesTimeouts(prev => new Map(prev).set(categoryId, timeout))
  }

  const saveNotes = async (categoryId: string, notes: string) => {
    if (!currentUser) return

    try {
      const supabase = createClient()

      // First check if rating exists
      const category = categories.find(c => c.id === categoryId)
      if (!category?.rating_id) {
        // Need to create a rating record first with null rating
        const { error } = await supabase
          .from('house_ratings')
          .upsert({
            household_user_id: currentUser.id,
            house_id: houseId,
            category_id: categoryId,
            rating: category?.rating ?? null,
            notes: notes,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'household_user_id,house_id,category_id'
          })

        if (error) {
          console.error('Failed to save notes:', error)
        }
      } else {
        // Update existing rating with notes
        const { error } = await supabase
          .from('house_ratings')
          .update({ notes, updated_at: new Date().toISOString() })
          .eq('id', category.rating_id)

        if (error) {
          console.error('Failed to save notes:', error)
        }
      }
    } catch (err) {
      console.error('Error saving notes:', err)
    }
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) {
        next.delete(groupName)
      } else {
        next.add(groupName)
      }
      return next
    })
  }

  const toggleNotes = (categoryId: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const stats = useMemo(() => {
    const total = categories.length
    const rated = categories.filter(cat => cat.rating !== null).length
    const ratedCategories = categories.filter(cat => cat.rating !== null)
    const avgRating = ratedCategories.length > 0
      ? ratedCategories.reduce((sum, cat) => sum + (cat.rating || 0), 0) / ratedCategories.length
      : 0
    const percentage = total > 0 ? Math.round((rated / total) * 100) : 0

    return { rated, total, avgRating, percentage }
  }, [categories])

  const groupedCategories = useMemo(() => {
    const groups: { [key: string]: CategoryWithRating[] } = {}
    categories.forEach(cat => {
      if (!groups[cat.category_group]) {
        groups[cat.category_group] = []
      }
      groups[cat.category_group].push(cat)
    })
    return groups
  }, [categories])

  const getGroupStats = (groupName: string) => {
    const groupCats = groupedCategories[groupName] || []
    const total = groupCats.length
    const rated = groupCats.filter(cat => cat.rating !== null).length
    const percentage = total > 0 ? Math.round((rated / total) * 100) : 0
    return { rated, total, percentage }
  }

  const getRatingColor = (rating: number | null): string => {
    if (rating === null) return 'bg-gray-300 dark:bg-gray-600'

    const colors = [
      'bg-red-500',      // 0 - Poor
      'bg-orange-500',   // 1 - Below Average
      'bg-yellow-500',   // 2 - Average
      'bg-lime-500',     // 3 - Good
      'bg-green-500',    // 4 - Very Good
      'bg-emerald-500'   // 5 - Excellent
    ]

    return colors[rating] || 'bg-gray-300'
  }

  const getWeightLabel = (weight: number | null): string => {
    if (weight === null) return 'Not set'
    return WEIGHT_LABELS[weight] || 'Unknown'
  }

  const getRatingLabel = (rating: number | null): string => {
    if (rating === null) return 'Not rated yet'
    return RATING_LABELS[rating] || 'Unknown'
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error === 'No categories found. Please set up categories first.' ? 'No Categories Found' : 'House Not Found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard/houses"
                className="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Back to Houses
              </Link>
              {error === 'No categories found. Please set up categories first.' && (
                <Link
                  href="/dashboard/categories"
                  className="inline-block px-6 py-3 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Go to Categories
                </Link>
              )}
            </div>
          </div>
        </main>
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
                Rate House
              </p>
            </div>
            <Link
              href={`/dashboard/houses/${houseId}`}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Back to House Details
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* House Context Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {house.address}
              </h1>
              {(house.city || house.state || house.zip) && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {[house.city, house.state, house.zip].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                {house.price && (
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${house.price.toLocaleString()}
                  </span>
                )}
                {house.bedrooms && <span>{house.bedrooms} bed</span>}
                {house.bathrooms && <span>{house.bathrooms} bath</span>}
                {house.square_feet && <span>{house.square_feet.toLocaleString()} sqft</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.rated}/{stats.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stats.percentage}% complete</p>
            </div>
          </div>
        </div>

        {/* Category Groups */}
        <div className="space-y-4">
          {Object.entries(groupedCategories).map(([groupName, groupCategories]) => {
            const groupStats = getGroupStats(groupName)
            const isExpanded = expandedGroups.has(groupName)
            const isComplete = groupStats.rated === groupStats.total

            return (
              <div
                key={groupName}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {groupName}
                    </h2>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({groupCategories.length} categories)
                    </span>
                    {isComplete && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        Complete
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {groupStats.rated}/{groupStats.total} rated ({groupStats.percentage}%)
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Group Categories */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                    {groupCategories.map((category) => {
                      const isNotesExpanded = expandedNotes.has(category.id)

                      return (
                        <div key={category.id} className="p-6">
                          {/* Category Name & Weight */}
                          <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {category.description}
                              </p>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {category.weight !== null ? (
                                <>
                                  Your weight: <span className="font-semibold text-gray-900 dark:text-white">{category.weight}</span> -
                                  <span className="ml-1">{getWeightLabel(category.weight)}</span>
                                </>
                              ) : (
                                <span className="italic">
                                  Weight not set.
                                  <Link href="/dashboard/weights" className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">
                                    Set weights
                                  </Link>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Rating Slider */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              How does this house rate?
                            </label>
                            <div className="space-y-3">
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={category.rating ?? 0}
                                onChange={(e) => handleRatingChange(category.id, parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-600"
                              />
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>0</span>
                                <span>1</span>
                                <span>2</span>
                                <span>3</span>
                                <span>4</span>
                                <span>5</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Poor</span>
                                <span>Average</span>
                                <span>Excellent</span>
                              </div>
                            </div>
                          </div>

                          {/* Current Rating Display */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-4 h-4 rounded-full ${getRatingColor(category.rating)}`}></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {category.rating !== null ? (
                                <>Current rating: {category.rating} - {getRatingLabel(category.rating)}</>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-400">{getRatingLabel(category.rating)}</span>
                              )}
                            </span>
                          </div>

                          {/* Notes Section */}
                          <div>
                            <button
                              onClick={() => toggleNotes(category.id)}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {isNotesExpanded ? 'Hide notes' : category.notes ? 'Edit notes' : 'Add notes (optional)'}
                            </button>
                            {isNotesExpanded && (
                              <div className="mt-2">
                                <textarea
                                  value={category.notes || ''}
                                  onChange={(e) => handleNotesChange(category.id, e.target.value)}
                                  maxLength={500}
                                  rows={3}
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  placeholder="Add your thoughts about this category for this house..."
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                                  {(category.notes || '').length}/500 characters
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Help Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Rating Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>Rate each category based on how well this house performs in that area</li>
            <li>Your ratings auto-save as you move the sliders</li>
            <li>Use notes to capture specific details or thoughts</li>
            <li>You can come back and edit ratings anytime</li>
            <li>Your ratings will be combined with your weights to calculate final scores</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
