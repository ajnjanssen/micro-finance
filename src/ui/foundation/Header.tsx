import { ReactNode } from "react";

interface HeaderProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6 | "p";
  children: ReactNode;
  className?: string;
}

export default function Header({
  level = 2,
  children,
  className = "",
}: HeaderProps) {
  const baseClasses = "font-semibold text-base-content";

  const levelClasses = {
    1: "text-3xl mb-6",
    2: "text-xl mb-4",
    3: "text-lg mb-3",
    4: "text-base mb-2",
    5: "text-sm mb-2",
    6: "text-xs mb-1",
    p: "text-base mb-2 font-normal",
  };

  const combinedClasses =
    `${baseClasses} ${levelClasses[level]} ${className}`.trim();

  if (level === "p") {
    return <p className={combinedClasses}>{children}</p>;
  }

  switch (level) {
    case 1:
      return <h1 className={combinedClasses}>{children}</h1>;
    case 2:
      return <h2 className={combinedClasses}>{children}</h2>;
    case 3:
      return <h3 className={combinedClasses}>{children}</h3>;
    case 4:
      return <h4 className={combinedClasses}>{children}</h4>;
    case 5:
      return <h5 className={combinedClasses}>{children}</h5>;
    case 6:
      return <h6 className={combinedClasses}>{children}</h6>;
    default:
      return <h2 className={combinedClasses}>{children}</h2>;
  }
}
