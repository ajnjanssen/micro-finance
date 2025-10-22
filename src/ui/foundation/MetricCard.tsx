import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "success" | "error" | "warning" | "primary" | "info";
  icon?: ReactNode;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  variant = "primary",
  icon,
  className = "",
}: MetricCardProps) {
  const variantClasses = {
    success: "bg-success/5 border-success/20 text-success",
    error: "bg-error/5 border-error/20 text-error",
    warning: "bg-warning/5 border-warning/20 text-warning",
    primary: "bg-primary/5 border-primary/20 text-primary",
    info: "bg-info/5 border-info/20 text-info",
  };

  return (
    <div
      className={`p-4 rounded-lg border ${variantClasses[variant]} ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium">
          {title}
          {subtitle && <span className="text-xs ml-1">({subtitle})</span>}
        </h3>
        {icon && <div className="text-lg">{icon}</div>}
      </div>
      <p className="text-2xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
