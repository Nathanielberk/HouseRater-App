'use client'

import { useState } from 'react'
import { useTour } from './TourContext'

interface InviteMembersPromptProps {
  onInvite: (email: string) => Promise<void>
  onDismiss: () => void
}

export function InviteMembersPrompt({ onInvite, onDismiss }: InviteMembersPromptProps) {
  const { completeStep, isStepCompleted } = useTour()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Don't show if already completed
  if (isStepCompleted('household-members')) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setIsSubmitting(true)
    try {
      await onInvite(email.trim())
      setEmail('')
      completeStep('household-members')
      onDismiss()
    } catch (err) {
      setError('Failed to send invitation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShoppingAlone = () => {
    completeStep('household-members')
    onDismiss()
  }

  const handleLater = () => {
    onDismiss()
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Who are you house shopping with?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Invite your partner, family members, or roommates.
            Everyone gets their own account to rate independently.
          </p>

          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleShoppingAlone}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              I&apos;m shopping alone
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={handleLater}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              I&apos;ll do this later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
