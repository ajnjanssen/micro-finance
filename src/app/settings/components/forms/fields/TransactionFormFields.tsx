import { TransactionFormFieldsProps } from "../types/TransactionFormFieldsProps";
import UpperFieldsGroup from "./UpperFieldsGroup";
import LowerFieldsGroup from "./LowerFieldsGroup";

export default function TransactionFormFields(p: TransactionFormFieldsProps) {
  const { formData: f, onFormDataChange: upd } = p;
  return (
    <>
      <UpperFieldsGroup
        description={f.description} amount={f.amount} type={f.type} category={f.category} accountId={f.accountId}
        categories={p.categories} accounts={p.accounts}
        isCreatingCategory={p.isCreatingCategory} newCategoryName={p.newCategoryName} newCategoryColor={p.newCategoryColor}
        onDescriptionChange={(v) => upd({ ...f, description: v })}
        onAmountChange={(v) => upd({ ...f, amount: v })}
        onTypeChange={(v) => upd({ ...f, type: v })}
        onCategoryChange={(v) => upd({ ...f, category: v })}
        onAccountChange={(v) => upd({ ...f, accountId: v })}
        setIsCreatingCategory={p.setIsCreatingCategory}
        setNewCategoryName={p.setNewCategoryName}
        setNewCategoryColor={p.setNewCategoryColor}
        onCategoryCreated={p.onCategoryCreated}
      />

      <LowerFieldsGroup
        date={f.date} isRecurring={f.isRecurring} recurringType={f.recurringType} tags={f.tags} isEdit={!!p.transaction}
        onDateChange={(v) => upd({ ...f, date: v })}
        onRecurringChange={(v) => upd({ ...f, isRecurring: v })}
        onRecurringTypeChange={(v) => upd({ ...f, recurringType: v as any })}
        onTagsChange={(v) => upd({ ...f, tags: v })}
        onCancel={p.onCancel}
      />
    </>
  );
}