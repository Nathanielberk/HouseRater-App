'use client'

import { useState } from 'react'
import { useTour } from './TourContext'

interface PrioritiesIntroProps {
  onDismiss?: () => void
}

export function PrioritiesIntro({ onDismiss }: PrioritiesIntroProps) {
  const { isTourCompleted, isTourSkipped, completeTour, skipTour, completeStep } = useTour()
  const [isOpen, setIsOpen] = useState(true)

  // Don't show if already completed or skipped
  if (!isOpen || isTourCompleted('priorities') || isTourSkipped('priorities')) {
    return null
  }

  const handleDismiss = () => {
    setIsOpen(false)
    completeTour('priorities')
    completeStep('priorities-intro')
    onDismiss?.()
  }

  const handleSkip = () => {
    setIsOpen(false)
    skipTour('priorities')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Set Your Priorities
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Rate how important each category is to YOU personally.
          </p>

          {/* Warning callout */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Important: Do this independently!
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  Don&apos;t discuss with your household members yet.
                  This captures everyone&apos;s TRUE priorities before any group influence.
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-2">
            After everyone completes their ratings:
          </p>

          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Review priorities together
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Discuss any differences
            </li>
            <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Adjust if minds change
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            onClick={handleDismiss}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Set My Priorities
          </button>
        </div>
      </div>
    </div>
  )
}
