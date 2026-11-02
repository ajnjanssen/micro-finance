import { type NextRequest, NextResponse } from "next/server";
import {
  addActivityLog,
  upsertActivityLogs,
} from "@/services/activity-log-service";
import {
  getAppSettings,
  updateAppSettings,
} from "@/services/app-settings-service";
import { FinancialConfigService } from "@/services/financial-config-service";
import { upsertUserFinancialData } from "@/services/supabase-financial-store";
import {
  listUserSavingsGoals,
  upsertUserSavingsGoals,
} from "@/services/supabase-savings-goal-store";
import type { ActivityLog } from "@/types/activity-log";
import {
  type AppSettings,
  DAISY_UI_THEMES,
  DEFAULT_APP_SETTINGS,
} from "@/types/app-settings";
import type {
  Account,
  Category,
  FinancialData,
  Transaction,
} from "@/types/finance";
import type { FinancialConfiguration } from "@/types/financial-config";
import type { SavingsGoal, SavingsGoalsData } from "@/types/savings-goals";

type ImportBundle = {
  financialData?: FinancialData;
  financialConfig?: FinancialConfiguration;
  savingsGoals?: SavingsGoalsData;
  appSettings?: AppSettings;
  activityLog?: { logs: ActivityLog[] };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string";
}

function hasNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "number" && Number.isFinite(value[key]);
}

function hasBoolean(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "boolean";
}

function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function getConfigurationDateFallback(value: Record<string, unknown>): string {
  if (
    isRecord(value.startingBalance) &&
    isDateString(value.startingBalance.date)
  ) {
    return value.startingBalance.date;
  }
  if (typeof value.lastUpdated === "string") {
    const updatedAt = new Date(value.lastUpdated);
    if (!Number.isNaN(updatedAt.getTime())) {
      return updatedAt.toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizeOptionalDateFields(
  value: unknown,
  fields: string[],
): { value: unknown; clearedCount: number } {
  if (!isRecord(value)) return { value, clearedCount: 0 };
  const normalized = { ...value };
  let clearedCount = 0;
  for (const field of fields) {
    if (normalized[field] === "") {
      normalized[field] = undefined;
      clearedCount += 1;
    }
  }
  return { value: normalized, clearedCount };
}

function normalizeDateArray(
  value: Record<string, unknown>,
  key: string,
  fields: string[],
): { records: unknown; clearedCount: number } {
  const records = value[key];
  if (!Array.isArray(records)) return { records, clearedCount: 0 };
  let clearedCount = 0;
  const normalized = records.map((record) => {
    const result = normalizeOptionalDateFields(record, fields);
    clearedCount += result.clearedCount;
    return result.value;
  });
  return { records: normalized, clearedCount };
}

function normalizeFinancialConfiguration(value: unknown): {
  data: unknown;
  emptyOptionalDatesCleared: number;
} {
  if (!isRecord(value)) {
    return { data: value, emptyOptionalDatesCleared: 0 };
  }
  const settings = isRecord(value.settings) ? value.settings : {};
  const collections = [
    ["incomeSources", ["endDate"]],
    ["recurringExpenses", ["endDate"]],
    ["savingsGoals", ["deadline"]],
    ["assets", ["purchaseDate"]],
    ["liabilities", ["endDate"]],
  ] as const;
  const normalizedArrays = new Map<string, unknown>();
  let emptyOptionalDatesCleared = 0;
  for (const [key, fields] of collections) {
    const result = normalizeDateArray(value, key, [...fields]);
    normalizedArrays.set(key, result.records);
    emptyOptionalDatesCleared += result.clearedCount;
  }
  return {
    data: {
      ...value,
      ...Object.fromEntries(normalizedArrays),
      ...(isRecord(value.startingBalance)
        ? {
            startingBalance: {
              ...value.startingBalance,
              date: getConfigurationDateFallback(value),
            },
          }
        : {}),
      settings: {
        defaultCurrency: "EUR",
        projectionMonths: 36,
        conservativeMode: false,
        ...settings,
      },
    },
    emptyOptionalDatesCleared,
  };
}

function normalizeFinancialData(
  value: unknown,
  fallbackStartDate: string,
): {
  data: unknown;
  accountsDefaultedToZero: number;
  accountsDefaultedStartDate: number;
  emptyOptionalDatesCleared: number;
} {
  if (!isRecord(value) || !Array.isArray(value.accounts)) {
    return {
      data: value,
      accountsDefaultedToZero: 0,
      accountsDefaultedStartDate: 0,
      emptyOptionalDatesCleared: 0,
    };
  }

  let accountsDefaultedToZero = 0;
  let accountsDefaultedStartDate = 0;
  const normalizedTransactions = normalizeDateArray(value, "transactions", [
    "recurringEndDate",
    "completedDate",
  ]);
  const accounts = value.accounts.map((account) => {
    if (!isRecord(account)) return account;
    const needsBalance = account.startingBalance === undefined;
    const needsStartDate = !isDateString(account.startDate);
    if (needsBalance) accountsDefaultedToZero += 1;
    if (needsStartDate) accountsDefaultedStartDate += 1;
    if (!needsBalance && !needsStartDate) return account;
    return {
      ...account,
      ...(needsBalance ? { startingBalance: 0 } : {}),
      ...(needsStartDate
        ? {
            startDate:
              fallbackStartDate || new Date().toISOString().slice(0, 10),
          }
        : {}),
    };
  });

  return {
    data: {
      ...value,
      accounts,
      ...(Array.isArray(value.transactions)
        ? { transactions: normalizedTransactions.records }
        : {}),
    },
    accountsDefaultedToZero,
    accountsDefaultedStartDate,
    emptyOptionalDatesCleared: normalizedTransactions.clearedCount,
  };
}

function normalizeSavingsGoals(value: unknown): {
  data: unknown;
  emptyOptionalDatesCleared: number;
} {
  if (!isRecord(value)) return { data: value, emptyOptionalDatesCleared: 0 };
  const result = normalizeDateArray(value, "goals", [
    "deadline",
    "startDate",
    "endDate",
    "completedDate",
    "spentDate",
  ]);
  return {
    data: { ...value, goals: result.records },
    emptyOptionalDatesCleared: result.clearedCount,
  };
}

function hasId(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && hasString(value, "id");
}

function hasUniqueIds(values: unknown[]): boolean {
  const ids = values.map((value) => (hasId(value) ? value.id : null));
  return (
    ids.every((id) => typeof id === "string") &&
    new Set(ids).size === ids.length
  );
}

function isAccount(value: unknown): value is Account {
  if (!isRecord(value)) return false;
  return (
    hasString(value, "id") &&
    hasString(value, "name") &&
    ["checking", "savings", "crypto", "stocks", "debt", "other"].includes(
      String(value.type),
    ) &&
    hasNumber(value, "startingBalance") &&
    isDateString(value.startDate) &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    (value.expectedAnnualReturn === undefined ||
      hasNumber(value, "expectedAnnualReturn"))
  );
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "name") &&
    ["income", "expense", "transfer"].includes(String(value.type)) &&
    hasString(value, "color")
  );
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "description") &&
    hasNumber(value, "amount") &&
    ["income", "expense", "transfer"].includes(String(value.type)) &&
    hasString(value, "category") &&
    hasString(value, "accountId") &&
    isDateString(value.date) &&
    hasBoolean(value, "isRecurring") &&
    (value.recurringEndDate === undefined ||
      isDateString(value.recurringEndDate)) &&
    (value.completedDate === undefined || isDateString(value.completedDate)) &&
    (value.tags === undefined ||
      (Array.isArray(value.tags) &&
        value.tags.every((tag) => typeof tag === "string"))) &&
    (value.completed === undefined || typeof value.completed === "boolean")
  );
}

function isFinancialData(value: unknown): value is FinancialData {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.accounts) &&
    value.accounts.every(isAccount) &&
    hasUniqueIds(value.accounts) &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategory) &&
    hasUniqueIds(value.categories) &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isTransaction) &&
    hasUniqueIds(value.transactions)
  );
}

function isConfigItem(value: unknown, required: Record<string, string>) {
  if (!isRecord(value) || !hasString(value, "id")) return false;
  return Object.entries(required).every(([key, kind]) => {
    if (kind === "string") return hasString(value, key);
    if (kind === "number") return hasNumber(value, key);
    return hasBoolean(value, key);
  });
}

function isConfigSavingsGoal(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isConfigItem(value, {
      name: "string",
      targetAmount: "number",
      currentAmount: "number",
      priority: "string",
      isActive: "boolean",
    }) && ["low", "medium", "high"].includes(String(value.priority))
  );
}

function isAsset(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isConfigItem(value, {
      name: "string",
      type: "string",
      currentValue: "number",
      isActive: "boolean",
      lastUpdated: "string",
    }) &&
    [
      "property",
      "vehicle",
      "investment",
      "savings",
      "crypto",
      "other",
    ].includes(String(value.type))
  );
}

function isLiability(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isConfigItem(value, {
      name: "string",
      type: "string",
      originalAmount: "number",
      currentBalance: "number",
      interestRate: "number",
      startDate: "string",
      isActive: "boolean",
      lastUpdated: "string",
    }) &&
    [
      "student-loan",
      "mortgage",
      "credit-card",
      "personal-loan",
      "car-loan",
      "other",
    ].includes(String(value.type))
  );
}

function isFinancialConfiguration(
  value: unknown,
): value is FinancialConfiguration {
  if (
    !isRecord(value) ||
    !isRecord(value.startingBalance) ||
    !isRecord(value.settings)
  ) {
    return false;
  }
  const balance = value.startingBalance;
  const settings = value.settings;
  const arrays = [
    [
      "incomeSources",
      {
        name: "string",
        amount: "number",
        frequency: "string",
        startDate: "string",
        isActive: "boolean",
        category: "string",
      },
    ],
    [
      "recurringExpenses",
      {
        name: "string",
        category: "string",
        amount: "number",
        frequency: "string",
        startDate: "string",
        isActive: "boolean",
        isEssential: "boolean",
        isVariable: "boolean",
      },
    ],
    [
      "oneTimeExpenses",
      {
        name: "string",
        category: "string",
        amount: "number",
        date: "string",
        isPaid: "boolean",
      },
    ],
  ] as const;

  if (
    !isDateString(balance.date) ||
    !hasNumber(balance, "checking") ||
    !hasNumber(balance, "savings") ||
    !["EUR", "USD", "GBP"].includes(String(settings.defaultCurrency)) ||
    !hasNumber(settings, "projectionMonths") ||
    !hasBoolean(settings, "conservativeMode")
  ) {
    return false;
  }

  for (const [key, required] of arrays) {
    const records = value[key];
    if (
      !Array.isArray(records) ||
      !records.every((item) => isConfigItem(item, required)) ||
      !hasUniqueIds(records)
    ) {
      return false;
    }
  }

  const optionalArrays = [
    ["savingsGoals", isConfigSavingsGoal],
    ["assets", isAsset],
    ["liabilities", isLiability],
  ] as const;
  for (const [key, isItem] of optionalArrays) {
    const records: unknown = value[key];
    if (
      records !== undefined &&
      (!Array.isArray(records) ||
        !records.every(isItem) ||
        !hasUniqueIds(records))
    ) {
      return false;
    }
  }

  return true;
}

function isSavingsGoal(value: unknown): value is SavingsGoal {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "name") &&
    hasNumber(value, "targetAmount") &&
    hasNumber(value, "currentAmount") &&
    ["low", "medium", "high"].includes(String(value.priority)) &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt")
  );
}

function isSavingsGoalsData(value: unknown): value is SavingsGoalsData {
  return (
    isRecord(value) &&
    Array.isArray(value.goals) &&
    value.goals.every(isSavingsGoal) &&
    hasUniqueIds(value.goals)
  );
}

function isAppSettings(value: unknown): value is AppSettings {
  return (
    isRecord(value) &&
    DAISY_UI_THEMES.includes(value.theme as (typeof DAISY_UI_THEMES)[number]) &&
    isRecord(value.typography) &&
    hasString(value, "version")
  );
}

function isActivityLog(value: unknown): value is ActivityLog {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "timestamp") &&
    ["create", "update", "delete", "import", "export", "categorize"].includes(
      String(value.action),
    ) &&
    [
      "transaction",
      "account",
      "category",
      "budget",
      "savings-goal",
      "config",
      "app-settings",
    ].includes(String(value.entity))
  );
}

function hasImportData(bundle: ImportBundle): boolean {
  return [
    bundle.financialData,
    bundle.financialConfig,
    bundle.savingsGoals,
    bundle.appSettings,
    bundle.activityLog,
  ].some((value) => value !== undefined);
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

function isImportBundle(value: unknown): value is ImportBundle {
  if (!isRecord(value)) return false;
  return (
    (value.financialData === undefined ||
      isFinancialData(value.financialData)) &&
    (value.financialConfig === undefined ||
      isFinancialConfiguration(value.financialConfig)) &&
    (value.savingsGoals === undefined ||
      isSavingsGoalsData(value.savingsGoals)) &&
    (value.appSettings === undefined || isAppSettings(value.appSettings)) &&
    (value.activityLog === undefined ||
      (isRecord(value.activityLog) &&
        Array.isArray(value.activityLog.logs) &&
        value.activityLog.logs.every(isActivityLog) &&
        hasUniqueIds(value.activityLog.logs)))
  );
}

export async function POST(request: NextRequest) {
  let bundle: ImportBundle;
  let accountsDefaultedToZero = 0;
  let accountsDefaultedStartDate = 0;
  let emptyOptionalDatesCleared = 0;
  try {
    const body: unknown = await request.json();
    let normalizedBody = body;
    if (isRecord(body)) {
      const financialConfig =
        body.financialConfig === undefined
          ? undefined
          : normalizeFinancialConfiguration(body.financialConfig);
      const fallbackStartDate =
        financialConfig && isRecord(financialConfig.data)
          ? getConfigurationDateFallback(financialConfig.data)
          : new Date().toISOString().slice(0, 10);
      const normalizedFinancialData =
        body.financialData === undefined
          ? undefined
          : normalizeFinancialData(body.financialData, fallbackStartDate);
      const normalizedSavingsGoals =
        body.savingsGoals === undefined
          ? undefined
          : normalizeSavingsGoals(body.savingsGoals);
      accountsDefaultedToZero =
        normalizedFinancialData?.accountsDefaultedToZero ?? 0;
      accountsDefaultedStartDate =
        normalizedFinancialData?.accountsDefaultedStartDate ?? 0;
      emptyOptionalDatesCleared =
        (financialConfig?.emptyOptionalDatesCleared ?? 0) +
        (normalizedFinancialData?.emptyOptionalDatesCleared ?? 0) +
        (normalizedSavingsGoals?.emptyOptionalDatesCleared ?? 0);
      normalizedBody = {
        ...body,
        ...(financialConfig !== undefined
          ? { financialConfig: financialConfig.data }
          : {}),
        ...(normalizedFinancialData
          ? { financialData: normalizedFinancialData.data }
          : {}),
        ...(normalizedSavingsGoals
          ? { savingsGoals: normalizedSavingsGoals.data }
          : {}),
      };
    }
    if (!isImportBundle(normalizedBody)) {
      return NextResponse.json(
        {
          error:
            "De import bevat ongeldige gegevens. Controleer of alle geselecteerde JSON-bestanden ongewijzigd zijn en geen dubbele IDs bevatten.",
          invalidSections: isRecord(normalizedBody)
            ? Object.entries({
                financialData:
                  normalizedBody.financialData === undefined ||
                  isFinancialData(normalizedBody.financialData),
                financialConfig:
                  normalizedBody.financialConfig === undefined ||
                  isFinancialConfiguration(normalizedBody.financialConfig),
                savingsGoals:
                  normalizedBody.savingsGoals === undefined ||
                  isSavingsGoalsData(normalizedBody.savingsGoals),
                appSettings:
                  normalizedBody.appSettings === undefined ||
                  isAppSettings(normalizedBody.appSettings),
                activityLog:
                  normalizedBody.activityLog === undefined ||
                  (isRecord(normalizedBody.activityLog) &&
                    Array.isArray(normalizedBody.activityLog.logs) &&
                    normalizedBody.activityLog.logs.every(isActivityLog) &&
                    hasUniqueIds(normalizedBody.activityLog.logs)),
              })
                .filter(([, valid]) => !valid)
                .map(([section]) => section)
            : ["bundle"],
        },
        { status: 400 },
      );
    }
    bundle = normalizedBody;
    if (!hasImportData(bundle)) {
      return NextResponse.json(
        { error: "Er zijn geen herkenbare gegevens om te importeren." },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Het importbestand bevat geen geldige JSON." },
        { status: 400 },
      );
    }
    throw error;
  }

  const counts = {
    accounts: 0,
    categories: 0,
    transactions: 0,
    incomeSources: 0,
    recurringExpenses: 0,
    oneTimeExpenses: 0,
    assets: 0,
    liabilities: 0,
    savingsGoals: 0,
    activityLogs: 0,
    appSettings: 0,
  };

  let importStage = "financialData";
  try {
    if (bundle.financialData) {
      importStage = "financialData";
      await upsertUserFinancialData(bundle.financialData);
      counts.accounts = bundle.financialData.accounts.length;
      counts.categories = bundle.financialData.categories.length;
      counts.transactions = bundle.financialData.transactions.length;
    }

    if (bundle.financialConfig) {
      importStage = "financialConfig";
      const service = FinancialConfigService.getInstance();
      const current = await service.loadConfig();
      const incoming = bundle.financialConfig;
      const merged: FinancialConfiguration = {
        ...current,
        ...incoming,
        startingBalance: incoming.startingBalance,
        settings: { ...current.settings, ...incoming.settings },
        incomeSources: mergeById(current.incomeSources, incoming.incomeSources),
        recurringExpenses: mergeById(
          current.recurringExpenses,
          incoming.recurringExpenses,
        ),
        oneTimeExpenses: mergeById(
          current.oneTimeExpenses,
          incoming.oneTimeExpenses,
        ),
        savingsGoals: mergeById(
          current.savingsGoals,
          incoming.savingsGoals ?? [],
        ),
        assets: mergeById(current.assets ?? [], incoming.assets ?? []),
        liabilities: mergeById(
          current.liabilities ?? [],
          incoming.liabilities ?? [],
        ),
        budgetCategoryMappings: {
          ...current.budgetCategoryMappings,
          ...incoming.budgetCategoryMappings,
        },
      };
      await service.saveConfig(merged);
      counts.incomeSources = incoming.incomeSources.length;
      counts.recurringExpenses = incoming.recurringExpenses.length;
      counts.oneTimeExpenses = incoming.oneTimeExpenses.length;
      counts.assets = incoming.assets?.length ?? 0;
      counts.liabilities = incoming.liabilities?.length ?? 0;
    }

    if (bundle.savingsGoals) {
      importStage = "savingsGoals";
      const currentGoals = await listUserSavingsGoals();
      const mergedGoals = mergeById(currentGoals, bundle.savingsGoals.goals);
      await upsertUserSavingsGoals(mergedGoals);
      counts.savingsGoals = bundle.savingsGoals.goals.length;
    }

    if (bundle.appSettings) {
      importStage = "appSettings";
      const current = await getAppSettings();
      await updateAppSettings({
        ...current,
        ...bundle.appSettings,
        typography: {
          ...DEFAULT_APP_SETTINGS.typography,
          ...current.typography,
          ...bundle.appSettings.typography,
        },
      });
      counts.appSettings = 1;
    }

    if (bundle.activityLog) {
      importStage = "activityLog";
      await upsertActivityLogs(bundle.activityLog.logs);
      counts.activityLogs = bundle.activityLog.logs.length;
    }

    importStage = "activityLog";
    await addActivityLog("import", "config", {
      entityId: "local-json-migration",
      entityName: "Lokale JSON-migratie",
      description:
        "Lokale financiële JSON-bestanden samengevoegd met Supabase.",
      metadata: counts,
    });

    return NextResponse.json({
      success: true,
      counts,
      normalizations: {
        accountsDefaultedToZero,
        accountsDefaultedStartDate,
        emptyOptionalDatesCleared,
      },
    });
  } catch (error) {
    console.error(`Error importing financial data at ${importStage}:`, error);
    return NextResponse.json(
      {
        error:
          "Import niet volledig afgerond. Een deel kan al zijn opgeslagen; voer dezelfde import opnieuw uit. De import is veilig opnieuw uit te voeren.",
        failedStage: importStage,
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 },
    );
  }
}
