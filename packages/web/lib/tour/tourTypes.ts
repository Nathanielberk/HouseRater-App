// Onboarding Tour Types

export type OnboardingStep =
  | 'household-members'  // Invite household members
  | 'categories-review'  // Review/customize categories
  | 'priorities-intro'   // Explain independent rating
  | 'add-first-house'    // Suggest current dwelling
  | 'rate-house'         // Rating walkthrough

export type TourName =
  | 'welcome'
  | 'dashboard'
  | 'categories'
  | 'priorities'
  | 'houses'
  | 'rating'

export interface TourStep {
  id: string
  targetSelector?: string  // For tooltip positioning
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  type?: 'modal' | 'tooltip' | 'banner'
  action?: {
    label: string
    href?: string
    onClick?: string
  }
}

export interface OnboardingState {
  userId: string                    // Key for multi-account support
  hasCompletedOnboarding: boolean   // Prevents auto-show after first completion
  isFirstLogin: boolean             // True until welcome modal dismissed
  completedSteps: OnboardingStep[]
  completedTours: TourName[]
  skippedTours: TourName[]
  version: number
}

export type OnboardingAction =
  | { type: 'COMPLETE_STEP'; step: OnboardingStep }
  | { type: 'COMPLETE_TOUR'; tour: TourName }
  | { type: 'SKIP_TOUR'; tour: TourName }
  | { type: 'DISMISS_WELCOME' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'LOAD_STATE'; state: OnboardingState }

export interface TourContextValue {
  state: OnboardingState
  dispatch: React.Dispatch<OnboardingAction>
  // Helper functions
  isStepCompleted: (step: OnboardingStep) => boolean
  isTourCompleted: (tour: TourName) => boolean
  isTourSkipped: (tour: TourName) => boolean
  shouldShowWelcome: boolean
  completeStep: (step: OnboardingStep) => void
  completeTour: (tour: TourName) => void
  skipTour: (tour: TourName) => void
  dismissWelcome: () => void
  completeOnboarding: () => void
  resetOnboarding: () => void
}

// Default state for new users
export const DEFAULT_ONBOARDING_STATE: Omit<OnboardingState, 'userId'> = {
  hasCompletedOnboarding: false,
  isFirstLogin: true,
  completedSteps: [],
  completedTours: [],
  skippedTours: [],
  version: 1,
}

// Current version for migration purposes
export const ONBOARDING_STATE_VERSION = 1