import { parse } from "csv-parse/sync";
import {
  categorizeTransaction,
  detectRecurring,
  extractTags,
} from "@/services/transaction-validator";
import type { Account, FinancialData, Transaction } from "@/types/finance";

type CsvRow = Record<string, string>;

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseAmount(value: string): number {
  const normalized = value.replace(/[€\s]/g, "");
  const europeanDecimal = normalized.includes(",");
  const parsed = Number(
    europeanDecimal
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized,
  );
  if (!Number.isFinite(parsed)) throw new Error(`Invalid CSV amount: ${value}`);
  return parsed;
}

function parseDate(value: string): string {
  const input = value.trim();
  let date: string;
  if (/^\d{8}$/.test(input)) {
    date = `${input.slice(0, 4)}-${input.slice(4, 6)}-${input.slice(6, 8)}`;
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    const [day, month, year] = input.split("-");
    date = `${year}-${month}-${day}`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    date = input;
  } else {
    throw new Error(`Unsupported CSV date: ${value}`);
  }
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Invalid CSV date: ${value}`);
  }
  return date;
}

function findAccount(
  accounts: Account[],
  row: CsvRow,
  type: Account["type"],
): Account | undefined {
  const accountReference = row.rekening_naam || row.rekening;
  return (
    accounts.find(
      (account) =>
        account.type === type &&
        (account.id === accountReference || account.name === accountReference),
    ) ?? accounts.find((account) => account.type === type)
  );
}

export function parseFinancialCsv(
  content: string,
  financialData: FinancialData,
): { transactions: Transaction[]; skippedCount: number; parsedCount: number } {
  const lines = content.split(/\r?\n/, 1)[0] ?? "";
  const isSavingsFormat = normalizeHeader(lines).includes("rekening_naam");
  const rows = parse(content, {
    bom: true,
    columns: (headers: string[]) => headers.map(normalizeHeader),
    delimiter: ";",
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];

  const existingKeys = new Set(
    financialData.transactions.map(
      (transaction) =>
        `${transaction.description}|${transaction.date}|${transaction.amount}`,
    ),
  );
  const transactions: Transaction[] = [];
  let skippedCount = 0;

  for (const [index, row] of rows.entries()) {
    const dateValue = row.datum || row.date;
    const descriptionValue =
      row.naam_omschrijving || row.omschrijving || row.description || "Unknown";
    const amountValue = row.bedrag || row.amount;
    if (!dateValue || !amountValue) {
      throw new Error(`CSV row ${index + 2} is missing a date or amount.`);
    }

    const amount = parseAmount(amountValue);
    const direction = (row.af_bij || "").toLowerCase();
    const signedAmount =
      direction === "af"
        ? -Math.abs(amount)
        : direction === "bij"
          ? Math.abs(amount)
          : amount;
    const date = parseDate(dateValue);
    const notes = row.mededelingen || "";
    if (
      notes.includes("Oranje spaarrekening") ||
      row.omschrijving?.includes("Afronding van betaalrekening") ||
      descriptionValue === "NOTPROVIDED"
    ) {
      skippedCount++;
      continue;
    }

    const account = findAccount(
      financialData.accounts,
      row,
      isSavingsFormat ? "savings" : "checking",
    );
    if (!account) {
      throw new Error(
        `No ${isSavingsFormat ? "savings" : "checking"} account is configured.`,
      );
    }

    const description =
      descriptionValue === "NOTPROVIDED"
        ? notes.match(/Naam: ([^O]+)/)?.[1]?.trim() || "Unknown"
        : descriptionValue;
    const key = `${description}|${date}|${signedAmount}`;
    if (existingKeys.has(key)) {
      skippedCount++;
      continue;
    }

    const isIncome = signedAmount >= 0;
    const category = categorizeTransaction(
      description,
      notes,
      Math.abs(signedAmount),
    );
    const recurring = detectRecurring(
      description,
      notes,
      Math.abs(signedAmount),
    );
    const tags = extractTags(description, notes);
    const transaction: Transaction = {
      id: `tx-csv-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      description,
      amount: signedAmount,
      type: isIncome ? "income" : "expense",
      category: category.category,
      categoryReason: category.reason,
      accountId: account.id,
      date,
      isRecurring: recurring.isRecurring,
      ...(recurring.recurringType
        ? { recurringType: recurring.recurringType }
        : {}),
      ...(tags.length > 0 ? { tags } : {}),
    };
    transactions.push(transaction);
    existingKeys.add(key);
  }

  return {
    transactions,
    skippedCount,
    parsedCount: rows.length,
  };
}
