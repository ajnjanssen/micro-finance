interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  isEdit: boolean;
}

export default function FormActions({
  onCancel,
  submitLabel,
  isEdit,
}: FormActionsProps) {
  return (
    <div className="modal-action">
      <button type="button" onClick={onCancel} className="btn">
        Cancel
      </button>
      <button type="submit" className="btn btn-primary">
        {isEdit ? "Update" : submitLabel}
      </button>
    </div>
  );
}
