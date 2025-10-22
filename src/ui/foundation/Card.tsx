import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const combinedClasses =
    `card bg-base-100 shadow-sm border border-base-300 ${paddingClasses[padding]} ${className}`.trim();

  return <div className={combinedClasses}>{children}</div>;
}
