import DescriptionAmountFields from "./transaction/DescriptionAmountFields";
import TypeCategoryAccountGrid from "./TypeCategoryAccountGrid";
import { Category, Account } from "@/types/finance";

interface UpperFieldsGroupProps {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  accountId: string;
  categories: Category[];
  accounts: Account[];
  isCreatingCategory: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  onDescriptionChange: (v: string) => void;
  onAmountChange: (v: number) => void;
  onTypeChange: (v: "income" | "expense") => void;
  onCategoryChange: (v: string) => void;
  onAccountChange: (v: string) => void;
  setIsCreatingCategory: (v: boolean) => void;
  setNewCategoryName: (v: string) => void;
  setNewCategoryColor: (v: string) => void;
  onCategoryCreated: () => void;
}

export default function UpperFieldsGroup(p: UpperFieldsGroupProps) {
  return (
    <>
      <DescriptionAmountFields description={p.description} amount={p.amount} onDescriptionChange={p.onDescriptionChange} onAmountChange={p.onAmountChange} />
      <TypeCategoryAccountGrid
        type={p.type} category={p.category} accountId={p.accountId} categories={p.categories} accounts={p.accounts}
        isCreatingCategory={p.isCreatingCategory} newCategoryName={p.newCategoryName} newCategoryColor={p.newCategoryColor}
        onTypeChange={p.onTypeChange} onCategoryChange={p.onCategoryChange} onAccountChange={p.onAccountChange}
        setIsCreatingCategory={p.setIsCreatingCategory} setNewCategoryName={p.setNewCategoryName} setNewCategoryColor={p.setNewCategoryColor}
        onCategoryCreated={p.onCategoryCreated}
      />
    </>
  );
}

