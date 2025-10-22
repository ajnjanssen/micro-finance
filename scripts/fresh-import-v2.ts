/**
 * Fresh Import with V2 Service
 * Clears all data and re-imports with proper categorization and recurring detection
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { ImportServiceV2 } from "../src/services/import-service-v2";

async function freshImport() {
  console.log("\n🔄 Starting Fresh Import with V2 Service\n");

  // 1. Clear existing data
  const dataPath = path.join(process.cwd(), "data", "financial-data.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`📦 Clearing ${data.transactions.length} old transactions...`);
  data.transactions = [];

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log("✅ Data cleared\n");

  // 2. Read CSV file
  const csvPath =
    "C:\\Users\\AJ-19\\Downloads\\NL56INGB0000946799_01-10-2024_19-10-2025.csv";
  console.log(`📂 Reading CSV: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, "latin1");
  console.log(`✅ Read CSV file\n`);

  // 3. Import with V2 service
  console.log("🔍 Importing with V2 categorization and recurring detection...");

  const importService = new ImportServiceV2();
  const result = await importService.importCSV(
    csvContent,
    "NL56INGB0000946799_01-10-2024_19-10-2025.csv",
    "checking-1",
    data
  );

  // 4. Save imported data
  data.transactions = result.transactions;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  // 5. Report results
  console.log("\n" + "=".repeat(60));
  console.log("📊 IMPORT SUMMARY");
  console.log("=".repeat(60));

  console.log(`\n✅ Successfully imported: ${result.imported} transactions`);
  console.log(`⏭️  Skipped (duplicates): ${result.skipped}`);
  console.log(
    `⚠️  Errors: ${result.errors.length > 0 ? result.errors.length : "None"}`
  );

  console.log(`\n📅 Date Range:`);
  console.log(`   From: ${result.dateRange.start}`);
  console.log(`   To:   ${result.dateRange.end}`);

  console.log(`\n💰 Financial Summary:`);
  console.log(`   Total Income:    €${result.totalIncome.toFixed(2)}`);
  console.log(`   Total Expenses:  €${result.totalExpenses.toFixed(2)}`);
  console.log(
    `   Net:             €${(result.totalIncome - result.totalExpenses).toFixed(
      2
    )}`
  );

  console.log(`\n🎯 Confidence Distribution:`);
  console.log(
    `   High (80-100%):   ${result.confidenceDistribution.high} transactions`
  );
  console.log(
    `   Medium (50-80%):  ${result.confidenceDistribution.medium} transactions`
  );
  console.log(
    `   Low (<50%):       ${result.confidenceDistribution.low} transactions`
  );

  console.log(`\n🔁 Recurring Patterns:`);
  console.log(`   Detected:  ${result.recurringDetected} transactions`);
  console.log(`   Confirmed: ${result.recurringConfirmed} (high confidence)`);

  console.log(`\n📋 Top Categories:`);
  const sortedCategories = Object.entries(result.categoryBreakdown).sort(
    (a, b) => b[1] - a[1]
  );
  sortedCategories.slice(0, 10).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} transactions`);
  });

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    result.warnings.forEach((warning) => {
      console.log(`   - ${warning.message}`);
    });
  }

  console.log(`\n🔧 Configuration Detected:`);
  console.log(`   Income Sources: ${result.detectedIncomeSources.length}`);
  result.detectedIncomeSources.forEach((source) => {
    console.log(
      `      - ${source.name}: €${source.monthlyAmount.toFixed(2)}/month`
    );
  });

  console.log(
    `   Recurring Expenses: ${result.detectedRecurringExpenses.length}`
  );
  result.detectedRecurringExpenses.slice(0, 5).forEach((expense) => {
    console.log(
      `      - ${expense.name}: €${expense.monthlyAmount.toFixed(2)}/month`
    );
  });

  if (result.needsReview > 0) {
    console.log(`\n👀 Needs Review: ${result.needsReview} transactions`);
    console.log("   (Low confidence categorization or unusual amounts)");
  }

  console.log("\n" + "=".repeat(60));
  console.log(`💾 Data saved to: ${dataPath}`);
  console.log("=".repeat(60));

  console.log(`\n📝 Next Steps:`);
  console.log(
    `   1. Set starting balance: npx tsx scripts/set-starting-balance-v2.ts checking-1 229.97`
  );
  console.log(
    `   2. Set savings balance: npx tsx scripts/set-starting-balance-v2.ts savings-1 120.95`
  );
  console.log(`   3. Review low-confidence transactions in the dashboard`);
  console.log(`   4. Verify recurring patterns are correct\n`);
}

freshImport().catch((error) => {
  console.error("\n❌ Import failed:", error);
  process.exit(1);
});
