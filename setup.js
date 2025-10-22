#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const files = [
  'financial-config.json',
  'financial-data.json',
  'savings-goals.json'
];

console.log('🚀 Setting up Micro Finance data files...\n');

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const examplePath = path.join(dataDir, `${file}.example`);
  
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file} already exists, skipping...`);
  } else {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, filePath);
      console.log(`✓ Created ${file} from example`);
    } else {
      console.error(`✗ Example file ${file}.example not found!`);
    }
  }
});

console.log('\n✨ Setup complete! You can now run the app.');
console.log('📝 Edit the files in the data/ directory to configure your finances.\n');
