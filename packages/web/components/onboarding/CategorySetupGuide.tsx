'use client'

import { useState } from 'react'
import { useTour } from './TourContext'

interface CategorySetupGuideProps {
  onDismiss?: () => void
}

export function CategorySetupGuide({ onDismiss }: CategorySetupGuideProps) {
  const { isTourCompleted, isTourSkipped, completeTour, skipTour } = useTour()
  const [isOpen, setIsOpen] = useState(true)

  // Don't show if already completed or skipped
  if (!isOpen || isTourCompleted('categories') || isTourSkipped('categories')) {
    return null
  }

  const handleDismiss = () => {
    setIsOpen(false)
    completeTour('categories')
    onDismiss?.()
  }

  const handleSkip = () => {
    setIsOpen(false)
    skipTour('categories')
    onDismiss?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Customize Your Categories
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Categories are the features you&apos;ll rate each house on.
          </p>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We&apos;ve added common categories to get you started. Review them and:
          </p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">
                Delete any that don&apos;t apply to your search
              </span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">
                Add custom categories specific to YOUR needs
              </span>
            </li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Tips for good categories:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>Be specific (&quot;Walk to grocery store&quot; vs &quot;Good location&quot;)</li>
              <li>Avoid redundancy (don&apos;t duplicate similar items)</li>
              <li>Think about dealbreakers AND nice-to-haves</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            You can always add or remove categories later.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Review Categories
          </button>
        </div>
      </div>
    </div>
  )
}
