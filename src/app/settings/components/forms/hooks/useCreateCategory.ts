import { useState } from "react";
import { createCategory } from "../api/createCategory";

interface UseCreateCategoryReturn {
  isCreatingCategory: boolean;
  newCategoryName: string;
  newCategoryColor: string;
  setIsCreatingCategory: (value: boolean) => void;
  setNewCategoryName: (value: string) => void;
  setNewCategoryColor: (value: string) => void;
  handleCreateCategory: (formType: "income" | "expense") => Promise<string | null>;
  resetForm: () => void;
}

export function useCreateCategory(): UseCreateCategoryReturn {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  const handleCreateCategory = async (
    formType: "income" | "expense"
  ): Promise<string | null> => {
    const categoryId = await createCategory(
      newCategoryName,
      formType,
      newCategoryColor
    );
    if (categoryId) {
      resetForm();
    }
    return categoryId;
  };

  const resetForm = () => {
    setIsCreatingCategory(false);
    setNewCategoryName("");
    setNewCategoryColor("#3b82f6");
  };

  return {
    isCreatingCategory,
    newCategoryName,
    newCategoryColor,
    setIsCreatingCategory,
    setNewCategoryName,
    setNewCategoryColor,
    handleCreateCategory,
    resetForm,
  };
}
