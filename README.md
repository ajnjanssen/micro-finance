# Micro Finance

A personal finance management application built with Next.js that helps you **plan and project** your financial future based on your configured income and expenses.

## Philosophy: Configuration Over Calculation

This app uses a **planning-first approach**:

- ✅ **You configure** your recurring income, expenses, and savings goals
- ✅ **The app projects** your financial future based on your plans
- ✅ **CSV imports** serve as reference data for categorization ideas, not as source of truth
- ✅ **Manual balance entry** gives you control over your starting point

This means you define what your rent, salary, insurance, etc. **should be**, rather than the app trying to calculate it from partial historical data.

## Features

- 📊 **Dashboard Overview**: Real-time visualization of your financial projections
- 💰 **Account Management**: Set manual balances for bank accounts, investments, and crypto
- 📝 **Configuration-Based Planning**: Define your recurring income and expenses
- 📈 **Financial Projections**: Forecast your balance months ahead based on your plans
- 🎯 **Budget Planner**: Set and monitor budget targets by category
- 🏆 **Savings Goals**: Create and track progress toward financial goals
- 📥 **CSV Import**: Import transactions as reference data for category ideas
- 🏷️ **Smart Categorization**: Get suggestions from imported transaction patterns
- 🔄 **Recurring Pattern Setup**: Manually configure your recurring transactions

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS 4 + DaisyUI
- **Charts**: Recharts & MUI X-Charts
- **Data Format**: JSON-based local storage
- **Code Quality**: Biome (linting & formatting)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ajnjanssen/micro-finance.git
cd micro-finance
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script           | Description                             |
| ---------------- | --------------------------------------- |
| `npm run dev`    | Start development server with Turbopack |
| `npm run build`  | Build production application            |
| `npm start`      | Start production server                 |
| `npm run lint`   | Run Biome linter                        |
| `npm run format` | Format code with Biome                  |

## Usage

### First Time Setup - Onboarding Wizard 🚀

When you first open the app (or if you have no accounts configured), you'll be greeted by an **interactive onboarding wizard** that walks you through:

1. **Welcome** - Introduction to the configuration-first philosophy
2. **Add Accounts** - Set up your bank accounts with current balances
3. **Configure Income** - Add your salary and other recurring income sources
4. **Add Expenses** - Enter your rent, insurance, subscriptions, etc.
5. **Complete** - Review your setup and start using the app!

The wizard ensures you have everything configured before you start planning.

#### Manual Setup (Alternative)

If you skip the wizard or want to add more later:

1. **Set Starting Balances**: Define your current account balances as your baseline
2. **Configure Income Sources**: Add your salary and other recurring income
3. **Configure Recurring Expenses**: Manually enter your rent, insurance, subscriptions, etc.
4. **Optional - Import CSV**: Upload bank CSV files for category inspiration (not required)
5. **Set Budgets**: Define budget limits for each category
6. **Create Savings Goals**: Set financial targets and track progress

> **Tip**: You can reset and restart the onboarding wizard anytime from Settings → Activity Log → Reset Onboarding

### Working with CSV Imports (Optional)

CSV imports are **reference data only** - they help you identify categories and patterns, but **the configured amounts in your settings are what drive your projections**:

1. Navigate to the Upload page
2. Select your CSV file (must include: Date, Description, Amount)
3. Review the imported transactions for:
   - Category ideas (e.g., "I should add 'Streaming Services' category")
   - Recurring patterns (e.g., "Netflix charges €12.99 monthly")
   - Common merchants and descriptions
4. **Then manually configure** these as recurring expenses in Settings with the amounts **you plan to budget**

**Important**: Imported transaction amounts are NOT used for balance calculations or projections. They're just reference data to help you set up your budget configuration.

### Data Management

All financial data is stored locally in JSON files under the `data/` directory:

- `financial-data.json` - Transactions and accounts
- `financial-config.json` - Categories and settings
- `savings-goals.json` - Savings goal definitions
- `realdata/` - Uploaded CSV files

## Project Structure

```
micro-finance/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   └── [pages]/      # UI pages
│   ├── components/       # React components
│   ├── services/         # Business logic
│   │   ├── financial-data.ts
│   │   ├── transaction-validator.ts
│   │   ├── expense-prediction.ts
│   │   └── projection-engine-v3.ts
│   ├── types/            # TypeScript definitions
│   └── ui/               # UI foundation components
├── scripts/              # Data management scripts
├── data/                 # JSON data files
└── public/               # Static assets
```

## Key Services

### Transaction Validator

The single source of truth for all financial logic:

- Categorization rules (deterministic with audit trails)
- Recurring pattern detection
- Tag extraction
- Data validation
- Duplicate checking

Located at: `src/services/transaction-validator.ts`

### Projection Engine

Sophisticated financial forecasting:

- Monte Carlo simulations
- Historical trend analysis
- Seasonal adjustments
- Recurring expense modeling
- Budget-aware projections

Located at: `src/services/projection-engine-v3.ts`

## Customization

### Adding New Categories

Edit `src/services/transaction-validator.ts`:

```typescript
const CATEGORY_RULES: Record<string, CategoryRule> = {
  healthcare: {
    keywords: ["pharmacy", "doctor", "hospital"],
    type: "expense",
  },
  // Add more categories...
};
```

### Configuring Recurring Patterns

Edit `src/services/transaction-validator.ts` to add custom recurring transaction patterns.

## Scripts

Additional utility scripts are available in the `scripts/` directory. See [scripts/README.md](scripts/README.md) for detailed documentation.

## Data Privacy

This application stores all data locally on your machine. No data is sent to external servers or cloud services, ensuring complete privacy of your financial information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and for personal use.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Note**: This is a personal finance tool. Always maintain backups of your financial data and verify calculations independently for critical financial decisions.
