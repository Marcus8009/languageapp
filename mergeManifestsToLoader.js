// mergeManifestsToLoader.js
const fs = require('fs');
const path = require('path');

// Configuration
const generatedManifestPath = './generatedManifest.js';
const dynamicLoaderTemplatePath = './dynamicAudioLoader.js';
const outputPath = './dynamicAudioLoader.new.js';

// Run the merge process
(async function mergeManifestsToLoader() {
  try {
    console.log('Starting merge process...');
    
    // Read the generated manifest file
    const generatedCode = fs.readFileSync(generatedManifestPath, 'utf8');
    console.log('Read generated manifest file.');
    
    // Read the dynamic loader template
    const templateCode = fs.readFileSync(dynamicLoaderTemplatePath, 'utf8');
    console.log('Read dynamic loader template.');
    
    // Extract the batch loading functions from the generated manifest
    const batchFunctionMatches = generatedCode.match(/async function load[^{]*{[^}]*}\s*}/g) || [];
    
    if (batchFunctionMatches.length === 0) {
      throw new Error('No batch loading functions found in the generated manifest.');
    }
    
    console.log(`Found ${batchFunctionMatches.length} batch loading functions.`);
    
    // Extract batch identifiers to build the switch statement
    const batchIdentifiers = [];
    const functionNameRegex = /async function load(HSK\d+)Batch(\d+)/;
    
    batchFunctionMatches.forEach(funcStr => {
      const match = funcStr.match(functionNameRegex);
      if (match) {
        const [_, hskLevel, batchNum] = match;
        batchIdentifiers.push({ hskLevel, batchNum });
      }
    });
    
    console.log(`Extracted ${batchIdentifiers.length} batch identifiers.`);
    
    // Build the switch statement
    let switchCases = '';
    batchIdentifiers.forEach(({ hskLevel, batchNum }) => {
      // Format the batch number to match the original format (e.g., "01" instead of "1")
      const formattedBatchNum = batchNum.padStart(2, '0');
      switchCases += `    case '${hskLevel}-batch${formattedBatchNum}':\n`;
      switchCases += `      return await load${hskLevel}Batch${formattedBatchNum}();\n`;
    });
    
    // Create the complete createBatchAudioManifest function with the switch statement
    const createBatchAudioManifestFn = `export async function createBatchAudioManifest(level, batchNum) {
  const levelPrefix = \`L\${level}\`;
  const batchPrefix = String(batchNum).padStart(2, '0');
  
  // Use a switch case to handle different HSK levels and batches
  // This avoids dynamic require statements which won't work in React Native
  switch(\`HSK\${level}-batch\${batchPrefix}\`) {
${switchCases}    default:
      console.warn(\`No predefined audio manifest for HSK\${level} batch\${batchPrefix}\`);
      return {}; // Return empty manifest if not found
  }
}`;
    
    // Find where to insert the batch loading functions in the template
    // We'll look for the placeholder function and replace it
    const createBatchAudioManifestRegex = /export\s+async\s+function\s+createBatchAudioManifest[\s\S]*?return\s+batchManifest;\s*}/;
    
    // Replace the createBatchAudioManifest function in the template
    let modifiedTemplate = templateCode.replace(
      createBatchAudioManifestRegex,
      createBatchAudioManifestFn
    );
    
    // Find where to add the batch loading functions
    // We'll add them right before the default export
    const defaultExportIndex = modifiedTemplate.lastIndexOf('export default');
    
    if (defaultExportIndex === -1) {
      throw new Error('Could not find the default export in the template.');
    }
    
    // Insert all batch loading functions before the default export
    const batchFunctionsCode = batchFunctionMatches.join('\n\n');
    modifiedTemplate = 
      modifiedTemplate.slice(0, defaultExportIndex) + 
      '\n\n// Batch loading functions generated from audioManifest\n' + 
      batchFunctionsCode + 
      '\n\n' + 
      modifiedTemplate.slice(defaultExportIndex);
    
    // Write the result to the output file
    fs.writeFileSync(outputPath, modifiedTemplate);
    console.log(`Successfully merged files. Output written to: ${outputPath}`);
    console.log('Please review the output file before using it.');
    
  } catch (error) {
    console.error('Error merging files:', error);
  }
})();