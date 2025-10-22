interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  labelClassName?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  className = "select select-bordered w-full px-2",
  labelClassName = "label",
}: SelectProps) {
  return (
    <div className="flex flex-col">
      <label className={labelClassName}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
