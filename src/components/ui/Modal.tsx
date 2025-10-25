import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ModalProps {
	title: string;
	children: React.ReactNode;
	maxWidth?: string;
	onClose?: () => void;
}

export default function Modal({
	title,
	children,
	maxWidth = "modal-box",
	onClose,
}: ModalProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	if (!mounted) return null;

	return createPortal(
		<div className="modal modal-open">
			<div className={maxWidth}>
				<div className="flex justify-between items-center mb-4">
					<h3 className="font-bold text-lg">{title}</h3>
					{onClose && (
						<button
							type="button"
							onClick={onClose}
							className="btn btn-sm btn-ghost btn-circle"
						>
							✕
						</button>
					)}
				</div>
				{children}
			</div>
		</div>,
		document.body
	);
}
