import mongoose from 'mongoose';

function _canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') { return JSON.stringify(obj); }
  if (Array.isArray(obj)) { return '[' + obj.map(item => _canonicalStringify(item)).join(',') + ']'; }
  const keys = Object.keys(obj).sort();
  const str = keys.map(k => JSON.stringify(k) + ':' + _canonicalStringify(obj[k])).join(',');
  return '{' + str + '}';
}

const schema = new mongoose.Schema({ payload: mongoose.Schema.Types.Mixed });
const Model = mongoose.model('Test', schema);
const doc = new Model({ payload: { alerts: ['A', 'B'], nested: { a: 1 } } });
console.log('Original:', _canonicalStringify({ alerts: ['A', 'B'], nested: { a: 1 } }));
console.log('Mongoose:', _canonicalStringify(doc.payload));
