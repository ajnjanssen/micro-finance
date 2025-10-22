# Micro Finance

A personal finance management application built with Next.js that helps you track transactions, manage budgets, predict expenses, and achieve savings goals.

## Features

- 📊 **Dashboard Overview**: Real-time visualization of your financial health
- 💰 **Account Management**: Track multiple bank accounts and balances
- 📝 **Transaction Tracking**: Log and categorize income and expenses
- 📈 **Expense Predictions**: AI-powered forecasting of future expenses
- 🎯 **Budget Planner**: Set and monitor budget targets by category
- 🏆 **Savings Goals**: Create and track progress toward financial goals
- 📥 **CSV Import**: Bulk import transactions from bank exports
- 🔄 **Recurring Transaction Detection**: Automatically identify recurring patterns
- 🏷️ **Smart Categorization**: Intelligent auto-categorization with audit trails
- ⚡ **Duplicate Detection**: Prevent duplicate transaction entries

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

### First Time Setup

1. **Configure Categories**: Visit the Settings page to set up expense and income categories
2. **Add Accounts**: Create your bank accounts with starting balances
3. **Import Data**: Upload CSV files from your bank or manually add transactions
4. **Set Budgets**: Define budget limits for each category
5. **Create Savings Goals**: Set financial targets and track progress

### Importing Transactions

The app supports CSV imports from bank exports:

1. Navigate to the Upload page
2. Select your CSV file (must include: Date, Description, Amount)
3. The system will automatically:
   - Validate transactions
   - Detect and categorize expenses/income
   - Identify recurring patterns
   - Check for duplicates
   - Extract tags from descriptions

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
