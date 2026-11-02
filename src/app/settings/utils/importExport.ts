type ImportBundle = {
  financialData?: unknown;
  financialConfig?: unknown;
  savingsGoals?: unknown;
  appSettings?: unknown;
  activityLog?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function getAccountsMissingStartDate(bundle: ImportBundle): number {
  if (
    !isRecord(bundle.financialData) ||
    !Array.isArray(bundle.financialData.accounts)
  ) {
    return 0;
  }
  return bundle.financialData.accounts.filter(
    (account) => !isRecord(account) || !isDateString(account.startDate),
  ).length;
}

function getAccountsMissingBalance(bundle: ImportBundle): number {
  if (
    !isRecord(bundle.financialData) ||
    !Array.isArray(bundle.financialData.accounts)
  ) {
    return 0;
  }
  return bundle.financialData.accounts.filter(
    (account) => isRecord(account) && account.startingBalance === undefined,
  ).length;
}

function countEmptyOptionalDates(value: unknown, fields: string[]): number {
  if (!Array.isArray(value)) return 0;
  return value.reduce((count, item) => {
    if (!isRecord(item)) return count;
    return count + fields.filter((field) => item[field] === "").length;
  }, 0);
}

function getEmptyOptionalDateCount(bundle: ImportBundle): number {
  let count = 0;
  if (isRecord(bundle.financialData)) {
    count += countEmptyOptionalDates(bundle.financialData.transactions, [
      "recurringEndDate",
      "completedDate",
    ]);
  }
  if (isRecord(bundle.financialConfig)) {
    count += countEmptyOptionalDates(bundle.financialConfig.incomeSources, [
      "endDate",
    ]);
    count += countEmptyOptionalDates(bundle.financialConfig.recurringExpenses, [
      "endDate",
    ]);
    count += countEmptyOptionalDates(bundle.financialConfig.savingsGoals, [
      "deadline",
    ]);
    count += countEmptyOptionalDates(bundle.financialConfig.assets, [
      "purchaseDate",
    ]);
    count += countEmptyOptionalDates(bundle.financialConfig.liabilities, [
      "endDate",
    ]);
  }
  if (isRecord(bundle.savingsGoals)) {
    count += countEmptyOptionalDates(bundle.savingsGoals.goals, [
      "deadline",
      "startDate",
      "endDate",
      "completedDate",
      "spentDate",
    ]);
  }
  return count;
}

async function readJson(file: File): Promise<unknown> {
  return JSON.parse(await file.text()) as unknown;
}

function getLocalDataKey(fileName: string): keyof ImportBundle | null {
  switch (fileName.toLowerCase()) {
    case "financial-data.json":
      return "financialData";
    case "financial-config.json":
      return "financialConfig";
    case "savings-goals.json":
      return "savingsGoals";
    case "app-settings.json":
      return "appSettings";
    case "activity-log.json":
      return "activityLog";
    default:
      return null;
  }
}

function formatImportCounts(counts: Record<string, number>): string {
  const labels: Record<string, string> = {
    accounts: "rekeningen",
    categories: "categorieën",
    transactions: "transacties",
    incomeSources: "inkomstenbronnen",
    recurringExpenses: "terugkerende uitgaven",
    oneTimeExpenses: "eenmalige uitgaven",
    assets: "bezittingen",
    liabilities: "schulden",
    savingsGoals: "spaardoelen",
    activityLogs: "activiteiten",
    appSettings: "app-instellingen",
  };
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${count} ${labels[key] ?? key}`)
    .join(", ");
}

export async function handleExport() {
  try {
    const response = await fetch("/api/settings/export");
    if (!response.ok) {
      throw new Error("Exporteren is mislukt.");
    }
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `micro-finance-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
    alert(error instanceof Error ? error.message : "Exporteren is mislukt.");
  }
}

export async function handleImport(
  event: React.ChangeEvent<HTMLInputElement>,
  onSuccess: () => void,
) {
  const files = Array.from(event.target.files ?? []);
  if (files.length === 0) return;

  try {
    const bundle: ImportBundle = {};
    const fileNames: string[] = [];

    for (const file of files) {
      const parsed: unknown = await readJson(file);
      fileNames.push(file.name);

      if (isRecord(parsed) && parsed.format === "micro-finance-backup") {
        if (files.length !== 1) {
          throw new Error("Selecteer een volledige back-up afzonderlijk.");
        }
        Object.assign(bundle, parsed);
        continue;
      }

      const key = getLocalDataKey(file.name);
      if (key) {
        if (bundle[key] !== undefined) {
          throw new Error(
            `Bestand ${file.name} is meer dan één keer geselecteerd.`,
          );
        }
        bundle[key] = parsed;
        continue;
      }

      if (
        isRecord(parsed) &&
        Array.isArray(parsed.accounts) &&
        Array.isArray(parsed.categories)
      ) {
        if (bundle.financialData !== undefined) {
          throw new Error(
            "Er is meer dan één financieel gegevensbestand geselecteerd.",
          );
        }
        bundle.financialData = {
          accounts: parsed.accounts,
          categories: parsed.categories,
          transactions: Array.isArray(parsed.transactions)
            ? parsed.transactions
            : [],
          lastUpdated:
            typeof parsed.lastUpdated === "string"
              ? parsed.lastUpdated
              : new Date().toISOString(),
        };
        continue;
      }

      throw new Error(
        `Bestand ${file.name} wordt niet herkend. Selecteer de JSON-bestanden uit de data-map of een volledige Micro Finance-back-up.`,
      );
    }

    const missingBalanceCount = getAccountsMissingBalance(bundle);
    const balanceWarning =
      missingBalanceCount > 0
        ? `\n\nLet op: ${missingBalanceCount} rekening(en) zonder beginsaldo krijgen € 0 als beginsaldo. De startdatum komt uit de financiële configuratie.`
        : "";
    const config = isRecord(bundle.financialConfig)
      ? bundle.financialConfig
      : null;
    const startingBalance =
      config && isRecord(config.startingBalance)
        ? config.startingBalance
        : null;
    const hasConfigurationDate = isDateString(startingBalance?.date);
    const missingAccountStartDates = getAccountsMissingStartDate(bundle);
    const startDateWarning =
      missingAccountStartDates > 0
        ? `\n\nLet op: ${missingAccountStartDates} rekening(en) zonder geldige startdatum krijgen ${
            hasConfigurationDate
              ? "de startdatum uit de financiële configuratie"
              : "de datum van de laatste configuratiewijziging (of vandaag als die ontbreekt)"
          } als trackingstartdatum.`
        : "";
    const emptyOptionalDateCount = getEmptyOptionalDateCount(bundle);
    const optionalDateWarning =
      emptyOptionalDateCount > 0
        ? `\n\nLet op: ${emptyOptionalDateCount} lege optionele datumvelden worden behandeld als niet ingesteld.`
        : "";
    if (
      !window.confirm(
        `Importeer ${fileNames.join(", ")} naar het ingelogde Supabase-account?\n\nDit voegt de gegevens samen. Records met hetzelfde ID worden bijgewerkt; overige cloudgegevens blijven behouden.${balanceWarning}${startDateWarning}${optionalDateWarning}`,
      )
    ) {
      return;
    }

    const response = await fetch("/api/settings/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bundle),
    });
    const result = (await response.json()) as {
      error?: string;
      counts?: Record<string, number>;
      invalidSections?: string[];
      failedStage?: string;
      detail?: string;
      normalizations?: {
        accountsDefaultedToZero?: number;
        accountsDefaultedStartDate?: number;
        emptyOptionalDatesCleared?: number;
      };
    };
    if (!response.ok) {
      const sectionLabels: Record<string, string> = {
        financialData: "rekeningen/transacties/categorieën",
        financialConfig: "budgetconfiguratie",
        savingsGoals: "spaardoelen",
        appSettings: "app-instellingen",
        activityLog: "activiteitenlog",
        bundle: "importbestand",
      };
      const invalidSections = result.invalidSections
        ?.map((section) => sectionLabels[section] ?? section)
        .join(", ");
      const failedStage = result.failedStage
        ? ` Mislukt bij: ${sectionLabels[result.failedStage] ?? result.failedStage}.`
        : "";
      const detail = result.detail ? ` Details: ${result.detail}` : "";
      throw new Error(
        `${result.error || "Importeren is mislukt."}${
          invalidSections ? ` Ongeldige secties: ${invalidSections}.` : ""
        }${failedStage}${detail}`,
      );
    }

    await onSuccess();
    const defaultedAccounts =
      result.normalizations?.accountsDefaultedToZero ?? 0;
    const normalizationNotice =
      defaultedAccounts > 0
        ? ` ${defaultedAccounts} rekening(en) kregen € 0 als beginsaldo omdat dit ontbrak in het bestand.`
        : "";
    const defaultedStartDates =
      result.normalizations?.accountsDefaultedStartDate ?? 0;
    const startDateNotice =
      defaultedStartDates > 0
        ? ` Voor ${defaultedStartDates} rekening(en) is een ontbrekende startdatum ingevuld.`
        : "";
    const clearedDates = result.normalizations?.emptyOptionalDatesCleared ?? 0;
    const clearedDateNotice =
      clearedDates > 0
        ? ` ${clearedDates} lege optionele datumvelden zijn behandeld als niet ingesteld.`
        : "";
    alert(
      `Import afgerond. Geïmporteerd: ${formatImportCounts(result.counts ?? {}) || "geen records"}.${normalizationNotice}${startDateNotice}${clearedDateNotice}`,
    );
  } catch (error) {
    console.error("Import error:", error);
    alert(error instanceof Error ? error.message : "Importeren is mislukt.");
  } finally {
    event.target.value = "";
  }
}
