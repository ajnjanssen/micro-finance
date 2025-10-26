import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Select({
  children,
  className = "",
  id,
  name,
  ...props
}: SelectProps) {
  // Ensure we have either an id or name for accessibility
  const selectId = id || name;
  const selectName = name || id;

  return (
    <select
      id={selectId}
      name={selectName}
      className={`select w-fit min-w-60 px-4 rounded-lg select-bordered ${className}`.trim()}
      {...props}
    >
      {children}
    </select>
  );
}
