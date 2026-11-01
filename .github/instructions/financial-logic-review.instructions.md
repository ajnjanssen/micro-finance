---
description: "Use when changing finance calculations, transaction completion, savings goals, category mapping, projections, or financial data persistence."
applyTo: ["src/services/**/*.ts", "src/app/api/**/*.ts", "src/hooks/**/*.ts", "src/components/dashboard/**/*.tsx", "src/components/savings-goals/**/*.tsx", "src/constants/**/*.ts"]
---

# Financial Logic Review

Keep these invariants consistent across the app:

- Treat transactions marked `completed: false` as planned, not actual. Legacy transactions without a `completed` field remain actual.
- Derive account balances from each account's starting balance and completed transactions on or after its tracking start date. Handle transfer entries once per side so internal transfers do not change total wealth.
- Store expected annual investment return on the investment account, not on each transaction. Compound it monthly as valuation growth; only actual/planned transfers affect invested principal, and growth is not income or a cash transfer.
- A savings-goal contribution is a completed transfer into the goal's destination account. Do not count the matching outgoing leg or goal-purchase expenses as savings.
- Initialize projected goal progress from completed transaction history, not zero or stale form state.
- Compare recurring expense activity by calendar month, so an expense starting or ending on the last day of a month is included for that month.
- Classify goal contributions and savings-category recurring amounts as savings, not living expenses. Advice must distinguish expenses, savings, and remaining cash.
- Reaching a savings target stops future contributions; it does not imply a purchase. Only a recorded expense can reduce the projected balance for a purchase.
- Project savings contributions as account-to-account transfers using configured source and destination accounts. Transfers must be visible and must not change total balance.
- When a savings-category recurring transfer matches a goal contribution by monthly amount and accounts, count one transfer and link it to that goal's progress rather than double-counting it.
- Avoid counting a manually configured debt payment and its matching generated debt expense twice.
- Map savings aliases to the savings budget category, not vacation.
- Do not replace financial data with an empty structure after malformed or unreadable data. Only a genuinely missing file may initialize an empty store; surface other read errors.
- Next.js 15 dynamic route handlers must await `context.params`.

These safeguards address issues found during the October 2026 app-wide financial logic review.
