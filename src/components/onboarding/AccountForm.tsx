import type { Account } from "@/types/finance";

interface AccountFormData {
  name: string;
  type: Account["type"];
  startingBalance: string;
  startDate: string;
  description: string;
  expectedAnnualReturn: number;
}

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Lopende rekening", icon: "🏦" },
  { value: "savings", label: "Spaarrekening", icon: "💰" },
  { value: "crypto", label: "Crypto", icon: "₿" },
  { value: "stocks", label: "Beleggingen (aandelen/indexfonds)", icon: "📈" },
  { value: "debt", label: "Schuld", icon: "💳" },
  { value: "other", label: "Overig", icon: "📝" },
] as const;

interface AccountFormProps {
  formData: AccountFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AccountForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  return (
    <form onSubmit={onSubmit} className="card bg-base-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold">Nieuwe Rekening</h3>

      <div>
        <label htmlFor="account-name" className="label-text">
          Naam
        </label>
        <input
          id="account-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="input input-bordered w-full"
          placeholder="bijv. ING Lopende Rekening"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="account-type" className="label-text">
            Type
          </label>
          <select
            id="account-type"
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as Account["type"],
                expectedAnnualReturn:
                  e.target.value === "stocks" &&
                  formData.expectedAnnualReturn === 0
                    ? 6
                    : formData.expectedAnnualReturn,
              })
            }
            className="select w-fit min-w-60 px-4 rounded-lg select-bordered"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="account-starting-balance" className="label-text">
            Huidig Saldo (€)
          </label>
          <input
            id="account-starting-balance"
            type="number"
            step="0.01"
            value={formData.startingBalance}
            onChange={(e) =>
              setFormData({ ...formData, startingBalance: e.target.value })
            }
            className="input input-bordered w-full"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {formData.type === "stocks" && (
        <div>
          <label htmlFor="expectedAnnualReturn" className="label-text">
            Verwacht rendement per jaar (%)
          </label>
          <input
            id="expectedAnnualReturn"
            type="number"
            min="-100"
            max="100"
            step="0.1"
            value={formData.expectedAnnualReturn}
            onChange={(e) =>
              setFormData({
                ...formData,
                expectedAnnualReturn:
                  e.target.value === "" ? 0 : Number(e.target.value),
              })
            }
            className="input input-bordered w-full"
          />
          <p className="label-text-alt mt-1">
            Schatting voor de prognose; maandelijks samengesteld.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost flex-1"
        >
          Annuleren
        </button>
        <button type="submit" className="btn btn-primary flex-1">
          Toevoegen
        </button>
      </div>
    </form>
  );
}
