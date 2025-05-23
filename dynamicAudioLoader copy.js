// dynamicAudioLoader.js

/**
 * This module provides dynamic loading for audio files based on the current batch and sentence.
 * Instead of loading all audio files at once, we only load the ones we need for the current batch.
 */

// Cache for loaded audio resources
const audioCache = {};

/**
 * Dynamically loads audio based on a key pattern
 * @param {string} key - The audio key (e.g., 'L1-0001eng')
 * @returns {Promise<any>} - Promise resolving to the audio resource
 */
export async function loadAudio(key) {
  // Return from cache if already loaded
  if (audioCache[key]) {
    return audioCache[key];
  }

  // Parse the key pattern
  const match = key.match(/^(L\d+)-(\d+)(chi|eng)$/);
  if (!match) {
    throw new Error(`Invalid audio key format: ${key}`);
  }

  const [_, level, number, language] = match;
  const batch = Math.ceil(parseInt(number) / 100); // Calculate batch number (100 items per batch)
  const batchString = String(batch).padStart(2, '0'); // Format as "01", "02", etc.

  try {
    // Dynamically require the audio file based on its path pattern
    // This is more efficient than loading everything upfront
    const audioPath = `./assets/audio/${level.replace('L', 'HSK')}/${`batch${batchString}`}/${key}.mp3`;
    
    // We need to handle the dynamic require differently based on platform
    let audio;
    
    if (typeof require.context === 'function') { 
      // Web approach
      const requireContext = require.context('./assets/audio', true, /\.mp3$/);
      const modulePath = `./${audioPath.replace('./assets/', '')}`;
      audio = requireContext(modulePath);
    } else { 
      // Native approach - use a mapping approach
      audio = getAudioByPath(audioPath);
    }
    
    // Cache the loaded audio
    audioCache[key] = audio;
    return audio;
  } catch (err) {
    console.error(`Failed to load audio: ${key}`, err);
    return null;
  }
}

/**
 * Map of paths to require statements
 * This is an alternative to dynamic requires which don't work in React Native
 * You will need to generate this mapping for your specific audio files
 */
function getAudioByPath(path) {
  // We'll need to implement a batch-specific loading mechanism
  const batchMappings = {
    // HSK1 Batch01
    './assets/audio/HSK1/batch01/L1-0001chi.mp3': require('./assets/audio/HSK1/batch01/L1-0001chi.mp3'),
    './assets/audio/HSK1/batch01/L1-0001eng.mp3': require('./assets/audio/HSK1/batch01/L1-0001eng.mp3'),
    // ...and so on, we'll need a way to generate this mapping more efficiently
  };
  
  // Return the require statement for this path
  return batchMappings[path];
}

/**
 * Load all audio files for a specific batch
 * This allows preloading a batch when the user selects it
 */
export async function preloadBatch(level, batchNum) {
  const batchKey = `${level}-${String(batchNum).padStart(2, '0')}`;
  console.log(`Preloading batch: ${batchKey}`);
  
  // Generate likely keys for this batch
  const startNum = (batchNum - 1) * 100 + 1;
  const endNum = batchNum * 100;
  
  // We don't actually load everything, we just prepare a smaller manifest for this batch
  return generateBatchManifest(level, startNum, endNum);
}

/**
 * Generate a manifest for a specific batch
 */
function generateBatchManifest(level, startNum, endNum) {
  const batchManifest = {};
  
  for (let i = startNum; i <= endNum; i++) {
    const numStr = String(i).padStart(4, '0');
    const keyBase = `${level}-${numStr}`;
    
    // Create placeholder entries - these will be dynamically loaded when needed
    batchManifest[`${keyBase}chi`] = () => loadAudio(`${keyBase}chi`);
    batchManifest[`${keyBase}eng`] = () => loadAudio(`${keyBase}eng`);
  }
  
  return batchManifest;
}

/**
 * This function generates a dynamic manifest specifically for the current batch
 */
export function createBatchAudioManifest(level, batchNum) {
  const levelPrefix = `L${level}`;
  const batchPrefix = String(batchNum).padStart(2, '0');
  const startNum = (batchNum - 1) * 100 + 1;
  const endNum = batchNum * 100;
  
  const batchManifest = {};
  
  // Only include entries for the current batch
  for (let i = startNum; i <= endNum; i++) {
    const numStr = String(i).padStart(4, '0');
    const chineseKey = `${levelPrefix}-${numStr}chi`;
    const englishKey = `${levelPrefix}-${numStr}eng`;
    
    // Implement a function that will lazily load the audio when accessed
    batchManifest[chineseKey] = {
      get: () => require(`./assets/audio/HSK${level}/batch${batchPrefix}/${chineseKey}.mp3`)
    };
    
    batchManifest[englishKey] = {
      get: () => require(`./assets/audio/HSK${level}/batch${batchPrefix}/${englishKey}.mp3`)
    };
  }
  
  return batchManifest;
}

// We'll use this approach to replace the global audioManifest with batch-specific manifests
export default {
  loadAudio,
  preloadBatch,
  createBatchAudioManifest
};