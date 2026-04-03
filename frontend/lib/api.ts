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

export interface SavedCardVisualConfig {
  baseColor:   string;
  metalness:   number;
  roughness:   number;
  finish:      "matte" | "glossy" | "brushed_metal";
  brandDomain: string;
  companyName: string;
  network:     "visa" | "mastercard" | "amex";
  cardNumber:  string;
  isMetal:     boolean;
}

export interface SavedCard {
  name:               string;
  issuer:             string;
  annualFee:          number;
  pointsCurrency:     string;
  cardType:           string;
  isPointsBased:      boolean;
  breakdown:          CategoryBreakdown[];
  totalPointsEarned:  number;
  totalValueCAD:      number;
  netAnnualValue:     number;
  eligibilityWarning?: string;
  purpose:            string;
  description:        string;
  visualConfig?:      SavedCardVisualConfig;
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

export interface ExtractedData {
  spending: {
    groceries: number | null; dining: number | null; gas: number | null;
    travel: number | null; entertainment: number | null; subscriptions: number | null;
    transit: number | null; pharmacy: number | null; onlineShopping: number | null;
    homeImprovement: number | null; canadianTirePartners: number | null;
    foreignPurchases: number | null; other: number | null;
  } | null;
  filters: {
    rewardType: RewardType | null; feePreference: FeePreference | null;
    rogersOwner: boolean | null; amazonPrime: boolean | null;
    institutions: string[] | null; networks: CardNetwork[] | null;
    benefits: {
      noForeignFee: boolean | null; airportLounge: boolean | null;
      priorityTravel: boolean | null; freeCheckedBag: boolean | null;
    } | null;
  } | null;
  annualIncome: number | null;
  householdIncome: number | null;
  estimatedCreditScore: number | null;
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
  extractedSnapshot?: ExtractedData;
  spending: SpendingBreakdown;
  savedCards: SavedCard[] | null;
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
  savedCards?: SavedCard[];
  extractedSnapshot?: ExtractedData;
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

// ── Chat / Optimizer ──────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatResponse {
  message: string;
  isDone: boolean;
}

/** Shape sent to POST /api/chat for single-shot card optimization. */
export interface OptimizeRequest {
  strategy: string;           // "simple" | "arsenal"
  spending: SpendingBreakdown;
  filters: FormFilters;
  annualIncome?: number;
  householdIncome?: number;
  estimatedCreditScore?: number;
  userText?: string;          // Raw chat message — Gemini extracts spending/prefs from this
}

export async function sendOptimizeRequest(request: OptimizeRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Optimize request failed: ${res.status}`);
  return res.json();
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
