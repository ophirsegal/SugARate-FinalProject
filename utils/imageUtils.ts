// utils/imageUtils.ts
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

export class ImageUtils {
  private static UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'profile-images');
  private static getServerUrl(): string {
    const port = process.env.PORT || 5000;
    return process.env.SERVER_URL || `http://localhost:${port}`;
  }

  static async initialize(): Promise<void> {
    await fs.ensureDir(this.UPLOAD_DIR);
  }

  static async saveBase64Image(base64String: string): Promise<string> {
    // Remove the data:image/xyz;base64, prefix
    const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }

    const imageType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Generate unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}.${imageType}`;
    const filepath = path.join(this.UPLOAD_DIR, filename);

    // Save the file
    await fs.writeFile(filepath, buffer);

    // Return the full URL
    return `${this.getServerUrl()}/uploads/profile-images/${filename}`;
  }

  static async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    // Extract the relative path from the full URL
    const serverUrl = this.getServerUrl();
    const relativePath = imageUrl.replace(serverUrl, '');
    const absolutePath = path.join(process.cwd(), relativePath);
    
    try {
      await fs.remove(absolutePath);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  static validateBase64Image(base64String: string): boolean {
    const regex = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    if (!regex.test(base64String)) {
      return false;
    }
    
    const base64WithoutPrefix = base64String.split(',')[1];
    const sizeInBytes = Buffer.from(base64WithoutPrefix, 'base64').length;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return sizeInBytes <= maxSize;
  }
}