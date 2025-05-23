// directLoader.js
/**
 * This script creates a direct version of dynamicAudioLoader.js without needing to run intermediate steps.
 * It combines both scripts (generate manifest and merge) into a single operation.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const audioRoot = './assets/audio';
const dynamicLoaderTemplatePath = './dynamicAudioLoader.js';
const outputPath = './dynamicAudioLoader.new.js';

// Main function to handle the entire process
async function createDirectLoader() {
  try {
    console.log('Starting direct loader creation process...');
    
    // Read the dynamic loader template
    const templateCode = fs.readFileSync(dynamicLoaderTemplatePath, 'utf8');
    console.log('Read dynamic loader template.');
    
    // Scan audio directories and generate loader functions
    const { batchFunctions, switchCases } = await scanAudioDirectories();
    console.log(`Generated ${batchFunctions.length} batch loading functions and ${switchCases.length} switch cases.`);
    
    // Create the complete createBatchAudioManifest function with the switch statement
    const createBatchAudioManifestFn = `export async function createBatchAudioManifest(level, batchNum) {
  const levelPrefix = \`L\${level}\`;
  const batchPrefix = String(batchNum).padStart(2, '0');
  
  // Use a switch case to handle different HSK levels and batches
  // This avoids dynamic require statements which won't work in React Native
  switch(\`HSK\${level}-batch\${batchPrefix}\`) {
${switchCases.join('\n')}    default:
      console.warn(\`No predefined audio manifest for HSK\${level} batch\${batchPrefix}\`);
      return {}; // Return empty manifest if not found
  }
}`;
    
    // Find where to insert the batch loading functions in the template
    let modifiedTemplate = '';
    
    // Check if the template has the export async function createBatchAudioManifest pattern
    const createBatchAudioManifestRegex = /export\s+async\s+function\s+createBatchAudioManifest[\s\S]*?(?:return\s+batchManifest;|}\s*})/;
    const matchResult = templateCode.match(createBatchAudioManifestRegex);
    
    if (matchResult) {
      // Replace the createBatchAudioManifest function in the template
      modifiedTemplate = templateCode.replace(
        createBatchAudioManifestRegex,
        createBatchAudioManifestFn
      );
    } else {
      // If we can't find the pattern, insert the new function before the default export
      const defaultExportIndex = templateCode.lastIndexOf('export default');
      
      if (defaultExportIndex === -1) {
        // If there's no default export, just append it to the end
        modifiedTemplate = templateCode + '\n\n' + createBatchAudioManifestFn;
      } else {
        // Insert before the default export
        modifiedTemplate = 
          templateCode.slice(0, defaultExportIndex) + 
          '\n\n' + createBatchAudioManifestFn + '\n\n' + 
          templateCode.slice(defaultExportIndex);
      }
    }
    
    // Find where to add the batch loading functions
    // We'll add them right before the default export
    const defaultExportIndex = modifiedTemplate.lastIndexOf('export default');
    
    if (defaultExportIndex === -1) {
      // If there's no default export, just append the batch functions
      modifiedTemplate += '\n\n// Batch loading functions generated from audioManifest\n' + 
                          batchFunctions.join('\n\n');
    } else {
      // Insert all batch loading functions before the default export
      const batchFunctionsCode = batchFunctions.join('\n\n');
      modifiedTemplate = 
        modifiedTemplate.slice(0, defaultExportIndex) + 
        '\n\n// Batch loading functions generated from audioManifest\n' + 
        batchFunctionsCode + 
        '\n\n' + 
        modifiedTemplate.slice(defaultExportIndex);
    }
    
    // Write the result to the output file
    fs.writeFileSync(outputPath, modifiedTemplate);
    console.log(`Successfully created loader. Output written to: ${outputPath}`);
    console.log('Please review the output file before using it.');
    console.log('To use the new file, run: copy dynamicAudioLoader.new.js dynamicAudioLoader.js');
    
  } catch (error) {
    console.error('Error creating direct loader:', error);
  }
}

// Function to scan audio directories and generate loader functions and switch cases
async function scanAudioDirectories() {
  const batchFunctions = [];
  const switchCases = [];
  
  // Get all HSK levels (directories)
  const hskLevels = fs.readdirSync(audioRoot);
  
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
      
      // Generate function code
      let functionCode = `async function load${hskLevel}Batch${batchNum}() {\n`;
      functionCode += '  return {\n';
      
      // Add require statements for each file
      for (const file of batchFiles) {
        const key = file.replace('.mp3', '');
        functionCode += `    '${key}': { get: () => require('./assets/audio/${hskLevel}/${batch}/${file}') },\n`;
      }
      
      // Close the function
      functionCode += '  };\n}';
      
      batchFunctions.push(functionCode);
      
      // Add switch case
      const formattedBatchNum = batchNum.padStart(2, '0');
      switchCases.push(`    case '${hskLevel}-batch${formattedBatchNum}':\n      return await load${hskLevel}Batch${formattedBatchNum}();`);
    }
  }
  
  return { batchFunctions, switchCases };
}

// Run the function
createDirectLoader();