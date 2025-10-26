import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { addActivityLog } from "@/services/activity-log-service";

// Keyword patterns for auto-categorization
const categoryPatterns: { [key: string]: string[] } = {
  Boodschappen: [
    "albert heijn",
    "ah ",
    "jumbo",
    "lidl",
    "aldi",
    "plus supermarkt",
    "dirk",
    "vomar",
    "coop",
    "supermarkt",
    "yammy",
    "flink",
    "picnic",
    "gorillas",
    "getir",
    "spar",
    "hoogvliet",
    "deen",
    "marqt",
    "ekoplaza",
    "boni",
    "poiesz",
    "nettorama",
    "dekamarkt",
  ],
  "Eten & Drinken": [
    "restaurant",
    "cafe",
    "bar ",
    "thuisbezorgd",
    "uber eats",
    "deliveroo",
    "dominos",
    "pizza",
    "subway",
    "burger",
    "mcdonalds",
    "kfc",
    "starbucks",
    "bar 1672",
    "horeca",
    "eetcafe",
    "bistro",
    "brasserie",
    "lunchroom",
    "bakkerij",
    "bakker",
    "koffie",
    "coffee",
  ],
  Transport: [
    "shell",
    "bp ",
    "esso",
    "total",
    "texaco",
    "ns ",
    "ov-chipkaart",
    "parkeren",
    "parking",
    "q-park",
    "benzine",
    "taxi",
    "uber",
    "bolt",
    "train",
    "bus",
    "metro",
    "tram",
    "tanken",
    "brandstof",
    "autowas",
    "car wash",
    "toll",
    "tol",
  ],
  Wonen: [
    "energie",
    "eneco",
    "essent",
    "vattenfall",
    "budget energie",
    "ziggo",
    "kpn",
    "t-mobile",
    "vodafone",
    "internet",
    "huur",
    "rent",
    "hypotheek",
    "belastingdienst",
    "waternet",
    "gemeente",
    "gas",
    "water",
    "electra",
    "stroom",
    "verwarming",
    "telefoon",
  ],
  Entertainment: [
    "spotify",
    "netflix",
    "disney",
    "prime video",
    "youtube",
    "playstation",
    "xbox",
    "steam",
    "cinema",
    "bioscoop",
    "pathe",
    "kinepolis",
    "g2a.com",
    "nintendo",
    "game",
    "gaming",
    "theater",
    "concert",
    "festival",
    "museum",
    "pretpark",
  ],
  Verzekeringen: [
    "verzekering",
    "insurance",
    "zilveren kruis",
    "vgz",
    "cz",
    "menzis",
    "aegon",
    "allianz",
    "asr",
    "nationale nederlanden",
    "achmea",
    "reaal",
    "centraal beheer",
    "univé",
  ],
  Winkelen: [
    "bol.com",
    "amazon",
    "coolblue",
    "mediamarkt",
    "action",
    "hema",
    "kruidvat",
    "etos",
    "zeeman",
    "primark",
    "h&m",
    "zara",
    "wehkamp",
    "zalando",
    "klarna",
    "selecta",
    "blokker",
    "xenos",
    "wibra",
    "fashion",
    "clothing",
    "webshop",
    "online",
    "afrekening",
    "betaling",
    "payment",
    "store",
    "winkel",
  ],
  motor: ["motor", "motoronderdelen", "helm", "motorcycle", "moto"],
  abbonement: [
    "abonnement",
    "subscription",
    "member",
    "news groningen",
    "lidmaatschap",
  ],
  "reiskosten vergoeding": ["reiskosten", "travel expense", "km vergoeding"],
  onbekend: ["notprovided", "unknown", "onbekend"],
};

// Fallback patterns based on common merchant/transaction types
const fallbackPatterns: { [key: string]: string[] } = {
  Winkelen: [
    "b.v.",
    "bv ",
    "b v ",
    "nld",
    " nl ",
    "nederland",
    "amsterdam",
    "rotterdam",
    "utrecht",
    "groningen",
    "den haag",
    "eindhoven",
    "store",
    "shop",
    "retail",
  ],
  "Eten & Drinken": ["food", "lunch", "dinner", "breakfast", "diner", "eten"],
  Transport: ["nn00", "station", "reis", "travel"],
};

// Normalize text for matching
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

// Find best matching category based on description and amount
function findCategory(description: string, amount: number): string {
  const normalized = normalizeText(description);
  const absoluteAmount = Math.abs(amount);

  // Check primary patterns first
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern.toLowerCase())) {
        return category;
      }
    }
  }

  // Try fallback patterns
  for (const [category, patterns] of Object.entries(fallbackPatterns)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern.toLowerCase())) {
        return category;
      }
    }
  }

  // Default categorization based on amount
  // Large expenses (€200+) that don't match anything -> might need manual review later
  if (absoluteAmount >= 200) {
    return "onbekend"; // Large unknown expenses - easier to find and review
  }

  // Everything else defaults to Winkelen (most common category)
  return "Winkelen";
}

export async function POST(request: NextRequest) {
  try {
    const { dryRun = false } = await request.json();

    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const data = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(data);

    let categorizedCount = 0;
    let skippedCount = 0;
    const categorizationResults: Array<{
      id: string;
      description: string;
      oldCategory: string;
      newCategory: string;
      amount: number;
    }> = [];

    // Process each transaction
    financialData.transactions = financialData.transactions.map((tx: any) => {
      // Only auto-categorize uncategorized transactions
      if (tx.category !== "uncategorized" && tx.category) {
        skippedCount++;
        return tx;
      }

      const suggestedCategory = findCategory(tx.description, tx.amount);

      // Now we ALWAYS get a category (never null)
      categorizedCount++;

      // Determine confidence based on amount and category
      const absoluteAmount = Math.abs(tx.amount);
      let confidence = 75;
      let reason = "Auto-categorized based on description keywords";

      if (suggestedCategory === "Winkelen" && absoluteAmount < 50) {
        confidence = 50;
        reason = "Auto-categorized as default (small expense)";
      } else if (suggestedCategory === "onbekend" && absoluteAmount >= 200) {
        confidence = 40;
        reason = "Large expense - no clear match (review recommended)";
      } else if (absoluteAmount >= 200) {
        confidence = 85;
        reason = "Auto-categorized (large amount, high confidence match)";
      } else if (suggestedCategory === "Winkelen") {
        confidence = 55;
        reason = "Auto-categorized as default category";
      }

      categorizationResults.push({
        id: tx.id,
        description: tx.description,
        oldCategory: tx.category || "uncategorized",
        newCategory: suggestedCategory,
        amount: tx.amount,
      });

      if (!dryRun) {
        return {
          ...tx,
          category: suggestedCategory,
          autoCategorizationConfidence: confidence,
          categorizationReason: reason,
          manuallyReviewed: false,
        };
      }

      return tx;
    });

    // Save if not a dry run
    if (!dryRun) {
      financialData.lastUpdated = new Date().toISOString();
      await fs.writeFile(
        dataPath,
        JSON.stringify(financialData, null, 2),
        "utf-8"
      );

      // Log the activity
      await addActivityLog("update", "transaction", {
        entityId: "bulk-auto-categorize",
        entityName: "Auto-categorisatie",
        description: `${categorizedCount} transacties automatisch gecategoriseerd`,
        metadata: {
          count: categorizedCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      categorizedCount,
      skippedCount, // Should be 0 now - everything gets categorized
      totalProcessed: categorizedCount,
      dryRun,
      results: categorizationResults.slice(0, 30), // Return first 30 as preview
      highConfidence: categorizationResults.filter((r) => {
        const amount = Math.abs(r.amount);
        return amount >= 200 || categorizationResults.length > 0;
      }).length,
      lowConfidence: categorizationResults.filter((r) => {
        const amount = Math.abs(r.amount);
        return amount < 50;
      }).length,
    });
  } catch (error) {
    console.error("Error auto-categorizing:", error);
    return NextResponse.json(
      { error: "Failed to auto-categorize transactions" },
      { status: 500 }
    );
  }
}
