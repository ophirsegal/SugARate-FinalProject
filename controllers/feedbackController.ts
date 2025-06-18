import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback';

export const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId, postId, isLike, review, imageAnalysisData } = req.body;
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const existingFeedback = await Feedback.findOne({ userId, analysisId });
    if (existingFeedback) {
      existingFeedback.isLike = isLike;
      existingFeedback.review = review;
      existingFeedback.imageAnalysisData = imageAnalysisData;
      if (postId) {
        existingFeedback.postId = postId;
      }
      await existingFeedback.save();
      
      res.json({
        success: true,
        message: 'Feedback updated successfully',
        feedback: existingFeedback
      });
      return;
    }

    const feedback = new Feedback({
      userId,
      analysisId,
      postId,
      isLike,
      review,
      imageAnalysisData
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error: any) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting feedback', 
      error: error.message 
    });
  }
};

export const getFeedbackStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const likes = await Feedback.countDocuments({ isLike: true });
    const dislikes = await Feedback.countDocuments({ isLike: false });
    const likePercentage = totalFeedback > 0 ? (likes / totalFeedback) * 100 : 0;
    const withPosts = await Feedback.countDocuments({ postId: { $exists: true } });

    res.json({
      totalFeedback,
      likes,
      dislikes,
      likePercentage: Math.round(likePercentage),
      withPosts
    });
  } catch (error: any) {
    console.error('Error getting feedback stats:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback statistics', 
      error: error.message 
    });
  }
};

export const getUserFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { limit = 20, offset = 0 } = req.query;

    const feedback = await Feedback.find({ userId })
      .populate('postId', 'content image createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await Feedback.countDocuments({ userId });

    res.json({
      feedback,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error: any) {
    console.error('Error getting user feedback:', error);
    res.status(500).json({ 
      message: 'Error fetching user feedback', 
      error: error.message 
    });
  }
};

export const getFeedbackByAnalysisId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.params;
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const feedback = await Feedback.findOne({ userId, analysisId })
      .populate('postId', 'content image createdAt');

    if (!feedback) {
      res.status(404).json({ 
        message: 'Feedback not found' 
      });
      return;
    }

    res.json(feedback);
  } catch (error: any) {
    console.error('Error getting feedback by analysis ID:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback', 
      error: error.message 
    });
  }
};

export const deleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const feedback = await Feedback.findOneAndDelete({ _id: id, userId });

    if (!feedback) {
      res.status(404).json({ 
        message: 'Feedback not found or unauthorized' 
      });
      return;
    }

    res.json({ 
      success: true,
      message: 'Feedback deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ 
      message: 'Error deleting feedback', 
      error: error.message 
    });
  }
};

export const getRecentFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 7 } = req.query;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - Number(days));

    const feedback = await Feedback.find({
      createdAt: { $gte: dateThreshold }
    })
      .populate('userId', 'username')
      .populate('postId', 'content image')
      .sort({ createdAt: -1 })
      .limit(100);

    const stats = {
      total: feedback.length,
      likes: feedback.filter(f => f.isLike).length,
      dislikes: feedback.filter(f => !f.isLike).length,
      withReviews: feedback.filter(f => f.review).length,
      withPosts: feedback.filter(f => f.postId).length
    };

    res.json({
      feedback,
      stats,
      period: `Last ${days} days`
    });
  } catch (error: any) {
    console.error('Error getting recent feedback:', error);
    res.status(500).json({ 
      message: 'Error fetching recent feedback', 
      error: error.message 
    });
  }
};

export const getFeedbackByPostId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const feedback = await Feedback.findOne({ userId, postId });

    if (!feedback) {
      res.status(404).json({ 
        message: 'No feedback found for this post' 
      });
      return;
    }

    res.json(feedback);
  } catch (error: any) {
    console.error('Error getting feedback by post ID:', error);
    res.status(500).json({ 
      message: 'Error fetching feedback', 
      error: error.message 
    });
  }
};