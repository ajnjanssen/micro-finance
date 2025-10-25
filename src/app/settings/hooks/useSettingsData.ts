import { useState, useEffect } from "react";
import type { Account, Transaction, Category } from "@/types/finance";

export function useSettingsData() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [lastUpdated, setLastUpdated] = useState<string>("");
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const [accountsRes, transactionsRes, categoriesRes] = await Promise.all([
				fetch("/api/settings/accounts"),
				fetch("/api/settings/transactions"),
				fetch("/api/settings/categories"),
			]);

			const [accountsData, transactionsData, categoriesData] =
				await Promise.all([
					accountsRes.json(),
					transactionsRes.json(),
					categoriesRes.json(),
				]);

			setAccounts(accountsData);
			setTransactions(transactionsData);
			setCategories(categoriesData);
			setLastUpdated(accountsData.lastUpdated || new Date().toISOString());
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	return {
		accounts,
		transactions,
		categories,
		lastUpdated,
		loading,
		reload: loadData,
	};
}
