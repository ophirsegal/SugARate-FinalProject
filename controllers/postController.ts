// src/controllers/postController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import dotenv from 'dotenv';
import { ImageUtils } from '../utils/imageUtils';
import path from 'path';
import fs from 'fs-extra';

dotenv.config();

interface HealthMetrics {
  location?: string;
  insulinUnits?: number;
  mealCarbs?: number;
}

class PostController {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'post-images');
  private readonly SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

  constructor() {
    // Create uploads directory if it doesn't exist
    fs.ensureDir(this.UPLOAD_DIR)
      .then(() => console.log('Post images directory initialized'))
      .catch(error => console.error('Error creating post images directory:', error));
  }
  
  private validateHealthMetrics(metrics: HealthMetrics): boolean {
    if (!metrics) return true;
    
    if (metrics.insulinUnits !== undefined && (isNaN(metrics.insulinUnits) || metrics.insulinUnits < 0)) {
      return false;
    }
    
    if (metrics.mealCarbs !== undefined && (isNaN(metrics.mealCarbs) || metrics.mealCarbs < 0)) {
      return false;
    }

    return true;
  }

  private async savePostImage(base64String: string): Promise<string> {
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const imageType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${imageType}`;
    const filepath = path.join(this.UPLOAD_DIR, filename);

    // Save the file
    await fs.writeFile(filepath, buffer);

    // Return the full URL
    return `${this.SERVER_URL}/uploads/post-images/${filename}`;
  }

  private async deletePostImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const filepath = path.join(this.UPLOAD_DIR, filename);
      
      await fs.remove(filepath);
    } catch (error) {
      console.error('Error deleting post image:', error);
    }
  }

  private getUserId(req: Request): mongoose.Types.ObjectId | null {
    if (!req.user || !req.user.id) return null;
    return new mongoose.Types.ObjectId(req.user.id);
  }

  public async createPost(req: Request, res: Response): Promise<void> {
    console.log('[POST /api/posts] Creating new post');
    try {
      const { content, image, healthMetrics } = req.body;
      const userId = this.getUserId(req);
      
      if (!userId) {
        console.warn('[POST /api/posts] Unauthorized attempt to create post');
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      // Handle image if provided
      let imageUrl: string | undefined;
      if (image) {
        if (!ImageUtils.validateBase64Image(image)) {
          res.status(400).json({ message: 'Invalid image format or size exceeds 5MB' });
          return;
        }
        imageUrl = await this.savePostImage(image);
      }

      if (healthMetrics && !this.validateHealthMetrics(healthMetrics)) {
        res.status(400).json({ message: 'Invalid health metrics values' });
        return;
      }

      const post = new Post({
        userId,
        content,
        image: imageUrl,
        healthMetrics: healthMetrics && Object.keys(healthMetrics).length > 0 ? healthMetrics : undefined,
        likes: [],
        comments: []
      });

      await post.save();
      console.log(`[POST /api/posts] Post created successfully by user ${userId}`);

      // Populate user details before sending response
      const populatedPost = await Post.findById(post._id)
        .populate('userId', 'username profileImage');

      res.status(201).json({
        message: 'Post created successfully',
        post: populatedPost
      });
    } catch (error) {
      console.error('[POST /api/posts] Error creating post:', error);
      res.status(500).json({ message: 'Error creating post' });
    }
  }

  public async updatePost(req: Request, res: Response): Promise<void> {
    const postId = req.params.postId;
    console.log(`[PUT /api/posts/${postId}] Attempting to update post`);
    try {
      const { content, image, healthMetrics } = req.body;
      if (!content) {
        res.status(400).json({ message: 'Content is required to update post' });
        return;
      }
      
      const post = await Post.findById(postId);
      if (!post) {
        console.warn(`[PUT /api/posts/${postId}] Post not found`);
        res.status(404).json({ message: 'Post not found' });
        return;
      }
      
      const userId = this.getUserId(req);
      if (!userId) {
        console.warn(`[PUT /api/posts/${postId}] Unauthorized update attempt`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      if (post.userId.toString() !== userId.toString()) {
        console.warn(`[PUT /api/posts/${postId}] User ${userId} not authorized to update post`);
        res.status(403).json({ message: 'Not authorized to update this post' });
        return;
      }

      // Handle image update if provided
      let imageUrl = post.image;
      if (image) {
        if (!ImageUtils.validateBase64Image(image)) {
          res.status(400).json({ message: 'Invalid image format or size exceeds 5MB' });
          return;
        }
        // Delete old image if it exists
        if (post.image) {
          await this.deletePostImage(post.image);
        }
        imageUrl = await this.savePostImage(image);
      }

      if (healthMetrics && !this.validateHealthMetrics(healthMetrics)) {
        res.status(400).json({ message: 'Invalid health metrics values' });
        return;
      }
      
      post.content = content;
      post.image = imageUrl;
      if (healthMetrics) {
        post.healthMetrics = Object.keys(healthMetrics).length > 0 ? healthMetrics : undefined;
      }
      
      await post.save();
      console.log(`[PUT /api/posts/${postId}] Post updated successfully by user ${userId}`);

      // Populate user details before sending response
      const populatedPost = await Post.findById(post._id)
        .populate('userId', 'username profileImage');

      res.status(200).json({ 
        message: 'Post updated successfully', 
        post: populatedPost 
      });
    } catch (error) {
      console.error(`[PUT /api/posts/${postId}] Error updating post:`, error);
      res.status(500).json({ message: 'Error updating post' });
    }
  }

  public async getAllPosts(req: Request, res: Response): Promise<void> {
    console.log('[GET /api/posts] Fetching all posts');
    try {
      const posts = await Post.find()
        .populate('userId', 'username profileImage')
        .populate('comments.userId', 'username profileImage')
        .sort({ createdAt: -1 });

      console.log(`[GET /api/posts] Successfully fetched ${posts.length} posts`);
      res.status(200).json(posts);
    } catch (error) {
      console.error('[GET /api/posts] Error fetching posts:', error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  }

  public async deletePost(req: Request, res: Response): Promise<void> {
    const postId = req.params.postId;
    console.log(`[DELETE /api/posts/${postId}] Attempting to delete post`);
    try {
      const post = await Post.findById(postId);
      if (!post) {
        console.warn(`[DELETE /api/posts/${postId}] Post not found`);
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      const userId = this.getUserId(req);
      if (!userId) {
        console.warn(`[DELETE /api/posts/${postId}] Unauthorized deletion attempt`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (post.userId.toString() !== userId.toString()) {
        console.warn(`[DELETE /api/posts/${postId}] User ${userId} not authorized to delete post`);
        res.status(403).json({ message: 'Not authorized to delete this post' });
        return;
      }

      // Delete the image file if it exists
      if (post.image) {
        await this.deletePostImage(post.image);
      }

      await post.deleteOne();
      console.log(`[DELETE /api/posts/${postId}] Post successfully deleted by user ${userId}`);
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error(`[DELETE /api/posts/${postId}] Error deleting post:`, error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  }

  public async toggleLike(req: Request, res: Response): Promise<void> {
    const postId = req.params.postId;
    console.log(`[POST /api/posts/${postId}/like] Processing like/unlike`);
    try {
      const post = await Post.findById(postId);
      if (!post) {
        console.warn(`[POST /api/posts/${postId}/like] Post not found`);
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      const userId = this.getUserId(req);
      if (!userId) {
        console.warn(`[POST /api/posts/${postId}/like] Unauthorized like attempt`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const likeIndex = post.likes.findIndex((like: any) => like.toString() === userId.toString());
      if (likeIndex === -1) {
        post.likes.push(userId);
        console.log(`[POST /api/posts/${postId}/like] User ${userId} liked the post`);
      } else {
        post.likes.splice(likeIndex, 1);
        console.log(`[POST /api/posts/${postId}/like] User ${userId} unliked the post`);
      }

      await post.save();
      res.status(200).json({ 
        message: likeIndex === -1 ? 'Post liked' : 'Post unliked',
        likes: post.likes.length 
      });
    } catch (error) {
      console.error(`[POST /api/posts/${postId}/like] Error updating like:`, error);
      res.status(500).json({ message: 'Error updating like' });
    }
  }

  public async addComment(req: Request, res: Response): Promise<void> {
    const postId = req.params.postId;
    console.log(`[POST /api/posts/${postId}/comment] Adding new comment`);
    try {
      const { content } = req.body;
      const post = await Post.findById(postId);
      if (!post) {
        console.warn(`[POST /api/posts/${postId}/comment] Post not found`);
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      const userId = this.getUserId(req);
      if (!userId) {
        console.warn(`[POST /api/posts/${postId}/comment] Unauthorized comment attempt`);
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      post.comments.push({
        userId,
        content,
        createdAt: new Date()
      });

      await post.save();
      console.log(`[POST /api/posts/${postId}/comment] Comment added successfully by user ${userId}`);

      const populatedPost = await Post.findById(post._id)
        .populate('comments.userId', 'username');

      res.status(201).json({
        message: 'Comment added successfully',
        comments: populatedPost?.comments
      });
    } catch (error) {
      console.error(`[POST /api/posts/${postId}/comment] Error adding comment:`, error);
      res.status(500).json({ message: 'Error adding comment' });
    }
  }

  public async getUserPosts(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    console.log(`[GET /api/posts/user/${userId}] Fetching user posts`);
    
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      
      const posts = await Post.find({ userId: userObjectId })
        .populate('userId', 'username profileImage')
        .populate('comments.userId', 'username')
        .sort({ createdAt: -1 });

      console.log(`[GET /api/posts/user/${userId}] Successfully fetched ${posts.length} posts`);
      res.status(200).json(posts);
    } catch (error) {
      console.error(`[GET /api/posts/user/${userId}] Error fetching user posts:`, error);
      res.status(500).json({ message: 'Error fetching user posts' });
    }
  }
}

export default new PostController();