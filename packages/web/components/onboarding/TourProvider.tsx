'use client'

import { useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { TourContext } from './TourContext'
import {
  OnboardingState,
  OnboardingAction,
  OnboardingStep,
  TourName,
  DEFAULT_ONBOARDING_STATE,
} from '@/lib/tour'
import {
  getOnboardingState,
  setOnboardingState,
  createInitialState,
} from '@/lib/tour'

interface TourProviderProps {
  children: ReactNode
  userId: string
}

function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'COMPLETE_STEP':
      if (state.completedSteps.includes(action.step)) {
        return state
      }
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.step],
      }

    case 'COMPLETE_TOUR':
      if (state.completedTours.includes(action.tour)) {
        return state
      }
      return {
        ...state,
        completedTours: [...state.completedTours, action.tour],
      }

    case 'SKIP_TOUR':
      if (state.skippedTours.includes(action.tour)) {
        return state
      }
      return {
        ...state,
        skippedTours: [...state.skippedTours, action.tour],
      }

    case 'DISMISS_WELCOME':
      return {
        ...state,
        isFirstLogin: false,
      }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        hasCompletedOnboarding: true,
        isFirstLogin: false,
      }

    case 'RESET_ONBOARDING':
      return {
        ...DEFAULT_ONBOARDING_STATE,
        userId: state.userId,
        isFirstLogin: true,
        hasCompletedOnboarding: false,
      }

    case 'LOAD_STATE':
      return action.state

    default:
      return state
  }
}

export function TourProvider({ children, userId }: TourProviderProps) {
  const [state, dispatch] = useReducer(
    onboardingReducer,
    { ...DEFAULT_ONBOARDING_STATE, userId }
  )

  // Load state from localStorage on mount
  useEffect(() => {
    if (!userId) return

    const savedState = getOnboardingState(userId)
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', state: savedState })
    } else {
      // First time user - create initial state
      const initialState = createInitialState(userId)
      dispatch({ type: 'LOAD_STATE', state: initialState })
      setOnboardingState(initialState)
    }
  }, [userId])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!userId || !state.userId) return
    setOnboardingState(state)
  }, [state, userId])

  // Helper functions
  const isStepCompleted = useCallback(
    (step: OnboardingStep) => state.completedSteps.includes(step),
    [state.completedSteps]
  )

  const isTourCompleted = useCallback(
    (tour: TourName) => state.completedTours.includes(tour),
    [state.completedTours]
  )

  const isTourSkipped = useCallback(
    (tour: TourName) => state.skippedTours.includes(tour),
    [state.skippedTours]
  )

  const shouldShowWelcome = useMemo(
    () => state.isFirstLogin && !state.hasCompletedOnboarding,
    [state.isFirstLogin, state.hasCompletedOnboarding]
  )

  const completeStep = useCallback((step: OnboardingStep) => {
    dispatch({ type: 'COMPLETE_STEP', step })
  }, [])

  const completeTour = useCallback((tour: TourName) => {
    dispatch({ type: 'COMPLETE_TOUR', tour })
  }, [])

  const skipTour = useCallback((tour: TourName) => {
    dispatch({ type: 'SKIP_TOUR', tour })
  }, [])

  const dismissWelcome = useCallback(() => {
    dispatch({ type: 'DISMISS_WELCOME' })
  }, [])

  const completeOnboarding = useCallback(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING' })
  }, [])

  const resetOnboarding = useCallback(() => {
    dispatch({ type: 'RESET_ONBOARDING' })
  }, [])

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      isStepCompleted,
      isTourCompleted,
      isTourSkipped,
      shouldShowWelcome,
      completeStep,
      completeTour,
      skipTour,
      dismissWelcome,
      completeOnboarding,
      resetOnboarding,
    }),
    [
      state,
      isStepCompleted,
      isTourCompleted,
      isTourSkipped,
      shouldShowWelcome,
      completeStep,
      completeTour,
      skipTour,
      dismissWelcome,
      completeOnboarding,
      resetOnboarding,
    ]
  )

  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  )
}
