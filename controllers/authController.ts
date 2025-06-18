// src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { Document } from 'mongoose';
import { ImageUtils } from '../utils/imageUtils';

interface IUserDocument extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  profileImage?: string;
  icrRatio?: number;
}

class AuthController {
  private validateBase64Image(base64String: string): boolean {
    const regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    if (!regex.test(base64String)) {
      return false;
    }
    
    const base64WithoutPrefix = base64String.split(',')[1];
    const sizeInBytes = Buffer.from(base64WithoutPrefix, 'base64').length;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return sizeInBytes <= maxSize;
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId }, 
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, profileImage, icrRatio } = req.body;
      console.log(`Registration attempt for user: ${email}`);

      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        console.log(`Registration failed - existing user found for email: ${email} or username: ${username}`);
        res.status(400).json({ message: 'Username or email already exists' });
        return;
      }

      // Handle profile image
      let imagePath: string | undefined;
      if (profileImage) {
        if (!ImageUtils.validateBase64Image(profileImage)) {
          res.status(400).json({ message: 'Invalid image format or size exceeds 5MB' });
          return;
        }
        imagePath = await ImageUtils.saveBase64Image(profileImage);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        profileImage: imagePath,
        icrRatio: icrRatio || 10, // Use provided ICR ratio or default to 10
      }) as IUserDocument;

      await user.save();
      console.log(`User registered successfully: ${email}`);

      const token = this.generateToken(user._id);

      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          icrRatio: user.icrRatio
        }
      });
    } catch (error) {
      console.error('Error during user registration:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log(`Login attempt for user: ${email}`);

      const user = await User.findOne({ email }) as IUserDocument;
      
      if (!user) {
        console.log(`Login failed - no user found for email: ${email}`);
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        console.log(`Login failed - invalid password for user: ${email}`);
        res.status(400).json({ message: 'Invalid email or password' });
        return;
      }

      console.log(`User logged in successfully: ${email}`);
      const token = this.generateToken(user._id);

      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        icrRatio: user.icrRatio
      };
      console.log(userData);
      res.status(200).json({ 
        message: 'Login successful',
        token,
        user: userData
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Error during login' });
    }
  }

  public async updateProfileImage(req: Request, res: Response): Promise<void> {
    console.log('[PUT /api/users/:userId/profile-image] Updating profile image');
    try {
      const { userId } = req.params;
      const { profileImage } = req.body;

      if (!req.user || req.user.id !== userId) {
        console.warn('[PUT /api/users/:userId/profile-image] Unauthorized attempt to update profile image');
        res.status(403).json({ message: 'Not authorized to update this profile' });
        return;
      }

      if (!profileImage || !this.validateBase64Image(profileImage)) {
        res.status(400).json({ message: 'Invalid image format or size exceeds 5MB' });
        return;
      }

      const user = await User.findById(userId) as IUserDocument;

      if (!user) {
        console.warn(`[PUT /api/users/:userId/profile-image] User not found: ${userId}`);
        res.status(404).json({ message: 'User not found' });
        return;
      }

      user.profileImage = profileImage;
      await user.save();

      console.log(`[PUT /api/users/:userId/profile-image] Profile image updated successfully for user ${userId}`);
      res.status(200).json({
        message: 'Profile image updated successfully',
        profileImage: user.profileImage
      });
    } catch (error) {
      console.error('[PUT /api/users/:userId/profile-image] Error updating profile image:', error);
      res.status(500).json({ message: 'Error updating profile image' });
    }
  }
}

export default new AuthController();

