import type { Category } from "@/types/finance";

interface FilterBarProps {
	filter: string;
	setFilter: (value: string) => void;
	categoryFilter: string;
	setCategoryFilter: (value: string) => void;
	sortBy: string;
	setSortBy: (value: string) => void;
	categories: Category[];
}

export function FilterBar({
	filter,
	setFilter,
	categoryFilter,
	setCategoryFilter,
	sortBy,
	setSortBy,
	categories,
}: FilterBarProps) {
	return (
		<div className="flex flex-wrap gap-2 mb-4">
			<select
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				className="select select-bordered select-sm"
			>
				<option value="all">Alle transacties</option>
				<option value="income">Inkomsten</option>
				<option value="expense">Uitgaven</option>
			</select>

			<select
				value={categoryFilter}
				onChange={(e) => setCategoryFilter(e.target.value)}
				className="select select-bordered select-sm"
			>
				<option value="all">Alle categorieën</option>
				{categories.map((cat) => (
					<option key={cat.id} value={cat.id}>
						{cat.name}
					</option>
				))}
			</select>

			<select
				value={sortBy}
				onChange={(e) => setSortBy(e.target.value)}
				className="select select-bordered select-sm"
			>
				<option value="date-desc">Datum (nieuw → oud)</option>
				<option value="date-asc">Datum (oud → nieuw)</option>
				<option value="amount-desc">Bedrag (hoog → laag)</option>
				<option value="amount-asc">Bedrag (laag → hoog)</option>
			</select>
		</div>
	);
}
