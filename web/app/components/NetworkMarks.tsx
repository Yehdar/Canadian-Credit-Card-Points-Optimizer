/* ── Shared network mark SVGs ───────────────────────────────────────────── */

export function VisaMark({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={className} aria-label="Visa">
      <text
        x="0" y="13"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontStyle="italic"
        fontSize="16"
        fill="#1A1A6E"
        letterSpacing="-0.5"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardMark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" className={className} aria-label="Mastercard">
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" />
      <path d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z" fill="#FF5F00" />
    </svg>
  );
}

export function AmexMark({ className = "h-4 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={className} aria-label="Amex">
      <text
        x="0" y="13"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="13"
        fill="#007BC1"
        letterSpacing="1.5"
      >
        AMEX
      </text>
    </svg>
  );
}
