import type { RecommendationResult } from "@/lib/api";

interface CardResultsProps {
  results: RecommendationResult[];
}

const CATEGORY_LABELS: Record<string, string> = {
  groceries:     "Groceries",
  dining:        "Dining & Delivery",
  gas:           "Gas",
  travel:        "Travel",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  transit:       "Transit",
  other:         "Other",
};

function formatCAD(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function CardResults({ results }: CardResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Cards Ranked by Annual Net Value
      </h2>

      {results.map((result, index) => {
        const isPositive = result.netAnnualValue >= 0;

        return (
          <div
            key={result.card.id}
            className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900 ${
              index === 0
                ? "border-blue-400 ring-1 ring-blue-400 dark:border-blue-500"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Best Match
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">#{index + 1}</span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {result.card.name}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {result.card.issuer} &middot; {result.card.pointsCurrency} &middot;{" "}
                  {formatCAD(result.card.annualFee)}/yr
                </p>
              </div>

              <div className="text-right">
                <p className={`text-lg font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {isPositive ? "+" : ""}{formatCAD(result.netAnnualValue)}
                </p>
                <p className="text-xs text-zinc-400">net annual value</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Rewards Value</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatCAD(result.totalValueCAD)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Points Earned</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {result.totalPointsEarned.toLocaleString("en-CA")}
                </p>
              </div>
            </div>

            {result.breakdown.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-blue-600 hover:underline dark:text-blue-400">
                  View category breakdown
                </summary>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-zinc-400">
                      <th className="pb-1 font-medium">Category</th>
                      <th className="pb-1 text-right font-medium">Annual Spend</th>
                      <th className="pb-1 text-right font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {result.breakdown.map((b) => (
                      <tr key={b.category}>
                        <td className="py-1.5 text-zinc-700 dark:text-zinc-300">
                          {CATEGORY_LABELS[b.category] ?? b.category}
                        </td>
                        <td className="py-1.5 text-right text-zinc-500">
                          {formatCAD(b.spent)}
                        </td>
                        <td className="py-1.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {formatCAD(b.valueCAD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
