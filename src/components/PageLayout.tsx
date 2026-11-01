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
    <div className="flex w-full flex-col gap-4 p-3 sm:gap-6 sm:p-4 lg:p-6">
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
    <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-base-content/70">{subtitle}</p>}
      </div>
      {action && <div className="w-full flex-shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}
