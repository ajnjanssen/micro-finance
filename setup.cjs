#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const files = [
  "financial-config.json",
  "financial-data.json",
  "savings-goals.json",
];

console.log("🚀 Setting up Micro Finance data files...\n");

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✓ Created data/ directory\n");
}

// Default templates if example files don't exist
const defaults = {
  "financial-config.json": {
    version: "3.0",
    lastUpdated: "",
    startingBalance: { date: "", checking: 0, savings: 0 },
    incomeSources: [],
    recurringExpenses: [],
    oneTimeExpenses: [],
  },
  "financial-data.json": {
    accounts: [],
    transactions: [],
    categories: [],
    lastUpdated: "",
  },
  "savings-goals.json": {
    goals: [],
    lastUpdated: "",
  },
};

files.forEach((file) => {
  const filePath = path.join(dataDir, file);
  const examplePath = path.join(dataDir, `${file}.example`);

  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} already exists, skipping...`);
  } else {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, filePath);
      console.log(`✓ Created ${file} from example`);
    } else {
      // Create from default template
      fs.writeFileSync(filePath, JSON.stringify(defaults[file], null, 2));
      console.log(`✓ Created ${file} from default template`);
    }
  }
});

console.log("\n✨ Setup complete! You can now run the app.");
console.log(
  "📝 Edit the files in the data/ directory to configure your finances.\n"
);
