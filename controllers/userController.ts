import { Request, Response } from 'express';
import express from 'express';
import User from '../models/User';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ImageUtils } from '../utils/imageUtils';
dotenv.config();
// Extend Express Request type to include the user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

class UserController {
  private readonly UPLOAD_DIR = 'uploads/profile-images';
  private readonly SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

  constructor() {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  private validateBase64Image(base64String: string): boolean {
    // Check if it's a valid base64 image string
    const regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    if (!regex.test(base64String)) {
      return false;
    }
    
    // Check size (limit to 5MB)
    const base64WithoutPrefix = base64String.split(',')[1];
    const sizeInBytes = Buffer.from(base64WithoutPrefix, 'base64').length;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return sizeInBytes <= maxSize;
  }

  private validateIcrRatio(icrRatio: number): { isValid: boolean; message?: string } {
    if (typeof icrRatio !== 'number') {
      return { isValid: false, message: 'ICR ratio must be a number' };
    }

    if (icrRatio < 1 || icrRatio > 30) {
      return { isValid: false, message: 'ICR ratio must be between 1 and 30' };
    }

    return { isValid: true };
  }

  private validateUsername(username: string): { isValid: boolean; message?: string } {
    if (!username.trim()) {
      return { isValid: false, message: 'Username cannot be empty' };
    }

    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters long' };
    }

    if (username.length > 30) {
      return { isValid: false, message: 'Username cannot exceed 30 characters' };
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return { 
        isValid: false, 
        message: 'Username can only contain letters, numbers, underscores, dots, and hyphens' 
      };
    }

    return { isValid: true };
  }
  public async updateProfileImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('[PUT /api/users/:userId/profile-image] Updating profile image');
    try {
      const { userId } = req.params;
      const { profileImage } = req.body;

      // Validate that the user making the request is the same as the user being updated
      if (!req.user || req.user.id !== userId) {
        console.warn('[PUT /api/users/:userId/profile-image] Unauthorized attempt to update profile image');
        res.status(403).json({ message: 'Not authorized to update this profile' });
        return;
      }

      // Validate the image
      if (!profileImage || !ImageUtils.validateBase64Image(profileImage)) {
        res.status(400).json({ message: 'Invalid image format or size exceeds 5MB' });
        return;
      }

      const user = await User.findById(userId);

      if (!user) {
        console.warn(`[PUT /api/users/:userId/profile-image] User not found: ${userId}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }

      try {
        // Delete old image if exists
        if (user.profileImage) {
          await ImageUtils.deleteImage(user.profileImage);
        }

        // Save new image and get the URL
        const imageUrl = await ImageUtils.saveBase64Image(profileImage);

        // Update user with new image URL
        user.profileImage = imageUrl;
        await user.save();

        console.log(`[PUT /api/users/:userId/profile-image] Profile image updated successfully for user ${userId}`);
        res.status(200).json({
          message: 'Profile image updated successfully',
          profileImage: imageUrl
        });

      } catch (error) {
        console.error('Error handling image file:', error);
        res.status(500).json({ message: 'Error processing image file' });
      }

    } catch (error) {
      console.error('[PUT /api/users/:userId/profile-image] Error updating profile image:', error);
      res.status(500).json({ message: 'Error updating profile image' });
    }
  }



  public async updateUsername(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('[PUT /api/users/:userId/username] Updating username');
    try {
      const { userId } = req.params;
      const { username } = req.body;

      // Validate that the user making the request is the same as the user being updated
      if (!req.user || req.user.id !== userId) {
        console.warn('[PUT /api/users/:userId/username] Unauthorized attempt to update username');
        res.status(403).json({ message: 'Not authorized to update this profile' });
        return;
      }

      // Validate the username
      const validation = this.validateUsername(username);
      if (!validation.isValid) {
        res.status(400).json({ message: validation.message });
        return;
      }

      // Check if username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({ message: 'Username is already taken' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.warn(`[PUT /api/users/:userId/username] User not found: ${userId}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Update the username
      user.username = username;
      await user.save();

      console.log(`[PUT /api/users/:userId/username] Username updated successfully for user ${userId}`);
      res.status(200).json({
        message: 'Username updated successfully',
        username: user.username
      });

    } catch (error) {
      console.error('[PUT /api/users/:userId/username] Error updating username:', error);
      res.status(500).json({ message: 'Error updating username' });
    }
  }

  public async updateIcrRatio(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('[PUT /api/users/:userId/icr-ratio] Updating ICR ratio');
    try {
      const { userId } = req.params;
      const { icrRatio } = req.body;

      // Validate that the user making the request is the same as the user being updated
      if (!req.user || req.user.id !== userId) {
        console.warn('[PUT /api/users/:userId/icr-ratio] Unauthorized attempt to update ICR ratio');
        res.status(403).json({ message: 'Not authorized to update this profile' });
        return;
      }

      // Validate the ICR ratio
      const validation = this.validateIcrRatio(icrRatio);
      if (!validation.isValid) {
        res.status(400).json({ message: validation.message });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        console.warn(`[PUT /api/users/:userId/icr-ratio] User not found: ${userId}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Update the ICR ratio
      user.icrRatio = icrRatio;
      await user.save();

      console.log(`[PUT /api/users/:userId/icr-ratio] ICR ratio updated successfully for user ${userId}`);
      res.status(200).json({
        message: 'ICR ratio updated successfully',
        icrRatio: user.icrRatio
      });

    } catch (error) {
      console.error('[PUT /api/users/:userId/icr-ratio] Error updating ICR ratio:', error);
      res.status(500).json({ message: 'Error updating ICR ratio' });
    }
  }

  public async getProfileImage(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const imageDir = path.join(process.cwd(), this.UPLOAD_DIR);
      const imageFiles = [`${userId}.jpg`, `${userId}.jpeg`, `${userId}.png`, `${userId}.gif`];
      
      // Try each possible image extension
      for (const filename of imageFiles) {
        const imagePath = path.join(imageDir, filename);
        if (fs.existsSync(imagePath)) {
          res.sendFile(imagePath);
          return;
        }
      }
      
      // If no image found, send 404
      res.status(404).send('Image not found');
      
    } catch (error) {
      console.error('[GET /api/users/:userId/profile-image] Error serving profile image:', error);
      res.status(500).json({ message: 'Error serving profile image' });
    }
  }
}

export default new UserController();