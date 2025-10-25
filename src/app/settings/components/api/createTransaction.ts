export async function createTransaction(transaction: any, onSuccess: () => void) {
  try {
    const response = await fetch("/api/settings/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Create transaction error:", error);
  }
  return false;
}
