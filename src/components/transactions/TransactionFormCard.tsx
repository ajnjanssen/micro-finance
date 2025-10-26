import TransactionForm from "@/components/TransactionForm";
import Modal from "@/components/ui/Modal";
import { Transaction, Account, Category } from "@/types/finance";

interface TransactionFormCardProps {
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSubmit: (transaction: any) => Promise<void>;
  onCancel: () => void;
  onCategoryCreated: () => Promise<void>;
}

export default function TransactionFormCard({
  editingTransaction,
  accounts,
  categories,
  onSubmit,
  onCancel,
  onCategoryCreated,
}: TransactionFormCardProps) {
  return (
    <Modal
      title={editingTransaction ? "Bewerk Transactie" : "Nieuwe Transactie"}
      maxWidth="max-w-2xl"
      onClose={onCancel}
    >
      <TransactionForm
        accounts={accounts}
        categories={categories}
        accountBalances={{}}
        onSubmit={onSubmit}
        onCancel={onCancel}
        editTransaction={editingTransaction || undefined}
        onCategoryCreated={onCategoryCreated}
      />
    </Modal>
  );
}
