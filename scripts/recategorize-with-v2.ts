/**
 * Recategorize existing transactions using the new v2 import service rules
 */

import fs from "node:fs";
import path from "node:path";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  categoryReason?: string;
  [key: string]: any;
}

interface FinancialData {
  accounts: any[];
  transactions: Transaction[];
}

// Categorization rules matching import-service-v2.ts
const CATEGORIZATION_RULES: Record<
  string,
  { keywords: string[]; amountRange?: { min?: number; max?: number } }
> = {
  // Income
  salary: {
    keywords: [
      "exact cloud development",
      "exact cloud",
      "vrijdagonline",
      "salaris",
      "loon",
    ],
    amountRange: { min: 100, max: 10000 },
  },
  bonus: {
    keywords: ["dertiende maand", "13e maand", "vakantiegeld", "bonus"],
    amountRange: { min: 500 },
  },
  "investment-income": {
    keywords: [
      "dividend",
      "interest",
      "capital gain",
      "crypto",
      "restitutie",
      "terugbetaling",
    ],
  },

  // Housing
  rent: {
    keywords: ["huur", "rent", "patrimonium", "woningstichting"],
    amountRange: { min: 25, max: 3000 },
  },
  utilities: {
    keywords: [
      "eneco",
      "ziggo",
      "kpn",
      "t-mobile",
      "vodafone",
      "anwb energie",
      "energie",
      "gas & licht",
    ],
    amountRange: { min: 10, max: 500 },
  },

  // Food
  groceries: {
    keywords: [
      "albert heijn",
      "ah paterswolde",
      "ah to go",
      "plus",
      "jumbo",
      "lidl",
      "aldi",
      "dirk",
      "coop",
    ],
    amountRange: { max: 200 },
  },
  dining: {
    keywords: [
      "tango",
      "mcdonald",
      "kfc",
      "burger king",
      "subway",
      "domino",
      "pizza",
      "restaurant",
      "thuisbezorgd",
    ],
  },

  // Transport
  "public-transport": {
    keywords: ["ov-chipkaart", "tls", "ns ", "arriva", "connexxion"],
    amountRange: { max: 200 },
  },
  fuel: {
    keywords: ["shell", "esso", "bp ", "texaco", "total", "tankstation"],
  },

  // Insurance
  "health-insurance": {
    keywords: ["menzis", "zilveren kruis", "cz", "vgz", "zorgverzekering"],
    amountRange: { min: 50, max: 500 },
  },
  insurance: {
    keywords: [
      "verzekering",
      "insurance",
      "monuta",
      "asr",
      "nn schadeverzekering",
    ],
  },

  // Shopping
  shopping: {
    keywords: [
      "flink",
      "coolblue",
      "bol.com",
      "amazon",
      "vans",
      "nike",
      "h&m",
      "zara",
      "action",
      "hema",
    ],
  },

  // Entertainment
  subscriptions: {
    keywords: ["netflix", "spotify", "disney", "flitsmeister"],
    amountRange: { max: 50 },
  },
  entertainment: {
    keywords: [
      "bioscoop",
      "pathe",
      "fitness",
      "sportschool",
      "kart",
      "teamsport",
    ],
  },

  // Financial
  "loan-payment": {
    keywords: ["loan", "lening", "afbetaling", "student debt", "studie"],
    amountRange: { min: 50 },
  },
  "bank-fees": {
    keywords: ["oranjepakket", "kosten", "bank fee"],
    amountRange: { max: 50 },
  },

  // Personal Transfers
  "personal-transfer": {
    keywords: ["manuputty", "vriend", "friend", "loan to", "lend"],
    amountRange: { min: 20 },
  },
};

function categorizeTransaction(
  description: string,
  amount: number
): { category: string; confidence: number; reason: string } {
  const desc = description.toLowerCase();
  const absAmount = Math.abs(amount);

  let bestMatch: {
    category: string;
    confidence: number;
    matchedKeywords: string[];
  } = {
    category: "uncategorized",
    confidence: 0,
    matchedKeywords: [],
  };

  for (const [category, rule] of Object.entries(CATEGORIZATION_RULES)) {
    const matchedKeywords: string[] = [];

    // Check keyword matches
    for (const keyword of rule.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length === 0) continue;

    // Check amount range if specified
    if (rule.amountRange) {
      const { min, max } = rule.amountRange;
      if (min !== undefined && absAmount < min) continue;
      if (max !== undefined && absAmount > max) continue;
    }

    // Calculate confidence
    const keywordRatio = matchedKeywords.length / rule.keywords.length;
    let confidence = keywordRatio * 100;

    // Bonus for exact keyword matches
    if (
      matchedKeywords.some((kw) =>
        desc.includes(kw.toLowerCase().replace(/\s+/g, ""))
      )
    ) {
      confidence = Math.min(100, confidence + 20);
    }

    // Keep best match
    if (confidence > bestMatch.confidence) {
      bestMatch = { category, confidence, matchedKeywords };
    }
  }

  return {
    category: bestMatch.category,
    confidence: Math.round(bestMatch.confidence),
    reason:
      bestMatch.matchedKeywords.length > 0
        ? `Matched keywords: ${bestMatch.matchedKeywords.join(", ")}`
        : "No matching category rule found",
  };
}

async function main() {
  const dataPath = path.join(process.cwd(), "data", "financial-data.json");

  // Read data
  const data: FinancialData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(
    `\n🔍 Recategorizing ${data.transactions.length} transactions...`
  );

  let changed = 0;
  let improved = 0;
  const changes: Array<{
    description: string;
    oldCategory: string;
    newCategory: string;
    confidence: number;
  }> = [];

  // Recategorize each transaction
  for (const tx of data.transactions) {
    const result = categorizeTransaction(tx.description, tx.amount);

    if (
      result.category !== tx.category &&
      result.category !== "uncategorized"
    ) {
      changes.push({
        description: tx.description,
        oldCategory: tx.category,
        newCategory: result.category,
        confidence: result.confidence,
      });

      tx.category = result.category;
      tx.categoryReason = result.reason;
      changed++;

      if (result.confidence > 70) {
        improved++;
      }
    }
  }

  // Save updated data
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  // Report results
  console.log(`\n✅ Recategorization complete!`);
  console.log(`   Changed: ${changed} transactions`);
  console.log(`   High confidence (>70%): ${improved} transactions`);

  if (changes.length > 0) {
    console.log(`\n📋 Category Changes:`);
    const grouped = changes.reduce((acc, change) => {
      const key = `${change.oldCategory} → ${change.newCategory}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(change);
      return acc;
    }, {} as Record<string, typeof changes>);

    for (const [key, items] of Object.entries(grouped)) {
      console.log(`\n  ${key} (${items.length} transactions):`);
      for (const item of items.slice(0, 3)) {
        console.log(
          `    - ${item.description} (${item.confidence}% confidence)`
        );
      }
      if (items.length > 3) {
        console.log(`    ... and ${items.length - 3} more`);
      }
    }
  }

  console.log(`\n💾 Updated data saved to: ${dataPath}\n`);
}

main().catch(console.error);
