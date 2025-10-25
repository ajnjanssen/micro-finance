"use client";

import { useState } from "react";
import { Account } from "@/types/finance";
import { useAccountForm } from "./forms/hooks/useAccountForm";
import { handleAccountSubmit } from "./forms/handlers/handleAccountSubmit";
import ModalWrapper from "./forms/ModalWrapper";
import NameField from "./forms/fields/NameField";
import AccountTypeField from "./forms/fields/AccountTypeField";
import DescriptionField from "./forms/fields/DescriptionField";
import FormActions from "./forms/fields/FormActions";

interface AccountFormProps {
  account?: Account | null;
  onSave: (account: any) => void;
  onCancel: () => void;
}

export default function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const { getInitialData, prepareSubmitData } = useAccountForm(account);
  const [formData, setFormData] = useState(getInitialData());

  return (
    <ModalWrapper title={account ? "Edit Account" : "Create Account"}>
      <form
        onSubmit={(e) => handleAccountSubmit(e, formData, account, prepareSubmitData, onSave)}
        className="space-y-4 mt-4"
      >
        <NameField value={formData.name} onChange={(name) => setFormData({ ...formData, name })} />
        <AccountTypeField value={formData.type} onChange={(type) => setFormData({ ...formData, type })} />
        <DescriptionField value={formData.description} onChange={(description) => setFormData({ ...formData, description })} />
        <FormActions onCancel={onCancel} submitLabel="Create" isEdit={!!account} />
      </form>
    </ModalWrapper>
  );
}
