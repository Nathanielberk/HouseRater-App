// localStorage helpers for persisting onboarding state

import {
  OnboardingState,
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STATE_VERSION,
} from './tourTypes'

const STORAGE_KEY_PREFIX = 'houserater_onboarding_'

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`
}

/**
 * Get the onboarding state for a user from localStorage
 */
export function getOnboardingState(userId: string): OnboardingState | null {
  if (typeof window === 'undefined') return null

  try {
    const key = getStorageKey(userId)
    const stored = localStorage.getItem(key)

    if (!stored) return null

    const state = JSON.parse(stored) as OnboardingState

    // Handle version migration if needed
    if (state.version < ONBOARDING_STATE_VERSION) {
      return migrateState(state)
    }

    return state
  } catch (error) {
    console.error('Error reading onboarding state:', error)
    return null
  }
}

/**
 * Save the onboarding state to localStorage
 */
export function setOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return

  try {
    const key = getStorageKey(state.userId)
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving onboarding state:', error)
  }
}

/**
 * Create initial state for a new user
 */
export function createInitialState(userId: string): OnboardingState {
  return {
    ...DEFAULT_ONBOARDING_STATE,
    userId,
  }
}

/**
 * Check if this is the user's first login (no saved state exists)
 */
export function isFirstLogin(userId: string): boolean {
  const state = getOnboardingState(userId)
  return state === null || state.isFirstLogin
}

/**
 * Mark onboarding as complete (prevents auto-show on future logins)
 */
export function markOnboardingComplete(userId: string): void {
  const state = getOnboardingState(userId)
  if (!state) return

  setOnboardingState({
    ...state,
    hasCompletedOnboarding: true,
    isFirstLogin: false,
  })
}

/**
 * Reset onboarding state (for "Take a Tour" restart)
 * Preserves userId but resets all progress
 */
export function resetOnboarding(userId: string): void {
  const newState: OnboardingState = {
    ...DEFAULT_ONBOARDING_STATE,
    userId,
    isFirstLogin: true, // This triggers the welcome modal
    hasCompletedOnboarding: false,
  }
  setOnboardingState(newState)
}

/**
 * Clear all onboarding data for a user (for account deletion)
 */
export function clearOnboardingData(userId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = getStorageKey(userId)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error clearing onboarding data:', error)
  }
}

/**
 * Migrate old state versions to current version
 */
function migrateState(oldState: OnboardingState): OnboardingState {
  // Currently only version 1 exists, so no migration needed
  // Future migrations would go here
  return {
    ...oldState,
    version: ONBOARDING_STATE_VERSION,
  }
}