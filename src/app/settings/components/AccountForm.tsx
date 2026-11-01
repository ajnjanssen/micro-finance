"use client";

import { useState } from "react";
import type { Account } from "@/types/finance";
import AccountTypeField from "./forms/fields/AccountTypeField";
import DescriptionField from "./forms/fields/DescriptionField";
import FormActions from "./forms/fields/FormActions";
import NameField from "./forms/fields/NameField";
import { handleAccountSubmit } from "./forms/handlers/handleAccountSubmit";
import { useAccountForm } from "./forms/hooks/useAccountForm";
import ModalWrapper from "./forms/ModalWrapper";

interface AccountFormProps {
  account?: Account | null;
  onSave: (account: Account) => void;
  onCancel: () => void;
}

export default function AccountForm({
  account,
  onSave,
  onCancel,
}: AccountFormProps) {
  const { getInitialData, prepareSubmitData } = useAccountForm(account);
  const [formData, setFormData] = useState(getInitialData());

  return (
    <ModalWrapper title={account ? "Edit Account" : "Create Account"}>
      <form
        onSubmit={(e) =>
          handleAccountSubmit(e, formData, account, prepareSubmitData, onSave)
        }
        className="space-y-4 mt-4"
      >
        <NameField
          value={formData.name}
          onChange={(name) => setFormData({ ...formData, name })}
        />
        <AccountTypeField
          value={formData.type}
          onChange={(type) =>
            setFormData({
              ...formData,
              type,
              expectedAnnualReturn:
                type === "stocks" && formData.expectedAnnualReturn === 0
                  ? 6
                  : formData.expectedAnnualReturn,
            })
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="form-control">
            <label className="label" htmlFor="account-starting-balance">
              <span className="label-text">Startsaldo (€)</span>
            </label>
            <input
              id="account-starting-balance"
              type="number"
              step="0.01"
              className="input input-bordered w-full"
              value={formData.startingBalance}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  startingBalance: event.target.value,
                })
              }
              required
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="account-start-date">
              <span className="label-text">Begindatum saldo</span>
            </label>
            <input
              id="account-start-date"
              type="date"
              className="input input-bordered w-full"
              value={formData.startDate}
              onChange={(event) =>
                setFormData({ ...formData, startDate: event.target.value })
              }
              required
            />
          </div>
        </div>
        {formData.type === "stocks" && (
          <div className="form-control">
            <label className="label" htmlFor="account-expected-annual-return">
              <span className="label-text">
                Verwacht rendement per jaar (%)
              </span>
            </label>
            <input
              id="account-expected-annual-return"
              type="number"
              min="-100"
              max="100"
              step="0.1"
              className="input input-bordered w-full"
              value={formData.expectedAnnualReturn}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  expectedAnnualReturn:
                    event.target.value === "" ? 0 : Number(event.target.value),
                })
              }
            />
            <p className="label-text-alt mt-1">
              Een schatting voor de prognose; dit rendement wordt maandelijks
              samengesteld.
            </p>
          </div>
        )}
        <DescriptionField
          value={formData.description}
          onChange={(description) => setFormData({ ...formData, description })}
        />
        <FormActions
          onCancel={onCancel}
          submitLabel="Create"
          isEdit={!!account}
        />
      </form>
    </ModalWrapper>
  );
}
