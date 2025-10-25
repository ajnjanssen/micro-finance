import DateRecurringFields from "./transaction/DateRecurringFields";
import RecurringTagsActionsGroup from "./RecurringTagsActionsGroup";

interface LowerFieldsGroupProps {
  date: string;
  isRecurring: boolean;
  recurringType: string;
  tags: string;
  isEdit: boolean;
  onDateChange: (v: string) => void;
  onRecurringChange: (v: boolean) => void;
  onRecurringTypeChange: (v: string) => void;
  onTagsChange: (v: string) => void;
  onCancel: () => void;
}

export default function LowerFieldsGroup(props: LowerFieldsGroupProps) {
  return (
    <>
      <DateRecurringFields
        date={props.date}
        isRecurring={props.isRecurring}
        onDateChange={props.onDateChange}
        onRecurringChange={props.onRecurringChange}
      />

      <RecurringTagsActionsGroup
        isRecurring={props.isRecurring}
        recurringType={props.recurringType}
        tags={props.tags}
        isEdit={props.isEdit}
        onRecurringTypeChange={props.onRecurringTypeChange}
        onTagsChange={props.onTagsChange}
        onCancel={props.onCancel}
      />
    </>
  );
}
