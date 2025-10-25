import RecurringTypeField from "./transaction/RecurringTypeField";
import TagsField from "./transaction/TagsField";
import FormActions from "./FormActions";

interface RecurringTagsActionsGroupProps {
  isRecurring: boolean;
  recurringType: string;
  tags: string;
  isEdit: boolean;
  onRecurringTypeChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onCancel: () => void;
}

export default function RecurringTagsActionsGroup({
  isRecurring,
  recurringType,
  tags,
  isEdit,
  onRecurringTypeChange,
  onTagsChange,
  onCancel,
}: RecurringTagsActionsGroupProps) {
  return (
    <>
      {isRecurring && <RecurringTypeField value={recurringType} onChange={onRecurringTypeChange} />}
      <TagsField value={tags} onChange={onTagsChange} />
      <FormActions onCancel={onCancel} submitLabel={isEdit ? "Update" : "Create"} isEdit={isEdit} />
    </>
  );
}
