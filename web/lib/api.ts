const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ProfileType = "personal" | "business" | "partner";

export interface CardSummary {
  id: number;
  name: string;
  issuer: string;
  annualFee: number;
  pointsCurrency: string;
  cardType: string;
  isPointsBased: boolean;  // true = points; false = cash-back / store-credit
}

export interface CategoryBreakdown {
  category: string;
  spent: number;
  pointsEarned: number;
  valueCAD: number;
}

export interface RecommendationResult {
  card: CardSummary;
  breakdown: CategoryBreakdown[];
  totalPointsEarned: number;
  totalValueCAD: number;
  netAnnualValue: number;
  /** Present when the user's credit score is within the soft buffer of the card's minimum. */
  eligibilityWarning?: string;
}

export interface SpendingBreakdown {
  // Original 8 categories
  groceries: number;
  dining: number;
  gas: number;
  travel: number;
  entertainment: number;
  subscriptions: number;
  transit: number;
  other: number;
  // Expanded in V4
  pharmacy: number;
  onlineShopping: number;
  homeImprovement: number;
  canadianTirePartners: number;
  foreignPurchases: number;
}

export type RewardType    = "cashback" | "points" | "both";
export type FeePreference = "no_fee" | "include_fee";
export type CardNetwork   = "visa" | "mastercard" | "amex";

export interface FormFilters {
  rewardType:          RewardType;
  feePreference:       FeePreference;
  rogersOwner:         boolean;
  amazonPrime:         boolean;
  institutions:        string[];
  networks:            CardNetwork[];
  benefits: {
    noForeignFee:        boolean;
    airportLounge:       boolean;
priorityTravel:      boolean;
    freeCheckedBag:      boolean;
  };
}

export interface SpendingFormSubmission {
  spending:             SpendingBreakdown;
  filters:              FormFilters;
  annualIncome?:        number;
  householdIncome?:     number;
  estimatedCreditScore?: number;
}

export interface Profile {
  id: number;
  name: string;
  profileType: ProfileType;
  spending: SpendingBreakdown;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfilePayload {
  name: string;
  profileType: ProfileType;
  spending: SpendingBreakdown;
}

export interface UpdateProfilePayload {
  name?: string;
  profileType?: ProfileType;
  spending?: SpendingBreakdown;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch(`${API_BASE}/api/profiles`);
  if (!res.ok) throw new Error(`Failed to fetch profiles: ${res.status}`);
  return res.json();
}

export async function createProfile(payload: CreateProfilePayload): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create profile: ${res.status}`);
  return res.json();
}

export async function updateProfile(id: number, payload: UpdateProfilePayload): Promise<Profile> {
  const res = await fetch(`${API_BASE}/api/profiles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update profile: ${res.status}`);
  return res.json();
}

export async function deleteProfile(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profiles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete profile: ${res.status}`);
}

export async function fetchRecommendations(
  args: (
    | { profileId: number }
    | { spending: SpendingBreakdown }
  ) & {
    filters?:              FormFilters;
    annualIncome?:         number;
    householdIncome?:      number;
    estimatedCreditScore?: number;
  }
): Promise<RecommendationResult[]> {
  const res = await fetch(`${API_BASE}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Failed to fetch recommendations: ${res.status}`);
  return res.json();
}
