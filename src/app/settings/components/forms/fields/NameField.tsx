interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NameField({ value, onChange }: NameFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Name</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        required
      />
    </div>
  );
}
