interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DescriptionField({
  value,
  onChange,
}: DescriptionFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Description</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="textarea textarea-bordered w-full"
        rows={3}
      />
    </div>
  );
}
