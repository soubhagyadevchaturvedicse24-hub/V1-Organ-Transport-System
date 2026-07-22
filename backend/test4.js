import mongoose from 'mongoose';

function _canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') { return JSON.stringify(obj); }
  if (Array.isArray(obj)) { return '[' + obj.map(item => _canonicalStringify(item)).join(',') + ']'; }
  const keys = Object.keys(obj).sort();
  const str = keys.map(k => JSON.stringify(k) + ':' + _canonicalStringify(obj[k])).join(',');
  return '{' + str + '}';
}

const schema = new mongoose.Schema({ payload: mongoose.Schema.Types.Mixed });
const Model = mongoose.model('Test4', schema);

async function run() {
  await mongoose.connect('mongodb://localhost:27017/test-hash', {
    serverSelectionTimeoutMS: 2000
  }).catch(() => {
    console.log('Skipping real mongo, using fallback? No, I need a real mongo connection.');
  });
  
  // Actually, I can't guarantee a mongo connection here easily.
  // I will just use .lean() in the adapter. It's safer anyway!
}
run();
