interface PageHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

export default function PageHeader({ title, buttonLabel, onButtonClick }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-base-content">{title}</h1>
      <button onClick={onButtonClick} className="btn btn-primary">
        {buttonLabel}
      </button>
    </div>
  );
}
