// Database Types for HouseRater
// These types match the Supabase database schema

export type CategoryGroup = 'features' | 'size' | 'neighborhood' | 'transportation' | 'yard' | 'custom';
export type UserRole = 'owner' | 'member';
export type Rating = 0 | 1 | 2 | 3 | 4 | 5;

// ============================================
// Table Types
// ============================================

export interface Household {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdUser {
  id: string;
  household_id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  category_group: CategoryGroup;
  is_default: boolean;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWeight {
  id: string;
  household_user_id: string;
  category_id: string;
  weight: Rating;
  created_at: string;
  updated_at: string;
}

export interface House {
  id: string;
  household_id: string;
  nickname: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  lot_size_sqft: number | null;
  year_built: number | null;
  property_type: string | null;
  listing_url: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HouseRating {
  id: string;
  house_id: string;
  household_user_id: string;
  category_id: string;
  rating: Rating;
  nickname: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export type HouseholdInsert = Omit<Household, 'id' | 'created_at' | 'updated_at'>;

export type HouseholdUserInsert = Omit<HouseholdUser, 'id' | 'created_at' | 'updated_at'>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;

export type CategoryWeightInsert = Omit<CategoryWeight, 'id' | 'created_at' | 'updated_at'>;

export type HouseInsert = Omit<House, 'id' | 'created_at' | 'updated_at'>;

export type HouseRatingInsert = Omit<HouseRating, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// Update Types (for updating existing records)
// ============================================

export type HouseholdUpdate = Partial<Omit<Household, 'id' | 'created_at' | 'updated_at'>>;

export type HouseholdUserUpdate = Partial<Omit<HouseholdUser, 'id' | 'created_at' | 'updated_at' | 'household_id' | 'auth_user_id'>>;

export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'household_id'>>;

export type CategoryWeightUpdate = Partial<Omit<CategoryWeight, 'id' | 'created_at' | 'updated_at' | 'household_user_id' | 'category_id'>>;

export type HouseUpdate = Partial<Omit<House, 'id' | 'created_at' | 'updated_at' | 'household_id'>>;

export type HouseRatingUpdate = Partial<Omit<HouseRating, 'id' | 'created_at' | 'updated_at' | 'house_id' | 'household_user_id' | 'category_id'>>;

// ============================================
// Extended Types (with joins/computed fields)
// ============================================

export interface CategoryWithWeight extends Category {
  weights?: CategoryWeight[];
  average_weight?: number;
}

export interface HouseWithRatings extends House {
  ratings?: HouseRating[];
  average_score?: number;
  total_ratings_count?: number;
}

export interface HouseRatingWithDetails extends HouseRating {
  category?: Category;
  household_user?: HouseholdUser;
  house?: House;
}

export interface CategoryWeightWithDetails extends CategoryWeight {
  category?: Category;
  household_user?: HouseholdUser;
}

// ============================================
// Aggregated Data Types
// ============================================

export interface CategoryAverages {
  category_id: string;
  category_name: string;
  average_weight: number;
  user_count: number;
}

export interface HouseScore {
  house_id: string;
  house_nickname: string | null;
  house_address: string;
  total_score: number;
  max_possible_score: number;
  percentage_score: number;
  category_scores: CategoryScore[];
}

export interface CategoryScore {
  category_id: string;
  category_name: string;
  category_group: CategoryGroup;
  average_weight: number;
  average_rating: number;
  weighted_score: number;
}

// ============================================
// Form/UI Types
// ============================================

export interface CategoryWeightForm {
  category_id: string;
  weight: Rating;
}

export interface HouseRatingForm {
  category_id: string;
  rating: Rating;
  nickname?: string;
  notes?: string;
}

export interface HouseForm {
  nickname?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface HouseholdUserForm {
  name: string;
  email: string;
  role: UserRole;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// Constants
// ============================================

export const CATEGORY_GROUPS: CategoryGroup[] = [
  'features',
  'size',
  'neighborhood',
  'transportation',
  'yard',
  'custom'
];

export const USER_ROLES: UserRole[] = ['owner', 'member'];

export const RATING_VALUES: Rating[] = [0, 1, 2, 3, 4, 5];

export const RATING_LABELS: Record<Rating, string> = {
  0: 'Not rated',
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export const CATEGORY_GROUP_LABELS: Record<CategoryGroup, string> = {
  features: 'Features',
  size: 'Size & Space',
  neighborhood: 'Neighborhood',
  transportation: 'Transportation',
  yard: 'Yard & Outdoor',
  custom: 'Custom'
};

// ============================================
// Business Logic Limits
// ============================================

export const HOUSEHOLD_LIMITS = {
  MIN_USERS: 2,
  MAX_USERS: 8,
  MAX_OWNERS: 2,
  DEFAULT_CATEGORIES: 34
} as const;
