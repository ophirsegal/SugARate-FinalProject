import mongoose, { Document } from 'mongoose';

interface IFeedback extends Document {
  userId: mongoose.Types.ObjectId;
  postId?: mongoose.Types.ObjectId;
  analysisId: string;
  isLike: boolean;
  review?: string;
  imageAnalysisData: {
    foodName: string;
    carbs: number;
    calories: number;
    protein?: number;
    fat?: number;
    insulinCalculated: number;
    confidence?: string;
    portion?: string;
    glycemicIndex?: string;
    timestamp: Date;
  };
  createdAt: Date;
}

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  analysisId: {
    type: String,
    required: true,
    index: true
  },
  isLike: {
    type: Boolean,
    required: true
  },
  review: {
    type: String,
    maxlength: 500
  },
  imageAnalysisData: {
    foodName: {
      type: String,
      required: true
    },
    carbs: {
      type: Number,
      required: true
    },
    calories: {
      type: Number,
      required: true
    },
    protein: Number,
    fat: Number,
    insulinCalculated: {
      type: Number,
      required: true
    },
    confidence: String,
    portion: String,
    glycemicIndex: String,
    timestamp: {
      type: Date,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

feedbackSchema.index({ userId: 1, analysisId: 1 }, { unique: true });
feedbackSchema.index({ postId: 1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);