const mongoose = require('mongoose');

async function debugMongo() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zentaku');
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('chat_messages');

  const messages = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log('Last 5 messages in MongoDB:', JSON.stringify(messages, null, 2));

  await mongoose.disconnect();
}

require('dotenv').config();
debugMongo().catch(console.error);
