'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CategorySetupGuide, useTour } from '@/components/onboarding'
import type { Category, HouseholdUser } from '@/lib/types/database'

// Define category groups
const CATEGORY_GROUPS = {
  features: 'Features',
  size: 'Size',
  neighborhood: 'Neighborhood',
  transportation: 'Transportation',
  yard: 'Yard'
} as const

type CategoryGroup = keyof typeof CATEGORY_GROUPS

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<HouseholdUser | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryGroup, setNewCategoryGroup] = useState<CategoryGroup>('features')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { completeStep } = useTour()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
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

      // Get all categories for this household
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdUser.household_id)
        .order('category_group')
        .order('name')

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
        setError('Failed to load categories')
      } else if (categoriesData) {
        setCategories(categoriesData)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleToggleActive = async (category: Category) => {
    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (updateError) {
        console.error('Error toggling category:', updateError)
        setError('Failed to update category')
        return
      }

      // Update local state
      setCategories(categories.map(cat =>
        cat.id === category.id ? { ...cat, is_active: !cat.is_active } : cat
      ))

      setSuccess(`${category.name} ${!category.is_active ? 'activated' : 'deactivated'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error toggling category:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!newCategoryName.trim()) {
      setError('Category name is required')
      return
    }

    if (!currentUser) {
      setError('User not found')
      return
    }

    try {
      const supabase = createClient()

      const { data: newCategory, error: insertError } = await supabase
        .from('categories')
        .insert([{
          household_id: currentUser.household_id,
          name: newCategoryName.trim(),
          category_group: newCategoryGroup,
          is_default: false,
          is_active: true
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Error adding category:', insertError)
        setError('Failed to add category')
        return
      }

      // Add to local state
      setCategories([...categories, newCategory])
      setNewCategoryName('')
      setShowAddForm(false)
      setSuccess('Category added successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error adding category:', err)
      setError('An unexpected error occurred')
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (deleteError) {
        console.error('Error deleting category:', deleteError)
        setError('Failed to delete category')
        return
      }

      // Remove from local state
      setCategories(categories.filter(cat => cat.id !== category.id))
      setSuccess('Category deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('An unexpected error occurred')
    }
  }

  // Group categories by type
  const groupedCategories = categories.reduce((acc, category) => {
    const group = category.category_group as CategoryGroup
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(category)
    return acc
  }, {} as Record<CategoryGroup, Category[]>)

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

  const activeCount = categories.filter(cat => cat.is_active).length
  const customCount = categories.filter(cat => !cat.is_default).length

  const handleCategoryGuideComplete = () => {
    completeStep('categories-review')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Setup Guide Modal - shown on first visit */}
      <CategorySetupGuide onDismiss={handleCategoryGuideComplete} />

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Categories
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage the categories you&apos;ll use to rate houses.
        </p>
      </div>

      {/* Page Content */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Rating Categories
        </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage the categories you'll use to rate houses. Toggle categories on/off or add custom ones.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Custom Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{customCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Add Category Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Custom Category
          </button>
        </div>

        {/* Add Category Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Custom Category
            </h3>
            <form onSubmit={handleAddCategory}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Home Office Space"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Group
                  </label>
                  <select
                    value={newCategoryGroup}
                    onChange={(e) => setNewCategoryGroup(e.target.value as CategoryGroup)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(CATEGORY_GROUPS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewCategoryName('')
                    setError('')
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories by Group */}
        <div className="space-y-8">
          {Object.entries(CATEGORY_GROUPS).map(([groupKey, groupLabel]) => {
            const groupCategories = groupedCategories[groupKey as CategoryGroup] || []

            if (groupCategories.length === 0) return null

            const activeInGroup = groupCategories.filter(cat => cat.is_active).length

            return (
              <div key={groupKey} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {groupLabel}
                  </h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {activeInGroup} of {groupCategories.length} active
                  </span>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        category.is_active
                          ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${
                              category.is_active
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {category.name}
                            </p>
                            {!category.is_default && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleToggleActive(category)}
                            className={`p-1.5 rounded transition-colors ${
                              category.is_active
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            title={category.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {category.is_active ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">About Categories</h3>
              <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Default categories are created automatically for each household</li>
                  <li>Toggle categories on/off to customize which ones you'll use for rating</li>
                  <li>Add custom categories specific to your needs</li>
                  <li>All categories can be deleted if they don't fit your needs</li>
                  <li>Inactive categories won't appear when rating houses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}
