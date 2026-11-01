"use client";

import { Transaction, Category, Account } from "@/types/finance";
import { useTransactionForm } from "./forms/hooks/useTransactionForm";
import { useCreateCategory } from "./forms/hooks/useCreateCategory";
import ModalWrapper from "./forms/ModalWrapper";
import TransactionFormFields from "./forms/fields/TransactionFormFields";

interface TransactionFormProps {
  transaction?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  onSave: (transaction: any) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  categories,
  accounts,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const { formData, setFormData, handleSubmit } = useTransactionForm(
    transaction,
    onSave,
  );
  const {
    isCreatingCategory,
    newCategoryName,
    newCategoryColor,
    setIsCreatingCategory,
    setNewCategoryName,
    setNewCategoryColor,
    handleCreateCategory,
  } = useCreateCategory();

  const onCategoryCreated = async () => {
    const categoryId = await handleCreateCategory(
      formData.type === "income" ? "income" : "expense",
    );
    if (categoryId) {
      setFormData({ ...formData, category: categoryId });
    }
  };

  return (
    <ModalWrapper
      title={transaction ? "Edit Transaction" : "Create Transaction"}
      maxWidth="modal-box max-w-2xl"
    >
      <form
        onSubmit={(e) => handleSubmit(e, transaction)}
        className="space-y-4 mt-4"
      >
        <TransactionFormFields
          formData={formData}
          categories={categories}
          accounts={accounts}
          transaction={transaction}
          onFormDataChange={setFormData}
          isCreatingCategory={isCreatingCategory}
          newCategoryName={newCategoryName}
          newCategoryColor={newCategoryColor}
          setIsCreatingCategory={setIsCreatingCategory}
          setNewCategoryName={setNewCategoryName}
          setNewCategoryColor={setNewCategoryColor}
          onCategoryCreated={onCategoryCreated}
          onCancel={onCancel}
        />
      </form>
    </ModalWrapper>
  );
}
