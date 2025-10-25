import Modal from "./Modal";

interface ConfirmModalProps {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
	title,
	message,
	confirmLabel = "Bevestigen",
	cancelLabel = "Annuleren",
	onConfirm,
	onCancel,
	type = "warning",
}: ConfirmModalProps) {
	const getButtonClass = () => {
		switch (type) {
			case "danger":
				return "btn-error";
			case "warning":
				return "btn-warning";
			case "info":
				return "btn-info";
			default:
				return "btn-primary";
		}
	};

	return (
		<Modal title={title} onClose={onCancel}>
			<div className="py-4">
				<p className="text-base-content">{message}</p>
			</div>
			<div className="modal-action">
				<button type="button" onClick={onCancel} className="btn btn-ghost">
					{cancelLabel}
				</button>
				<button
					type="button"
					onClick={onConfirm}
					className={`btn ${getButtonClass()}`}
				>
					{confirmLabel}
				</button>
			</div>
		</Modal>
	);
}
