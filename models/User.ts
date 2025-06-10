// models/User.ts
import mongoose, { Document } from 'mongoose';

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  coverImage?: string;
  icrRatio?: number; // Insulin-to-Carb Ratio
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    required: false
  },
  icrRatio: {
    type: Number,
    required: false,
    default: 10, // Default ICR ratio of 1:10
    min: 1,
    max: 30
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>('User', userSchema);