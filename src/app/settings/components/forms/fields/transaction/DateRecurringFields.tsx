interface DateRecurringFieldsProps {
  date: string;
  isRecurring: boolean;
  onDateChange: (value: string) => void;
  onRecurringChange: (value: boolean) => void;
}

export default function DateRecurringFields({
  date,
  isRecurring,
  onDateChange,
  onRecurringChange,
}: DateRecurringFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">
          <span className="label-text">Date</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">Recurring</span>
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="checkbox"
          />
          <span className="label-text">Is Recurring</span>
        </div>
      </div>
    </div>
  );
}
