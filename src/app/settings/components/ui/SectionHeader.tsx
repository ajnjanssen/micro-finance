interface SectionHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

export default function SectionHeader({ title, buttonLabel, onButtonClick }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <button onClick={onButtonClick} className="btn btn-primary btn-sm">
        {buttonLabel}
      </button>
    </div>
  );
}
