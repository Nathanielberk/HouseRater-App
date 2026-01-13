// Tour step definitions for each page/flow

import { TourStep } from './tourTypes'

export const welcomeSteps: TourStep[] = [
  {
    id: 'welcome-intro',
    title: 'Welcome to HouseRater!',
    content: 'Make confident home-buying decisions together.',
    type: 'modal',
  },
]

export const dashboardSteps: TourStep[] = [
  {
    id: 'dashboard-overview',
    title: 'Your Dashboard',
    content: 'This is your home base. See your household, houses, and progress here.',
    type: 'tooltip',
    targetSelector: '[data-tour="dashboard-main"]',
    position: 'bottom',
  },
]

export const categoriesSteps: TourStep[] = [
  {
    id: 'categories-intro',
    title: 'Customize Your Categories',
    content: 'Categories are the features you\'ll rate each house on. Review the defaults and add your own.',
    type: 'modal',
  },
]

export const prioritiesSteps: TourStep[] = [
  {
    id: 'priorities-intro',
    title: 'Set Your Priorities',
    content: 'Rate how important each category is to YOU personally. Do this independently before discussing with your household.',
    type: 'modal',
  },
]

export const housesSteps: TourStep[] = [
  {
    id: 'houses-intro',
    title: 'Add Your First House',
    content: 'Start by adding your current home as a baseline to compare potential new homes against.',
    type: 'modal',
  },
]

export const ratingSteps: TourStep[] = [
  {
    id: 'rating-intro',
    title: 'Rate This House',
    content: 'Rate how well this house performs on each category. Your ratings auto-save as you go.',
    type: 'modal',
  },
]

// The 5-step onboarding journey
export const onboardingJourney = [
  {
    step: 1,
    title: 'Set up your household',
    description: 'Invite everyone who\'ll help decide',
    icon: 'users',
  },
  {
    step: 2,
    title: 'Customize your categories',
    description: 'What features matter for YOUR ideal home?',
    icon: 'list',
  },
  {
    step: 3,
    title: 'Rate your priorities (individually!)',
    description: 'Each person rates what matters most to THEM',
    icon: 'scale',
  },
  {
    step: 4,
    title: 'Add houses to compare',
    description: 'Start with your current home as a baseline',
    icon: 'home',
  },
  {
    step: 5,
    title: 'Rate each house',
    description: 'See how houses score for your whole household',
    icon: 'star',
  },
] as const

export type OnboardingJourneyStep = typeof onboardingJourney[number]