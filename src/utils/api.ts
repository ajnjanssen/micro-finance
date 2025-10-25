export async function fetchData<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Fetch error (${url}):`, error);
    return null;
  }
}

export async function postData<T>(url: string, data: any): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Post error (${url}):`, error);
    return null;
  }
}

export async function putData<T>(url: string, data: any): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Put error (${url}):`, error);
    return null;
  }
}

export async function deleteData(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "DELETE" });
    return response.ok;
  } catch (error) {
    console.error(`Delete error (${url}):`, error);
    return false;
  }
}
