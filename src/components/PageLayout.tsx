interface PageLayoutProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageLayout({ children, maxWidth = "full" }: PageLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div
        className={`${maxWidthClasses[maxWidth]} w-full mx-auto flex flex-col gap-6`}
      >
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-base-content">{title}</h1>
        {subtitle && <p className="text-base-content/70">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
