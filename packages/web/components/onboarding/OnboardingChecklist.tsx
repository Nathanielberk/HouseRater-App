'use client'

import { useState } from 'react'
import { useTour } from './TourContext'
import Link from 'next/link'

interface ChecklistItem {
  id: string
  label: string
  href: string
  isCompleted: boolean
}

export function OnboardingChecklist() {
  const { state, isStepCompleted, completeOnboarding } = useTour()
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if onboarding is complete or dismissed
  if (state.hasCompletedOnboarding || isDismissed) {
    return null
  }

  const items: ChecklistItem[] = [
    {
      id: 'household',
      label: 'Set up your household',
      href: '/dashboard/members',
      isCompleted: isStepCompleted('household-members'),
    },
    {
      id: 'categories',
      label: 'Customize categories',
      href: '/dashboard/categories',
      isCompleted: isStepCompleted('categories-review'),
    },
    {
      id: 'priorities',
      label: 'Set your priorities',
      href: '/dashboard/weights',
      isCompleted: isStepCompleted('priorities-intro'),
    },
    {
      id: 'house',
      label: 'Add first house',
      href: '/dashboard/houses',
      isCompleted: isStepCompleted('add-first-house'),
    },
    {
      id: 'rate',
      label: 'Rate a house',
      href: '/dashboard/houses',
      isCompleted: isStepCompleted('rate-house'),
    },
  ]

  const completedCount = items.filter((item) => item.isCompleted).length
  const allComplete = completedCount === items.length

  const handleDismiss = () => {
    if (allComplete) {
      completeOnboarding()
    }
    setIsDismissed(true)
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          Getting Started
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {completedCount}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`flex items-center gap-2 text-sm transition-colors ${
                item.isCompleted
                  ? 'text-gray-400 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {item.isCompleted ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              )}
              <span className={item.isCompleted ? 'line-through' : ''}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <button
        onClick={handleDismiss}
        className="mt-4 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {allComplete ? 'Complete & Dismiss' : 'Dismiss'}
      </button>
    </div>
  )
}
