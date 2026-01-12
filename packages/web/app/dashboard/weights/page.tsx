'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category, HouseholdUser, CategoryWeight } from '@/lib/types/database'

// Category groups
const CATEGORY_GROUPS = {
  features: 'Features',
  size: 'Size',
  neighborhood: 'Neighborhood',
  transportation: 'Transportation',
  yard: 'Yard'
} as const

type CategoryGroup = keyof typeof CATEGORY_GROUPS

interface CategoryWithWeight extends Category {
  weight: number | null
}

// Get color based on weight (null=neutral gray, 0=black, 5=cool green - gradual transition)
const getWeightColor = (weight: number | null): string => {
  // Unrated - neutral gray half-tone
  if (weight === null) {
    return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
  }

  // Black to cool green gradient
  const colors = [
    'bg-gray-900 dark:bg-gray-950 border-gray-800 dark:border-gray-900',        // 0 - Black/very dark
    'bg-gray-700 dark:bg-gray-800 border-gray-600 dark:border-gray-700',        // 1 - Dark gray
    'bg-gray-500 dark:bg-gray-600 border-gray-400 dark:border-gray-500',        // 2 - Medium gray
    'bg-slate-400 dark:bg-slate-500 border-slate-300 dark:border-slate-400',    // 3 - Light gray with slight cool tone
    'bg-teal-500 dark:bg-teal-600 border-teal-400 dark:border-teal-500',        // 4 - Cool teal green
    'bg-emerald-600 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600' // 5 - Cool modern green
  ]
  return colors[weight] || colors[3]
}

// Get weight label text for UX display
const getWeightLabel = (weight: number | null): string => {
  if (weight === null) return 'Please rate this feature!'

  const labels = [
    'No, thank you!',           // 0
    'I dont need this',         // 1
    'I am neutral',             // 2
    'This would be nice',       // 3
    'I really want this',       // 4
    'This is absolutely necessary!' // 5
  ]

  return labels[weight] || labels[3]
}

export default function WeightsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [categories, setCategories] = useState<CategoryWithWeight[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<CategoryGroup>>(new Set())
  const [error, setError] = useState('')
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadWeights()
  }, [])

  // Auto-expand first incomplete group
  useEffect(() => {
    if (categories.length > 0 && expandedGroups.size === 0) {
      const firstIncompleteGroup = findFirstIncompleteGroup()
      if (firstIncompleteGroup) {
        setExpandedGroups(new Set([firstIncompleteGroup]))
      }
    }
  }, [categories])

  const loadWeights = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      // Get current household user
      const { data: householdUser, error: userError } = await supabase
        .from('household_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !householdUser) {
        return
      }

      setCurrentUser(householdUser)

      // Get active categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdUser.household_id)
        .eq('is_active', true)
        .order('category_group, name')

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
        setError('Failed to load categories')
        setLoading(false)
        return
      }

      // Get existing weights
      const { data: weightsData } = await supabase
        .from('category_weights')
        .select('*')
        .eq('household_user_id', householdUser.id)

      // Merge categories with weights (default null if no weight - unrated)
      const categoriesWithWeights: CategoryWithWeight[] = (categoriesData || []).map(cat => ({
        ...cat,
        weight: weightsData?.find(w => w.category_id === cat.id)?.weight ?? null
      }))

      setCategories(categoriesWithWeights)
      setLoading(false)
    } catch (err) {
      console.error('Error loading weights:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  // Auto-collapse completed group and expand next
  const handleGroupCompletion = useCallback((completedGroup: CategoryGroup) => {
    const groupOrder: CategoryGroup[] = ['features', 'size', 'neighborhood', 'transportation', 'yard']
    const currentIndex = groupOrder.indexOf(completedGroup)
    const nextGroup = groupOrder[currentIndex + 1]

    if (nextGroup) {
      setExpandedGroups(prev => {
        const newExpanded = new Set(prev)
        newExpanded.delete(completedGroup)
        newExpanded.add(nextGroup)
        return newExpanded
      })
    }
  }, [])

  // Debounced auto-save
  const handleWeightChange = useCallback((categoryId: string, weight: number) => {
    // Check if group was complete BEFORE this change
    const category = categories.find(cat => cat.id === categoryId)
    const wasGroupComplete = category ?
      categories.filter(cat => cat.category_group === category.category_group)
                .every(cat => cat.weight !== null) : false

    // Optimistic update
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, weight } : cat
    )
    setCategories(updatedCategories)

    // Check if the category's group is NOW complete (only trigger if it wasn't before)
    if (category && !wasGroupComplete) {
      const group = category.category_group as CategoryGroup
      const groupCategories = updatedCategories.filter(cat => cat.category_group === group)
      const isNowComplete = groupCategories.every(cat => cat.weight !== null)

      if (isNowComplete) {
        // Group just became complete (first time), trigger auto-collapse/expand after a brief delay
        setTimeout(() => {
          handleGroupCompletion(group)
        }, 800) // Slight delay to let user see the completion
      }
    }

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Set new timeout for save
    const timeout = setTimeout(async () => {
      await saveWeight(categoryId, weight)
    }, 500)

    setSaveTimeout(timeout)
  }, [saveTimeout, categories, handleGroupCompletion])

  const saveWeight = async (categoryId: string, weight: number) => {
    if (!currentUser) return

    setSaving(true)
    try {
      const supabase = createClient()

      const { error: upsertError } = await supabase
        .from('category_weights')
        .upsert({
          household_user_id: currentUser.id,
          category_id: categoryId,
          weight: weight
        }, {
          onConflict: 'household_user_id,category_id'
        })

      if (upsertError) {
        console.error('Error saving weight:', upsertError)
        setError('Failed to save weight')
      }
    } catch (err) {
      console.error('Error saving weight:', err)
    } finally {
      setSaving(false)
    }
  }

  const findFirstIncompleteGroup = (): CategoryGroup | null => {
    const grouped = groupCategories()
    for (const [groupKey, groupCategories] of Object.entries(grouped)) {
      const allRated = groupCategories.every(cat => cat.weight !== null)
      if (!allRated) {
        return groupKey as CategoryGroup
      }
    }
    return Object.keys(grouped)[0] as CategoryGroup || null
  }

  const toggleGroup = (group: CategoryGroup) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const groupCategories = (): Record<CategoryGroup, CategoryWithWeight[]> => {
    return categories.reduce((acc, category) => {
      const group = category.category_group as CategoryGroup
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(category)
      return acc
    }, {} as Record<CategoryGroup, CategoryWithWeight[]>)
  }

  const calculateGroupProgress = (groupCategories: CategoryWithWeight[]) => {
    const rated = groupCategories.filter(cat => cat.weight !== null).length
    const total = groupCategories.length
    return { rated, total, percentage: (rated / total) * 100 }
  }

  const calculateOverallStats = () => {
    const total = categories.length
    const rated = categories.filter(cat => cat.weight !== null).length
    const ratedCategories = categories.filter(cat => cat.weight !== null)
    const avgWeight = ratedCategories.length > 0
      ? ratedCategories.reduce((sum, cat) => sum + (cat.weight || 0), 0) / ratedCategories.length
      : 0

    return { rated, total, avgWeight, percentage: (rated / total) * 100 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    )
  }

  const groupedCategories = groupCategories()
  const stats = calculateOverallStats()
  const allGroupsOrder: CategoryGroup[] = ['features', 'size', 'neighborhood', 'transportation', 'yard']

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Priorities
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Rate how important each category is to you (0=not important, 5=very important)
          </p>
        </div>
        {saving && (
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        )}
      </div>

        {/* Info Box */}
        <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">About Category Weights</h3>
              <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Rate each category from 0 (not important) to 5 (very important)</li>
                  <li>Your ratings auto-save as you adjust them</li>
                  <li>Cards change color: dark gray (0) to cool green (5)</li>
                  <li>Groups auto-collapse when complete and expand the next</li>
                  <li>These weights will influence your final house scores</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.rated} / {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Weight</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgWeight.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Category Groups */}
        <div className="space-y-4">
          {allGroupsOrder.map((groupKey) => {
            const groupCategories = groupedCategories[groupKey] || []
            if (groupCategories.length === 0) return null

            const progress = calculateGroupProgress(groupCategories)
            const isExpanded = expandedGroups.has(groupKey)
            const isComplete = progress.rated === progress.total

            return (
              <div key={groupKey} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {CATEGORY_GROUPS[groupKey]}
                    </h3>
                    {isComplete && (
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {progress.rated} / {progress.total}
                    </span>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Group Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-3">
                    {groupCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`p-4 rounded-lg border-2 transition-all ${getWeightColor(category.weight)}`}
                      >
                        <div className="mb-3">
                          <label htmlFor={`weight-${category.id}`} className="block font-semibold text-gray-900 dark:text-white mb-2">
                            {category.name}
                          </label>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
                            "{getWeightLabel(category.weight)}"
                          </p>
                        </div>

                        {/* Slider */}
                        <div className="relative">
                          <input
                            id={`weight-${category.id}`}
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={category.weight ?? 3}
                            onChange={(e) => handleWeightChange(category.id, parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer
                              bg-gray-300 dark:bg-gray-700
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-6
                              [&::-webkit-slider-thumb]:h-6
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-white
                              [&::-webkit-slider-thumb]:border-2
                              [&::-webkit-slider-thumb]:border-gray-400
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:shadow-lg
                              [&::-webkit-slider-thumb]:hover:scale-110
                              [&::-webkit-slider-thumb]:transition-transform
                              [&::-moz-range-thumb]:w-6
                              [&::-moz-range-thumb]:h-6
                              [&::-moz-range-thumb]:rounded-full
                              [&::-moz-range-thumb]:bg-white
                              [&::-moz-range-thumb]:border-2
                              [&::-moz-range-thumb]:border-gray-400
                              [&::-moz-range-thumb]:cursor-pointer
                              [&::-moz-range-thumb]:shadow-lg
                              [&::-moz-range-thumb]:hover:scale-110
                              [&::-moz-range-thumb]:transition-transform"
                          />
                          {/* Scale Labels */}
                          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>0</span>
                            <span>1</span>
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

    </div>
  )
}
