export async function createAccount(account: any, onSuccess: () => void) {
  try {
    const response = await fetch("/api/settings/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(account),
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Create account error:", error);
  }
  return false;
}
