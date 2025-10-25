import { Transaction, Category, Account } from "@/types/finance";

export interface TransactionFormFieldsProps {
  formData: any;
  categories: Category[];
  accounts: Account[];
  isCreatingCategory: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  transaction?: Transaction | null;
  onFormDataChange: (data: any) => void;
  setIsCreatingCategory: (value: boolean) => void;
  setNewCategoryName: (value: string) => void;
  setNewCategoryColor: (value: string) => void;
  onCategoryCreated: () => void;
  onCancel: () => void;
}
