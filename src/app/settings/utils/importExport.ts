export async function handleExport() {
	try {
		const response = await fetch("/api/settings/export");
		const data = await response.json();

		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `micro-finance-settings-${
			new Date().toISOString().split("T")[0]
		}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Export error:", error);
	}
}

export async function handleImport(
	event: React.ChangeEvent<HTMLInputElement>,
	onSuccess: () => void
) {
	const file = event.target.files?.[0];
	if (!file) return;

	try {
		const text = await file.text();
		const data = JSON.parse(text);

		const response = await fetch("/api/settings/import", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (response.ok) {
			await onSuccess();
			alert("Import successful!");
		} else {
			alert("Import failed!");
		}
	} catch (error) {
		console.error("Import error:", error);
		alert("Invalid JSON file!");
	}
}
