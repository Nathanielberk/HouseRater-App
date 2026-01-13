'use client'

import { createContext, useContext } from 'react'
import { TourContextValue, DEFAULT_ONBOARDING_STATE } from '@/lib/tour'

// Default context value (will be overridden by provider)
const defaultContextValue: TourContextValue = {
  state: { ...DEFAULT_ONBOARDING_STATE, userId: '' },
  dispatch: () => {},
  isStepCompleted: () => false,
  isTourCompleted: () => false,
  isTourSkipped: () => false,
  shouldShowWelcome: false,
  completeStep: () => {},
  completeTour: () => {},
  skipTour: () => {},
  dismissWelcome: () => {},
  completeOnboarding: () => {},
  resetOnboarding: () => {},
}

export const TourContext = createContext<TourContextValue>(defaultContextValue)

export function useTour(): TourContextValue {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
