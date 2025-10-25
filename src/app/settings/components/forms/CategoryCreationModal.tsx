interface CategoryCreationModalProps {
  newCategoryName: string;
  newCategoryColor: string;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}

export default function CategoryCreationModal({
  newCategoryName,
  newCategoryColor,
  onNameChange,
  onColorChange,
  onClose,
  onCreate,
}: CategoryCreationModalProps) {
  return (
    <div className="mt-3 p-3 border border-base-300 rounded-lg bg-base-200">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-sm">New Category</h4>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-xs btn-ghost"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2">
        <div>
          <label className="label-text text-xs">Name</label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => onNameChange(e.target.value)}
            className="input input-bordered input-sm w-full"
            placeholder="e.g. Savings, Vacation..."
          />
        </div>
        <div>
          <label className="label-text text-xs">Color</label>
          <input
            type="color"
            value={newCategoryColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="input input-bordered input-sm w-full h-8"
          />
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="btn btn-primary btn-sm w-full"
          disabled={!newCategoryName.trim()}
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
