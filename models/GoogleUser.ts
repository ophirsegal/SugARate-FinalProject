// models/GoogleUser.ts
import mongoose, { Document } from 'mongoose';

interface IGoogleUser extends Document {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const googleUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: String,
  lastName: String
}, {
  timestamps: true
});

export default mongoose.model<IGoogleUser>('GoogleUser', googleUserSchema);