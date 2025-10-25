interface RecurringTypeFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RecurringTypeField({
  value,
  onChange,
}: RecurringTypeFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Recurring Type</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered w-full"
      >
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="weekly">Weekly</option>
        <option value="daily">Daily</option>
      </select>
    </div>
  );
}
