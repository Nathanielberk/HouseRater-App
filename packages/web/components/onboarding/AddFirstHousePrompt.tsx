'use client'

import { useState } from 'react'
import { useTour } from './TourContext'
import Link from 'next/link'

interface AddFirstHousePromptProps {
  onDismiss?: () => void
}

export function AddFirstHousePrompt({ onDismiss }: AddFirstHousePromptProps) {
  const { isTourCompleted, isTourSkipped, completeTour, skipTour, completeStep } = useTour()
  const [isOpen, setIsOpen] = useState(true)

  // Don't show if already completed or skipped
  if (!isOpen || isTourCompleted('houses') || isTourSkipped('houses')) {
    return null
  }

  const handleAddCurrentHome = () => {
    setIsOpen(false)
    completeTour('houses')
    completeStep('add-first-house')
    onDismiss?.()
  }

  const handleAddDifferentHouse = () => {
    setIsOpen(false)
    completeTour('houses')
    onDismiss?.()
  }

  const handleSkip = () => {
    setIsOpen(false)
    skipTour('houses')
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add Your First House
            </h2>
          </div>

          {/* Pro tip callout */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <p className="font-medium text-green-900 dark:text-green-200">
                  Pro tip: Start with your CURRENT home!
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Rating where you live now gives you a baseline to compare potential new homes against.
          </p>

          <p className="text-gray-600 dark:text-gray-400">
            You&apos;ll see how candidates stack up against what you already know.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/houses/new?type=current"
              onClick={handleAddCurrentHome}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Add Current Home
            </Link>
            <Link
              href="/dashboard/houses/new"
              onClick={handleAddDifferentHouse}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Add a Different House
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
