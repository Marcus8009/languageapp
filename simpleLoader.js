// simpleLoader.js
const fs = require('fs');
const path = require('path');

// Configuration - adjust these to match your project structure
const audioRoot = './assets/audio';
const templatePath = './dynamicAudioLoader.js';
const outputPath = './dynamicAudioLoader.new.js';

// Main function with verbose logging
async function createSimpleLoader() {
  console.log('----- Simple Loader Script -----');
  console.log('Current working directory:', process.cwd());
  
  // Check if the audio directory exists
  if (!fs.existsSync(audioRoot)) {
    console.error(`Error: Audio directory not found at ${audioRoot}`);
    console.log('Available directories in current folder:', fs.readdirSync('.'));
    return;
  }
  console.log(`Audio directory found at: ${audioRoot}`);
  
  // Check if the template file exists
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Template file not found at ${templatePath}`);
    console.log('Available files in current folder:', fs.readdirSync('.').filter(f => !fs.statSync(f).isDirectory()));
    return;
  }
  console.log(`Template file found at: ${templatePath}`);
  
  try {
    // Read the template file
    const templateCode = fs.readFileSync(templatePath, 'utf8');
    console.log(`Successfully read template file (${templateCode.length} bytes)`);
    
    // Start building the output file
    let outputCode = templateCode;
    
    // Create a basic template for createBatchAudioManifest function
    const createBatchAudioManifestFn = `
// Dynamically generated audio manifest function
export async function createBatchAudioManifest(level, batchNum) {
  // Use a switch case to select the appropriate batch loader
  const batchKey = \`HSK\${level}-batch\${String(batchNum).padStart(2, '0')}\`;
  console.log('Loading audio for batch:', batchKey);
  
  // Return an empty manifest - we'll implement actual loading later
  // This is a placeholder to fix the "dynamic require" error
  return {};
}`;
    
    // Add basic batch loading function template
    const batchLoaderTemplate = `
// Example batch loading function - to be expanded later
async function loadHSK1Batch01() {
  // This is a placeholder
  return {
    // You'll need to manually add actual audio files here
    'example-key': { get: () => require('./path/to/audio.mp3') }
  };
}`;
    
    // Find where to insert our code
    const defaultExportIndex = outputCode.lastIndexOf('export default');
    
    if (defaultExportIndex !== -1) {
      // Insert before the default export
      outputCode = 
        outputCode.slice(0, defaultExportIndex) + 
        '\n\n' + createBatchAudioManifestFn + 
        '\n\n' + batchLoaderTemplate + 
        '\n\n' + outputCode.slice(defaultExportIndex);
    } else {
      // Just append at the end
      outputCode += '\n\n' + createBatchAudioManifestFn + '\n\n' + batchLoaderTemplate;
    }
    
    // Write to output file
    fs.writeFileSync(outputPath, outputCode);
    console.log(`Successfully created output file at: ${outputPath}`);
    console.log(`File size: ${fs.statSync(outputPath).size} bytes`);
    
    // List contents of the current directory to confirm
    console.log('Files in current directory:', fs.readdirSync('.').filter(f => !fs.statSync(f).isDirectory()));
    
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Run the function
createSimpleLoader();