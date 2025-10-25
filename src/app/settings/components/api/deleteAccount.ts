export async function deleteAccount(accountId: string, onSuccess: () => void) {
  if (!confirm("Are you sure you want to delete this account?")) return false;

  try {
    const response = await fetch(`/api/settings/accounts/${accountId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      onSuccess();
      return true;
    }
  } catch (error) {
    console.error("Delete account error:", error);
  }
  return false;
}
