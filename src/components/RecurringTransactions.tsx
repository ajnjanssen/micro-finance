"use client";

import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import type { Account } from "@/types/finance";

interface RecurringTransaction {
	source?: string;
	name?: string;
	amount: number;
	accountId?: string;
}

interface MonthProjection {
	month: string;
	incomeBreakdown: { source: string; amount: number; accountId?: string }[];
	expenseBreakdown: { name: string; amount: number; accountId?: string }[];
	savingsBreakdown?: { name: string; amount: number; accountId?: string }[];
	configuredIncome: number;
	configuredExpenses: number;
}

interface RecurringTransactionsProps {
	projections: MonthProjection[];
	accounts: Account[];
}

export default function RecurringTransactions({
	projections,
	accounts,
}: RecurringTransactionsProps) {
	const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
		new Set([projections[0]?.month])
	);

	const getAccountName = (accountId?: string) => {
		if (!accountId) return null;
		const account = accounts.find((a) => a.id === accountId);
		if (!account) return null;
		
		// Map account types to Dutch labels
		const typeLabels: Record<string, string> = {
			checking: "Lopende rekening",
			savings: "Spaarrekening",
			crypto: "Crypto",
			stocks: "Aandelen",
			debt: "Schuld",
			other: "Overig"
		};
		
		return typeLabels[account.type] || account.name;
	};

	const getAccountBadgeColor = (accountId?: string) => {
		if (!accountId) return "badge-ghost";
		const account = accounts.find((a) => a.id === accountId);
		if (!account) return "badge-ghost";
		
		switch (account.type) {
			case "checking":
				return "badge-primary";
			case "savings":
				return "badge-success";
			case "crypto":
				return "badge-warning";
			case "stocks":
				return "badge-info";
			default:
				return "badge-ghost";
		}
	};

	const toggleMonth = (month: string) => {
		setExpandedMonths((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(month)) {
				newSet.delete(month);
			} else {
				newSet.add(month);
			}
			return newSet;
		});
	};

	const formatMonth = (monthStr: string) => {
		const [year, month] = monthStr.split("-");
		const date = new Date(parseInt(year), parseInt(month) - 1, 1);
		return date.toLocaleDateString("nl-NL", {
			month: "long",
			year: "numeric",
		});
	};

	if (projections.length === 0) {
		return (
			<div className="card p-6 mt-6">
				<h2 className="text-xl font-semibold mb-4">
					Verwachte Terugkerende Transacties
				</h2>
				<p className="text-sm text-base-content/70">
					Geen projecties beschikbaar
				</p>
			</div>
		);
	}

	return (
		<div className="card p-6 mt-6 bg-base-100 shadow">
			<h2 className="text-xl font-semibold mb-2">
				Verwachte Terugkerende Transacties
			</h2>
			<p className="text-sm text-base-content/70 mb-4">
				{projections.length} maanden geprojecteerd
			</p>

			<div className="space-y-2">
				{projections.slice(0, 12).map((projection) => {
					const isExpanded = expandedMonths.has(projection.month);
					const totalIncome = projection.configuredIncome;
					const totalExpenses = projection.configuredExpenses;
					const netAmount = totalIncome - totalExpenses;

					return (
						<div
							key={projection.month}
							className="border border-base-300 rounded-lg overflow-hidden"
						>
							<div
								className="flex justify-between items-center p-4 bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
								onClick={() => toggleMonth(projection.month)}
							>
								<div className="flex items-center space-x-3">
									<svg
										className={`w-4 h-4 text-base-content transition-transform ${
											isExpanded ? "transform rotate-90" : ""
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5l7 7-7 7"
										/>
									</svg>
									<span className="font-medium text-base-content">
										{formatMonth(projection.month)}
									</span>
								</div>

								<div className="flex items-center gap-4">
									<div className="text-right">
										<div className="text-xs text-base-content/60">Netto</div>
										<div
											className={`font-semibold ${
												netAmount >= 0 ? "text-success" : "text-error"
											}`}
										>
											{formatCurrency(netAmount)}
										</div>
									</div>
								</div>
							</div>

							{isExpanded && (
								<div className="p-4 bg-base-100 border-t border-base-300">
									<div className="space-y-6">
										{/* Income Section */}
										{projection.incomeBreakdown.length > 0 && (
											<div>
												<h3 className="text-sm font-semibold text-success mb-3 flex items-center justify-between">
													<span>✅ Inkomsten</span>
													<span className="font-bold">
														{formatCurrency(totalIncome)}
													</span>
												</h3>
												<div className="space-y-1.5">
													{projection.incomeBreakdown.map((item, idx) => (
														<div
															key={idx}
															className="flex justify-between items-center py-1.5 px-3 bg-success/5 rounded border border-success/10"
														>
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<span className="text-sm text-base-content truncate">
																	{item.source}
																</span>
																{item.accountId && getAccountName(item.accountId) && (
																	<span className={`badge badge-xs ${getAccountBadgeColor(item.accountId)} flex-shrink-0`}>
																		{getAccountName(item.accountId)}
																	</span>
																)}
															</div>
															<span className="text-sm font-medium text-success ml-2 flex-shrink-0">
																{formatCurrency(item.amount)}
															</span>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Expenses Section */}
										{projection.expenseBreakdown.length > 0 && (
											<div>
												<h3 className="text-sm font-semibold text-error mb-3 flex items-center justify-between">
													<span>❌ Uitgaven</span>
													<span className="font-bold">
														{formatCurrency(totalExpenses)}
													</span>
												</h3>
												<div className="space-y-1.5">
													{projection.expenseBreakdown.map((item, idx) => (
														<div
															key={idx}
															className="flex justify-between items-center py-1.5 px-3 bg-error/5 rounded border border-error/10"
														>
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<span className="text-sm text-base-content truncate">
																	{item.name}
																</span>
																{item.accountId && getAccountName(item.accountId) && (
																	<span className={`badge badge-xs ${getAccountBadgeColor(item.accountId)} flex-shrink-0`}>
																		{getAccountName(item.accountId)}
																	</span>
																)}
															</div>
															<span className="text-sm font-medium text-error ml-2 flex-shrink-0">
																{formatCurrency(item.amount)}
															</span>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Savings Section */}
										{projection.savingsBreakdown && projection.savingsBreakdown.length > 0 && (
											<div>
												<h3 className="text-sm font-semibold text-warning mb-3 flex items-center justify-between">
													<span>💰 Sparen</span>
													<span className="font-bold">
														{formatCurrency(
															projection.savingsBreakdown.reduce((sum, s) => sum + s.amount, 0)
														)}
													</span>
												</h3>
												<div className="space-y-1.5">
													{projection.savingsBreakdown.map((item, idx) => (
														<div
															key={idx}
															className="flex justify-between items-center py-1.5 px-3 bg-warning/5 rounded border border-warning/10"
														>
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<span className="text-sm text-base-content truncate">
																	{item.name}
																</span>
																{item.accountId && getAccountName(item.accountId) && (
																	<span className={`badge badge-xs ${getAccountBadgeColor(item.accountId)} flex-shrink-0`}>
																		{getAccountName(item.accountId)}
																	</span>
																)}
															</div>
															<span className="text-sm font-medium text-warning ml-2 flex-shrink-0">
																{formatCurrency(item.amount)}
															</span>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
