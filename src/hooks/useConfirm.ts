"use client";

import { useState } from "react";

interface ConfirmOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	type?: "danger" | "warning" | "info";
}

export function useConfirm() {
	const [confirmState, setConfirmState] = useState<{
		isOpen: boolean;
		options: ConfirmOptions;
		onConfirm: () => void;
	} | null>(null);

	const confirm = (options: ConfirmOptions): Promise<boolean> => {
		return new Promise((resolve) => {
			setConfirmState({
				isOpen: true,
				options,
				onConfirm: () => {
					setConfirmState(null);
					resolve(true);
				},
			});
		});
	};

	const cancel = () => {
		setConfirmState(null);
	};

	return {
		confirm,
		confirmState,
		cancel,
	};
}
