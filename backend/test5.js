import mongoose from 'mongoose';
import crypto from 'crypto';

const schema = new mongoose.Schema({
  timestamp: Date,
  hash: String
});

const Model = mongoose.model('TestDatePrecision', schema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', { serverSelectionTimeoutMS: 2000 }).catch(console.error);

  const timestamp = new Date();
  
  // Hash before save
  const dataStringBefore = timestamp.toISOString();
  const hashBefore = crypto.createHash('sha256').update(dataStringBefore).digest('hex');

  const doc = new Model({ timestamp, hash: hashBefore });
  await doc.save();

  const retrieved = await Model.findById(doc._id);

  // Hash after retrieve
  const dataStringAfter = retrieved.timestamp.toISOString();
  const hashAfter = crypto.createHash('sha256').update(dataStringAfter).digest('hex');

  console.log('Before:', dataStringBefore);
  console.log('After: ', dataStringAfter);
  console.log('Match?', hashBefore === hashAfter);

  mongoose.disconnect();
}
run();
