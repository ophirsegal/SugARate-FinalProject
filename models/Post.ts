// models/Post.ts
import mongoose, { Document } from 'mongoose';

interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  image?: string;
  healthMetrics?: {
    location?: string;
    insulinUnits?: number;
    mealCarbs?: number;
  };
  likes: mongoose.Types.ObjectId[];
  comments: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  healthMetrics: {
    location: {
      type: String,
      trim: true
    },
    insulinUnits: {
      type: Number,
      min: 0,
      // Allow decimal values for insulin units
      validate: {
        validator: function(v: number) {
          return v >= 0;
        },
        message: 'Insulin units must be a positive number'
      }
    },
    mealCarbs: {
      type: Number,
      min: 0
    }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IPost>('Post', postSchema);