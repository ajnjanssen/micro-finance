import { Category } from "@/types/finance";
import TypeField from "./transaction/TypeField";
import CategoryField from "./transaction/CategoryField";
import CategoryCreationModal from "../CategoryCreationModal";

interface TypeCategoryGroupProps {
  type: "income" | "expense";
  category: string;
  categories: Category[];
  isCreatingCategory: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  onTypeChange: (value: "income" | "expense") => void;
  onCategoryChange: (value: string) => void;
  onCreateNew: () => void;
  onCloseModal: () => void;
  onNameChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onCreate: () => void;
}

export default function TypeCategoryGroup({
  type,
  category,
  categories,
  isCreatingCategory,
  newCategoryName,
  newCategoryColor,
  onTypeChange,
  onCategoryChange,
  onCreateNew,
  onCloseModal,
  onNameChange,
  onColorChange,
  onCreate,
}: TypeCategoryGroupProps) {
  return (
    <>
      <TypeField value={type} onChange={onTypeChange} />
      <div>
        <CategoryField
          value={category}
          type={type}
          categories={categories}
          onChange={onCategoryChange}
          onCreateNew={onCreateNew}
        />
        {isCreatingCategory && (
          <CategoryCreationModal
            newCategoryName={newCategoryName}
            newCategoryColor={newCategoryColor}
            onNameChange={onNameChange}
            onColorChange={onColorChange}
            onClose={onCloseModal}
            onCreate={onCreate}
          />
        )}
      </div>
    </>
  );
}
