import { Category, Account } from "@/types/finance";
import TypeCategoryGroup from "./TypeCategoryGroup";
import AccountField from "./transaction/AccountField";

interface TypeCategoryAccountGridProps {
  type: "income" | "expense";
  category: string;
  accountId: string;
  categories: Category[];
  accounts: Account[];
  isCreatingCategory: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  onTypeChange: (value: "income" | "expense") => void;
  onCategoryChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  setIsCreatingCategory: (value: boolean) => void;
  setNewCategoryName: (value: string) => void;
  setNewCategoryColor: (value: string) => void;
  onCategoryCreated: () => void;
}

export default function TypeCategoryAccountGrid({
  type,
  category,
  accountId,
  categories,
  accounts,
  isCreatingCategory,
  newCategoryName,
  newCategoryColor,
  onTypeChange,
  onCategoryChange,
  onAccountChange,
  setIsCreatingCategory,
  setNewCategoryName,
  setNewCategoryColor,
  onCategoryCreated,
}: TypeCategoryAccountGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <TypeCategoryGroup
        type={type}
        category={category}
        categories={categories}
        isCreatingCategory={isCreatingCategory}
        newCategoryName={newCategoryName}
        newCategoryColor={newCategoryColor}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
        onCreateNew={() => setIsCreatingCategory(true)}
        onCloseModal={() => setIsCreatingCategory(false)}
        onNameChange={setNewCategoryName}
        onColorChange={setNewCategoryColor}
        onCreate={onCategoryCreated}
      />
      <AccountField value={accountId} accounts={accounts} onChange={onAccountChange} />
    </div>
  );
}
