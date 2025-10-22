# Micro Finance

Een eenvoudige financiële beheersapplicatie waarin je je inkomsten en uitgaven kunt bijhouden, zowel eenmalig als terugkerend.

## Functionaliteiten

✅ **Transactie Beheer**

- Toevoegen van inkomsten en uitgaven
- Zowel eenmalige als terugkerende transacties (maandelijks, jaarlijks, wekelijks, dagelijks)
- Categorisering van transacties
- Tags voor extra organisatie

✅ **Rekening Beheer**

- Meerdere rekeningen: lopende rekening, spaarrekening, crypto, aandelen, schulden
- Real-time balans tracking
- Automatische balans updates bij transacties

✅ **Dashboard & Projecties**

- Huidige financiële overzicht
- Balansprojecties voor 1-5 jaar vooruit
- Maandelijks inkomsten/uitgaven overzicht
- Top uitgaven categorieën

✅ **Data Opslag**

- Alle data wordt opgeslagen in `data/financial-data.json`
- Eenvoudig te backup en te exporteren
- TypeScript types voor data validatie

## Installatie en Gebruik

### Vereisten

- Node.js 18+
- NPM of Yarn

### Setup

```bash
# Installeer dependencies
npm install

# Start de development server
npm run dev
```

De applicatie is beschikbaar op `http://localhost:3000`

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build voor productie
npm run start    # Start productie server
npm run lint     # Code linting
npm run format   # Code formatting
```

## Project Structuur

```
micro-finance/
├── data/
│   └── financial-data.json    # JSON data opslag
├── src/
│   ├── app/
│   │   ├── api/finance/       # API routes
│   │   ├── page.tsx          # Hoofdpagina
│   │   └── layout.tsx        # App layout
│   ├── components/           # React componenten
│   │   ├── Dashboard.tsx
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionList.tsx
│   │   ├── AccountForm.tsx
│   │   └── AccountOverview.tsx
│   ├── services/
│   │   └── financial-data.ts  # Data service
│   └── types/
│       └── finance.ts        # TypeScript types
```

## Gebruik

### 1. Dashboard

- Overzicht van je huidige financiële situatie
- Balansprojecties voor de toekomst
- Maandelijkse overzichten
- Inzichten in uitgavenpatronen

### 2. Rekeningen

- Bekijk al je rekeningen en saldi
- Voeg nieuwe rekeningen toe
- Verschillende typen: lopend, sparen, crypto, aandelen, etc.

### 3. Transacties

- Voeg inkomsten en uitgaven toe
- Maak transacties terugkerend voor vaste kosten/inkomsten
- Filter en sorteer je transactiegeschiedenis
- Gebruik tags voor extra organisatie

## Terugkerende Transacties

De applicatie ondersteunt verschillende soorten terugkerende transacties:

- **Maandelijks**: Salaris, huur, abonnementen
- **Jaarlijks**: Vakantiegeld, verzekeringen, belastingen
- **Wekelijks**: Boodschappen, brandstof
- **Dagelijks**: Koffie, lunch

Deze worden automatisch meegenomen in de balansprojecties.

## Data Backup

Al je financiële data wordt opgeslagen in `data/financial-data.json`. Je kunt dit bestand:

- Handmatig backuppen
- Importeren naar een nieuwe installatie
- Exporteren naar andere tools

## Technische Details

- **Framework**: Next.js 15 met TypeScript
- **Styling**: Tailwind CSS
- **Data**: JSON file storage
- **API**: Next.js API routes
- **Type Safety**: Volledig getypeerd met TypeScript

## Ontwikkeling

De applicatie is gebouwd met modulaire componenten en een service layer voor data management. Nieuwe functionaliteiten kunnen eenvoudig worden toegevoegd door:

1. Types uit te breiden in `src/types/finance.ts`
2. Services aan te passen in `src/services/financial-data.ts`
3. API routes toe te voegen in `src/app/api/`
4. UI componenten te maken in `src/components/`

## Licentie

MIT License - Vrij te gebruiken voor persoonlijke en commerciële doeleinden.
