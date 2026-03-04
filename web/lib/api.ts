const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface CardSummary {
  id: number;
  name: string;
  issuer: string;
  annualFee: number;
  pointsCurrency: string;
  cardType: string;
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
}

export interface SpendingBreakdown {
  groceries: number;
  dining: number;
  gas: number;
  travel: number;
  entertainment: number;
  subscriptions: number;
  transit: number;
  other: number;
}

export async function fetchCards(): Promise<CardSummary[]> {
  const res = await fetch(`${API_BASE}/api/cards`);
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);
  return res.json();
}

export async function fetchRecommendations(
  spending: SpendingBreakdown
): Promise<RecommendationResult[]> {
  const res = await fetch(`${API_BASE}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spending }),
  });
  if (!res.ok) throw new Error(`Failed to fetch recommendations: ${res.status}`);
  return res.json();
}
