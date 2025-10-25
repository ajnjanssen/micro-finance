export async function updateTransaction(transaction: any, onSuccess: () => void) {
  try {
    const response = await fetch(`/api/settings/transactions/${transaction.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Update transaction error:", error);
  }
  return false;
}
