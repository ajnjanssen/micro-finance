export async function deleteTransaction(transactionId: string, onSuccess: () => void) {
  if (!confirm("Are you sure you want to delete this transaction?")) return false;

  try {
    const response = await fetch(`/api/settings/transactions/${transactionId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Delete transaction error:", error);
  }
  return false;
}
