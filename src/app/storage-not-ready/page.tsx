export default function StorageNotReadyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <section className="card w-full max-w-xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-2xl font-bold">
            Supabase-opslag nog niet ingeschakeld
          </h1>
          <p>
            Deze deployment is geblokkeerd zolang Supabase-opslag niet expliciet
            is ingeschakeld. Financiële gegevens worden per gebruiker in
            afgeschermde Supabase-tabellen opgeslagen.
          </p>
          <p className="text-sm text-base-content/70">
            Beheerder: voer eerst alle SQL-migraties uit en controleer de
            scheiding tussen gebruikers. Zet daarna
            SUPABASE_DATA_BACKEND_ENABLED op true in Netlify en deploy opnieuw.
            Bestaande lokale JSON-gegevens worden niet gekopieerd; iedere
            gebruiker begint met een eigen lege administratie.
          </p>
        </div>
      </section>
    </main>
  );
}
