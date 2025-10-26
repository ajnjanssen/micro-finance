interface TypeFieldProps {
  value: "income" | "expense";
  onChange: (value: "income" | "expense") => void;
}

export default function TypeField({ value, onChange }: TypeFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Type</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "income" | "expense")}
        className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
    </div>
  );
}
