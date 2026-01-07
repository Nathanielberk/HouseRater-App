'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HouseholdSetupPage() {
  const router = useRouter()
  const [householdName, setHouseholdName] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user already has a household
      const { data: existingHouseholdUser } = await supabase
        .from('household_users')
        .select('household_id')
        .eq('auth_user_id', user.id)
        .single()

      if (existingHouseholdUser) {
        router.push('/dashboard')
        return
      }

      // Pre-fill user name from auth metadata
      if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name)
      }

      setCheckingAuth(false)
    } catch (err) {
      console.error('Error checking user:', err)
      setCheckingAuth(false)
    }
  }

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create a household')
      }

      // Step 1: Create the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([{ name: householdName.trim() }])
        .select()
        .single()

      if (householdError) throw householdError

      // Step 2: Add the user as the first owner
      const { error: userError } = await supabase
        .from('household_users')
        .insert([{
          household_id: household.id,
          auth_user_id: user.id,
          name: userName.trim(),
          email: user.email!,
          role: 'owner'
        }])

      if (userError) throw userError

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating your household')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-gray-950">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            HouseRater
          </h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Set up your household
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a household to start rating houses together
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleCreateHousehold} className="mt-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  A household is a group of 2-8 people who rate houses together. You'll be the first owner and can invite others later.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Household Name Field */}
            <div>
              <label htmlFor="householdName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Household Name
              </label>
              <input
                id="householdName"
                name="householdName"
                type="text"
                required
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="The Smith Family"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This can be your family name, couple names, or any group identifier
              </p>
            </div>

            {/* Your Name Field */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="John Smith"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This is how you'll appear in the household
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Creating household...' : 'Create Household'}
          </button>

          {/* Features List */}
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              What happens next:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                34 default categories will be added automatically
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You'll be set as the household owner
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                You can invite up to 7 more people to join
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}
