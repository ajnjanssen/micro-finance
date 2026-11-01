import Select from "@/components/ui/Select";
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
    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <Select
        name="transactionFilter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className=""
      >
        <option value="all">Alle transacties</option>
        <option value="income">Inkomsten</option>
        <option value="expense">Uitgaven</option>
        <option value="transfer">Overboekingen</option>
      </Select>

      <Select
        name="categoryFilter"
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className=""
      >
        <option value="all">Alle categorieën</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>

      <Select
        name="sortBy"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className=""
      >
        <option value="date-desc">Datum (nieuw → oud)</option>
        <option value="date-asc">Datum (oud → nieuw)</option>
        <option value="amount-desc">Bedrag (hoog → laag)</option>
        <option value="amount-asc">Bedrag (laag → hoog)</option>
      </Select>
    </div>
  );
}
