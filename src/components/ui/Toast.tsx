"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = (message: string, type: ToastType = "info") => {
		const id = Math.random().toString(36).substring(7);
		const newToast = { id, message, type };

		setToasts((prev) => [...prev, newToast]);

		// Auto-remove after 3 seconds
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3000);
	};

	const getAlertClass = (type: ToastType) => {
		switch (type) {
			case "success":
				return "alert-success";
			case "error":
				return "alert-error";
			case "warning":
				return "alert-warning";
			case "info":
				return "alert-info";
			default:
				return "";
		}
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="toast toast-bottom toast-end z-50">
				{toasts.map((toast) => (
					<div key={toast.id} className={`alert ${getAlertClass(toast.type)}`}>
						<span>{toast.message}</span>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
