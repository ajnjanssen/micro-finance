interface ErrorStateProps {
  message: string;
}

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="min-h-screen p-6">
      <div className="alert alert-error">
        <span>{message}</span>
      </div>
    </div>
  );
}
