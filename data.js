// data.js
// 1. Load your single JSON of sentences
import allSentences from './allSentences.json';

// 2. Build a map of batches (e.g., "batch01", "batch02")
export const batchDataMap = allSentences.reduce((map, sentence) => {
  const batchKey = `batch${String(sentence.batch).padStart(2, '0')}`;
  if (!map[batchKey]) {
    map[batchKey] = [];
  }
  map[batchKey].push(sentence);
  return map;
}, {});

// 3. Export the sentences
export { allSentences };