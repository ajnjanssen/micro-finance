export async function createCategory(
  name: string,
  type: "income" | "expense",
  color: string
): Promise<string | null> {
  if (!name.trim()) return null;

  try {
    const response = await fetch("/api/settings/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, color }),
    });

    if (response.ok) {
      const newCategory = await response.json();
      return newCategory.id;
    }
  } catch (error) {
    console.error("Error creating category:", error);
  }
  return null;
}
