// models/ChatList.ts
import mongoose from 'mongoose';

const chatListSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  contacts: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('ChatList', chatListSchema);