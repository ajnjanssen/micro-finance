interface PageHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

export default function PageHeader({
  title,
  buttonLabel,
  onButtonClick,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold text-base-content sm:text-3xl">
        {title}
      </h1>
      <button
        type="button"
        onClick={onButtonClick}
        className="btn btn-primary w-full sm:w-auto"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
