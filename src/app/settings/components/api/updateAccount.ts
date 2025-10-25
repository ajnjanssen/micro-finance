export async function updateAccount(account: any, onSuccess: () => void) {
  try {
    const response = await fetch(`/api/settings/accounts/${account.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Update account error:", error);
  }
  return false;
}
