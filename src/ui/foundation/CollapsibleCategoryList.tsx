interface CategoryBreakdown {
  category: string;
  amount: number;
}

interface CollapsibleCategoryListProps {
  categories: CategoryBreakdown[];
  formatCurrency: (amount: number) => string;
  month: string;
  className?: string;
}

export default function CollapsibleCategoryList({
  categories,
  formatCurrency,
  month,
  className = "",
}: CollapsibleCategoryListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {categories.map((category, index) => (
        <div
          key={category.category}
          className="collapse collapse-arrow bg-base-200"
        >
          <input type="radio" name="category-accordion" />
          <div className="collapse-title text-md font-medium flex justify-between items-center">
            <span>{category.category}</span>
            <span className="text-error font-semibold">
              {formatCurrency(Math.abs(category.amount))}
            </span>
          </div>
          <div className="collapse-content">
            <div className="pt-2">
              <p className="text-sm text-base-content/70">
                Uitgave voor {category.category} in {month}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm">Bedrag:</span>
                <span className="font-medium text-error">
                  {formatCurrency(Math.abs(category.amount))}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
