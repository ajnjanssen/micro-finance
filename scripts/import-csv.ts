import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import {
  categorizeTransaction,
  detectRecurring,
  extractTags,
} from "../src/services/transaction-validator";

interface CSVRow {
  datum: string;
  naam_omschrijving?: string;
  omschrijving?: string;
  rekening: string;
  rekening_naam?: string;
  tegenrekening: string;
  code?: string;
  af_bij: string;
  bedrag: string;
  valuta?: string;
  mutatiesoort: string;
  mededelingen: string;
  saldo_na_mutatie: string;
  tag?: string;
}

interface CSVFormat {
  isSavingsFormat: boolean;
  dateColumn: string;
  descriptionColumn: string;
  accountColumn: string;
  accountNameColumn?: string;
  amountColumn: string;
  currencyColumn?: string;
  delimiter: string;
  dateFormat: "YYYYMMDD" | "YYYY-MM-DD" | "DD-MM-YYYY";
}

function parseDutchDate(
  dateString: string,
  format: "YYYYMMDD" | "YYYY-MM-DD" | "DD-MM-YYYY"
): string {
  if (format === "YYYY-MM-DD") {
    return dateString; // Already in correct format
  }

  if (format === "DD-MM-YYYY") {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  if (dateString.length === 8) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
  return dateString;
}

function detectCSVFormat(csvContent: string): CSVFormat {
  const firstLine = csvContent.split("\n")[0];

  // Check if it's savings account format (has "Rekening naam" column)
  if (firstLine.includes("Rekening naam")) {
    return {
      isSavingsFormat: true,
      dateColumn: "datum",
      descriptionColumn: "omschrijving",
      accountColumn: "rekening",
      accountNameColumn: "rekening_naam",
      amountColumn: "bedrag",
      currencyColumn: "valuta",
      delimiter: ";",
      dateFormat: "YYYY-MM-DD",
    };
  } else {
    // Check for DD-MM-YYYY format (common in Rabobank, ING, ASN exports)
    if (
      firstLine.includes("Datum;Naam omschrijving") ||
      firstLine.includes("Datum;Omschrijving")
    ) {
      return {
        isSavingsFormat: false,
        dateColumn: "datum",
        descriptionColumn: "naam_omschrijving",
        accountColumn: "rekening",
        amountColumn: "bedrag",
        delimiter: ";",
        dateFormat: "DD-MM-YYYY",
      };
    } else {
      // Main account format (ING format with YYYYMMDD)
      return {
        isSavingsFormat: false,
        dateColumn: "datum",
        descriptionColumn: "naam_omschrijving",
        accountColumn: "rekening",
        amountColumn: "bedrag",
        delimiter: ";",
        dateFormat: "YYYYMMDD",
      };
    }
  }
}

function parseCSVRows(csvContent: string, format: CSVFormat): CSVRow[] {
  const columns = format.isSavingsFormat
    ? [
        "datum",
        "omschrijving",
        "rekening",
        "rekening_naam",
        "tegenrekening",
        "af_bij",
        "bedrag",
        "valuta",
        "mutatiesoort",
        "mededelingen",
        "saldo_na_mutatie",
      ]
    : [
        "datum",
        "naam_omschrijving",
        "rekening",
        "tegenrekening",
        "code",
        "af_bij",
        "bedrag",
        "mutatiesoort",
        "mededelingen",
        "saldo_na_mutatie",
        "tag",
      ];

  return parse(csvContent, {
    delimiter: format.delimiter,
    skip_empty_lines: true,
    from_line: 2,
    columns: columns,
  });
}

// Removed local implementations - using centralized validator service

async function importCSVTransactions() {
  try {
    // Find all CSV files in realdata folder
    const realdataDir = path.join(process.cwd(), "data", "realdata");
    const files = await fs.readdir(realdataDir);
    const csvFiles = files.filter((f) => f.endsWith(".csv"));

    if (csvFiles.length === 0) {
      console.log("❌ No CSV files found in data/realdata/");
      return;
    }

    console.log(`\n📂 Found ${csvFiles.length} CSV file(s):`);
    csvFiles.forEach((f) => console.log(`   - ${f}`));

    // Read existing financial data first
    const dataPath = path.join(process.cwd(), "data", "financial-data.json");
    const dataContent = await fs.readFile(dataPath, "utf-8");
    const financialData = JSON.parse(dataContent);

    // Build a Set of existing transactions using composite key: description|date|amount
    const existingTransactions = new Set(
      financialData.transactions.map(
        (t: any) => `${t.description}|${t.date}|${t.amount}`
      )
    );

    console.log(
      `\n📊 Current database: ${financialData.transactions.length} transactions`
    );

    let totalParsed = 0;
    let totalAdded = 0;
    let totalSkipped = 0;

    // Process each CSV file
    for (const csvFile of csvFiles) {
      const csvPath = path.join(realdataDir, csvFile);
      console.log(`\n📄 Processing: ${csvFile}`);

      const csvContent = await fs.readFile(csvPath, "utf-8");

      // Detect CSV format
      const format = detectCSVFormat(csvContent);
      console.log(
        `   Format: ${
          format.isSavingsFormat ? "Savings Account" : "Main Account"
        }`
      );

      // Parse CSV with appropriate format
      const rows: CSVRow[] = parseCSVRows(csvContent, format);

      console.log(`   Parsed ${rows.length} rows from this CSV`);
      totalParsed += rows.length;

      let addedFromThisFile = 0;
      let skippedFromThisFile = 0;

      // Convert CSV rows to transactions
      rows.forEach((row) => {
        const amount = parseFloat(row.bedrag.replace(",", "."));
        const isIncome = row.af_bij === "Bij";
        const finalAmount = isIncome ? amount : -amount;

        // Determine account based on CSV file type
        const accountType = format.isSavingsFormat ? "savings" : "checking";
        const account = financialData.accounts.find(
          (acc: any) => acc.type === accountType
        );
        if (!account) {
          console.error(
            `❌ No ${accountType} account found in financial data. Skipping transaction.`
          );
          skippedFromThisFile++;
          return;
        }
        const accountId = account.id;

        // Skip internal transfers between savings and checking accounts
        if (
          (row.mededelingen.includes("Oranje spaarrekening") ||
            row.omschrijving?.includes("Afronding van betaalrekening") ||
            row.naam_omschrijving === "NOTPROVIDED") &&
          (row.af_bij === "Af" || row.af_bij === "Bij")
        ) {
          skippedFromThisFile++;
          return;
        }

        // Skip savings account rounding transfers
        if (
          format.isSavingsFormat &&
          row.omschrijving?.includes("Afronding van betaalrekening")
        ) {
          skippedFromThisFile++;
          return;
        }

        // Create clean description
        let description = format.isSavingsFormat
          ? row.omschrijving || "Unknown"
          : row.naam_omschrijving || "Unknown";

        if (description === "NOTPROVIDED") {
          // Extract meaningful description from mededelingen
          const match = row.mededelingen.match(/Naam: ([^O]+)/);
          if (match) {
            description = match[1].trim();
          }
        }

        const parsedDate = parseDutchDate(row.datum, format.dateFormat);

        // Check for duplicate using composite key: description|date|amount
        const transactionKey = `${description}|${parsedDate}|${finalAmount}`;
        if (existingTransactions.has(transactionKey)) {
          skippedFromThisFile++;
          return;
        }

        const { category, reason } = categorizeTransaction(
          description,
          row.mededelingen,
          amount
        );
        const recurring = detectRecurring(
          description,
          row.mededelingen,
          amount
        );
        const tags = extractTags(description, row.mededelingen);

        const transaction = {
          id: `tx-csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: description,
          amount: finalAmount,
          type: isIncome ? "income" : "expense",
          category: category,
          categoryReason: reason,
          accountId: accountId,
          date: parsedDate,
          isRecurring: recurring.isRecurring,
          ...(recurring.recurringType && {
            recurringType: recurring.recurringType,
          }),
          ...(tags.length > 0 && { tags }),
        };

        financialData.transactions.push(transaction);
        existingTransactions.add(transactionKey);
        addedFromThisFile++;
        totalAdded++;
      });

      console.log(
        `   ✅ Added: ${addedFromThisFile} | ⏭️  Skipped (duplicates): ${skippedFromThisFile}`
      );
      totalSkipped += skippedFromThisFile;
    }

    // Sort transactions by date (newest first)
    financialData.transactions.sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Update lastUpdated
    financialData.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(dataPath, JSON.stringify(financialData, null, 2));

    console.log(`\n📊 Import Summary:`);
    console.log(`   Total rows parsed: ${totalParsed}`);
    console.log(`   ✅ New transactions added: ${totalAdded}`);
    console.log(`   ⏭️  Duplicates skipped: ${totalSkipped}`);
    console.log(
      `   📈 Total in database: ${financialData.transactions.length}`
    );

    if (totalAdded > 0) {
      console.log(
        `\n✅ Successfully imported! Don't forget to run set-starting-balance.ts if needed.`
      );
    } else {
      console.log(`\n⚠️  No new transactions added - all were duplicates.`);
    }
  } catch (error) {
    console.error("Error importing CSV:", error);
    throw error;
  }
}

// Export the function for use in API routes
export { importCSVTransactions };

// Run the import if this file is executed directly
importCSVTransactions();
