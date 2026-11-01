export default function StorageNotReadyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <section className="card w-full max-w-xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-2xl font-bold">Opslag nog niet gemigreerd</h1>
          <p>
            Financiële gegevens worden nog uit lokale bestanden gelezen. Deze
            online versie blijft daarom geblokkeerd totdat de gegevensopslag
            volledig naar persoonlijke Supabase-tabellen is verhuisd.
          </p>
          <p className="text-sm text-base-content/70">
            Er zijn geen lokale financiële bestanden naar Supabase gekopieerd.
            Meld je af en probeer het later opnieuw.
          </p>
        </div>
      </section>
    </main>
  );
}
