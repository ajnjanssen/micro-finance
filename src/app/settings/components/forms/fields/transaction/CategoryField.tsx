import { Category } from "@/types/finance";
import Select from "@/components/ui/Select";

interface CategoryFieldProps {
  value: string;
  type: "income" | "expense";
  categories: Category[];
  onChange: (value: string) => void;
  onCreateNew: () => void;
}

export default function CategoryField({
  value,
  type,
  categories,
  onChange,
  onCreateNew,
}: CategoryFieldProps) {
  return (
    <div>
      <label className="label">
        <span className="label-text">Category</span>
      </label>
      <Select
        value={value}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            onCreateNew();
          } else {
            onChange(e.target.value);
          }
        }}
        className="select-bordered"
        required
      >
        <option value="">Select Category</option>
        {categories
          .filter((cat) => cat.type === type)
          .map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        <option value="__new__">+ Add New Category</option>
      </Select>
    </div>
  );
}
