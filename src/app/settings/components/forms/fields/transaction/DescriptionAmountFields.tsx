interface DescriptionAmountFieldsProps {
  description: string;
  amount: number;
  onDescriptionChange: (value: string) => void;
  onAmountChange: (value: number) => void;
}

export default function DescriptionAmountFields({
  description,
  amount,
  onDescriptionChange,
  onAmountChange,
}: DescriptionAmountFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">
          <span className="label-text">Description</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="input input-bordered w-full"
          required
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text">Amount (€)</span>
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
          className="input input-bordered w-full"
          required
        />
      </div>
    </div>
  );
}
