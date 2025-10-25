interface TagsFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TagsField({ value, onChange }: TagsFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Tags (comma separated)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input input-bordered w-full"
        placeholder="tag1, tag2, tag3"
      />
    </div>
  );
}
