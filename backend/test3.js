import mongoose from 'mongoose';

function _canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') { return JSON.stringify(obj); }
  if (Array.isArray(obj)) { return '[' + obj.map(item => _canonicalStringify(item)).join(',') + ']'; }
  const keys = Object.keys(obj).sort();
  const str = keys.map(k => JSON.stringify(k) + ':' + _canonicalStringify(obj[k])).join(',');
  return '{' + str + '}';
}

const schema = new mongoose.Schema({ payload: mongoose.Schema.Types.Mixed });
const Model = mongoose.model('Test3', schema);

const rawPayload = { alerts: ['Temp High'] };
const hash1 = _canonicalStringify(rawPayload);

const doc = new Model({ payload: rawPayload });
// Simulate LedgerBlock.find() without .lean()
// doc.payload is a Mongoose object if it was cast. Wait, is Mixed cast?
const hash2 = _canonicalStringify(doc.payload);

console.log('Original hash:', hash1);
console.log('Mongoose hash:', hash2);

// Let's also test array explicitly if it isn't cast correctly by new Model() without save
const arr = mongoose.Types.Array(['Temp High']);
console.log('MongooseArray test:', _canonicalStringify({ alerts: arr }));
