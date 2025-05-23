const fs = require('fs');
const path = require('path');

// Configuration
const audioRoot = './assets/audio';
const outputFile = './generatedManifest.js';

// Function to scan directories and generate manifest code
async function generateManifestCode() {
  // Get all HSK levels (directories)
  const hskLevels = fs.readdirSync(audioRoot);
  
  let output = '// Auto-generated manifest code\n\n';
  
  for (const hskLevel of hskLevels) {
    const levelPath = path.join(audioRoot, hskLevel);
    if (!fs.statSync(levelPath).isDirectory()) continue;
    
    // Get all batches for this HSK level
    const batches = fs.readdirSync(levelPath)
      .filter(dir => dir.startsWith('batch') && fs.statSync(path.join(levelPath, dir)).isDirectory());
    
    for (const batch of batches) {
      const batchPath = path.join(levelPath, batch);
      const batchFiles = fs.readdirSync(batchPath).filter(file => file.endsWith('.mp3'));
      
      // Extract batch number
      const batchNum = batch.replace('batch', '');
      
      // Start the function
      output += `async function load${hskLevel}Batch${batchNum}() {\n`;
      output += '  return {\n';
      
      // Add require statements for each file
      for (const file of batchFiles) {
        const key = file.replace('.mp3', '');
        output += `    '${key}': { get: () => require('./assets/audio/${hskLevel}/${batch}/${file}') },\n`;
      }
      
      // Close the function
      output += '  };\n}\n\n';
    }
  }
  
  // Write the output to file
  fs.writeFileSync(outputFile, output);
  console.log(`Generated manifest code saved to ${outputFile}`);
}

// Run the function
generateManifestCode();

