// src/controllers/foodImageController.ts
import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import insulinCalculator from '../utils/diabetes/insulinCalculator';
import User from '../models/User';

// Extended Request type to include the user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/food-images');
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, JPG and PNG image files are allowed!'));
    }
    cb(null, true);
  }
});

// Analysis feedback interface
interface AnalysisFeedback {
  userId: string;
  foodName: string;
  analysisTimestamp: Date;
  liked: boolean;
  comment?: string;
  nutritionInfo?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  confidence?: string;
}

class FoodImageController {
  private openai: OpenAI | null = null;
  private analysisFeedbacks: AnalysisFeedback[] = []; // In-memory storage for now

  private getOpenAIInstance() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  public async analyzeFoodImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check if there's an image file
      if (!req.file) {
        res.status(400).json({ message: 'No image file provided' });
        return;
      }

      const imageFile = req.file;
      const description = req.body.description || '';
      let userIcrRatio = req.body.icrRatio ? Number(req.body.icrRatio) : null;
      
      // If no ICR ratio provided in request, try to get from user's profile
      if (!userIcrRatio && req.user && req.user.id) {
        try {
          const user = await User.findById(req.user.id);
          if (user && user.icrRatio) {
            userIcrRatio = user.icrRatio;
          }
        } catch (error) {
          console.error('Error fetching user ICR ratio:', error);
        }
      }
      
      // Default to 10 if still no ICR ratio
      userIcrRatio = userIcrRatio || 10;
      
      // Get the file data
      const imageBuffer = fs.readFileSync(imageFile.path);
      const base64Image = imageBuffer.toString('base64');

      // Create prompt for the vision model with JSON response
      const openai = this.getOpenAIInstance();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert in identifying foods and providing accurate nutrition information for diabetes management. 
            
You must respond with a JSON object containing the following structure:
{
  "foodName": "string - name of the identified food",
  "portion": "string - estimated portion size",
  "nutritionInfo": {
    "calories": "number - total calories",
    "carbs": "number - total carbohydrates in grams",
    "protein": "number - total protein in grams", 
    "fat": "number - total fat in grams",
    "fiber": "number - total fiber in grams"
  },
  "glycemicIndex": "string - low/medium/high",
  "insulinCalculation": {
    "carbsAmount": "number - carbs used for calculation",
    "icrRatio": ${userIcrRatio},
    "insulinUnits": "number - calculated insulin units needed"
  },
  "healthNotes": "string - brief health considerations for diabetes management",
  "confidence": "string - high/medium/low - confidence in the analysis"
}

Provide exact numeric values. Calculate insulin units by dividing carbs by the ICR ratio (${userIcrRatio}). Be as accurate as possible with carbohydrate content as this is critical for diabetes management.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Identify this food and provide nutrition information in JSON format. ${description}` },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.mimetype};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.3, // More deterministic for structured data
        max_tokens: 500
      });

      // Clean up the temporary file
      fs.unlinkSync(imageFile.path);

      // Parse the JSON response
      const aiResponseContent = response.choices[0].message.content || '{}';
      let aiData: any;
      
      try {
        aiData = JSON.parse(aiResponseContent);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('AI Response:', aiResponseContent);
        throw new Error('Invalid response from AI model');
      }

      // Create a user-friendly message
      const message = `Identified: ${aiData.foodName} (${aiData.portion})
Calories: ${aiData.nutritionInfo.calories} kcal
Carbohydrates: ${aiData.nutritionInfo.carbs}g
Protein: ${aiData.nutritionInfo.protein}g
Fat: ${aiData.nutritionInfo.fat}g
Fiber: ${aiData.nutritionInfo.fiber}g

Glycemic Index: ${aiData.glycemicIndex}
Insulin Required: ${aiData.insulinCalculation.insulinUnits.toFixed(1)} units (based on ICR 1:${aiData.insulinCalculation.icrRatio})

${aiData.healthNotes}`;

      res.status(200).json({
        message,
        aiData, // Include the full structured data
        foodName: aiData.foodName,
        portion: aiData.portion,
        nutritionInfo: {
          calories: Number(aiData.nutritionInfo.calories),
          carbs: Number(aiData.nutritionInfo.carbs),
          protein: Number(aiData.nutritionInfo.protein),
          fat: Number(aiData.nutritionInfo.fat),
          fiber: Number(aiData.nutritionInfo.fiber)
        },
        insulinRequired: Number(aiData.insulinCalculation.insulinUnits),
        insulinCalculation: aiData.insulinCalculation,
        glycemicIndex: aiData.glycemicIndex,
        healthNotes: aiData.healthNotes,
        confidence: aiData.confidence,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[Food Image AI] Error:', error);
      res.status(500).json({ 
        message: 'Error processing your request'
      });
    }
  }

  public async analyzeFoodText(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description, icrRatio: requestIcrRatio } = req.body;
      let userIcrRatio = requestIcrRatio ? Number(requestIcrRatio) : null;

      if (!description) {
        res.status(400).json({ message: 'Food description is required' });
        return;
      }
      
      // If no ICR ratio provided in request, try to get from user's profile
      if (!userIcrRatio && req.user && req.user.id) {
        try {
          const user = await User.findById(req.user.id);
          if (user && user.icrRatio) {
            userIcrRatio = user.icrRatio;
          }
        } catch (error) {
          console.error('Error fetching user ICR ratio:', error);
        }
      }
      
      // Default to 10 if still no ICR ratio
      userIcrRatio = userIcrRatio || 10;

      const openai = this.getOpenAIInstance();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an expert in nutritional analysis for diabetes management.
            
You must respond with a JSON object containing the following structure:
{
  "foodName": "string - name of the described food",
  "portion": "string - estimated portion size",
  "nutritionInfo": {
    "calories": "number - total calories",
    "carbs": "number - total carbohydrates in grams",
    "protein": "number - total protein in grams", 
    "fat": "number - total fat in grams",
    "fiber": "number - total fiber in grams"
  },
  "glycemicIndex": "string - low/medium/high",
  "insulinCalculation": {
    "carbsAmount": "number - carbs used for calculation",
    "icrRatio": ${userIcrRatio},
    "insulinUnits": "number - calculated insulin units needed"
  },
  "healthNotes": "string - brief health considerations for diabetes management",
  "confidence": "string - high/medium/low - confidence in the analysis"
}

Provide exact numeric values. Calculate insulin units by dividing carbs by the ICR ratio (${userIcrRatio}). Be as accurate as possible with carbohydrate content as this is critical for diabetes management.`
          },
          { role: "user", content: `Provide detailed nutrition information in JSON format for: ${description}` }
        ],
        temperature: 0.3, // More deterministic for structured data
        max_tokens: 500
      });

      // Parse the JSON response
      const aiResponseContent = completion.choices[0].message.content || '{}';
      let aiData: any;
      
      try {
        aiData = JSON.parse(aiResponseContent);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.error('AI Response:', aiResponseContent);
        throw new Error('Invalid response from AI model');
      }

      // Create a user-friendly message
      const message = `Identified: ${aiData.foodName} (${aiData.portion})
Calories: ${aiData.nutritionInfo.calories} kcal
Carbohydrates: ${aiData.nutritionInfo.carbs}g
Protein: ${aiData.nutritionInfo.protein}g
Fat: ${aiData.nutritionInfo.fat}g
Fiber: ${aiData.nutritionInfo.fiber}g

Glycemic Index: ${aiData.glycemicIndex}
Insulin Required: ${aiData.insulinCalculation.insulinUnits.toFixed(1)} units (based on ICR 1:${aiData.insulinCalculation.icrRatio})

${aiData.healthNotes}`;

      res.status(200).json({
        message,
        aiData, // Include the full structured data
        foodName: aiData.foodName,
        portion: aiData.portion,
        nutritionInfo: {
          calories: Number(aiData.nutritionInfo.calories),
          carbs: Number(aiData.nutritionInfo.carbs),
          protein: Number(aiData.nutritionInfo.protein),
          fat: Number(aiData.nutritionInfo.fat),
          fiber: Number(aiData.nutritionInfo.fiber)
        },
        insulinRequired: Number(aiData.insulinCalculation.insulinUnits),
        insulinCalculation: aiData.insulinCalculation,
        glycemicIndex: aiData.glycemicIndex,
        healthNotes: aiData.healthNotes,
        confidence: aiData.confidence,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[Food Text AI] Error:', error);
      res.status(500).json({ 
        message: 'Error processing your request'
      });
    }
  }

  public async submitAnalysisFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { foodName, analysisTimestamp, liked, comment, nutritionInfo, confidence } = req.body;
      
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (typeof liked !== 'boolean') {
        res.status(400).json({ message: 'Feedback (liked/disliked) is required' });
        return;
      }

      // Create feedback object
      const feedback: AnalysisFeedback = {
        userId: req.user.id,
        foodName: foodName || 'Unknown food',
        analysisTimestamp: new Date(analysisTimestamp),
        liked,
        comment: comment || undefined,
        nutritionInfo: nutritionInfo || undefined,
        confidence: confidence || undefined
      };

      // Store feedback (in production, this would go to a database)
      this.analysisFeedbacks.push(feedback);
      
      // Log feedback for monitoring
      console.log('[Analysis Feedback]', {
        userId: feedback.userId,
        foodName: feedback.foodName,
        liked: feedback.liked,
        confidence: feedback.confidence,
        comment: feedback.comment ? feedback.comment.substring(0, 50) + '...' : 'No comment'
      });

      res.status(200).json({
        message: 'Thank you for your feedback!',
        feedbackId: Date.now().toString() // Simple ID for now
      });
    } catch (error) {
      console.error('[Analysis Feedback] Error:', error);
      res.status(500).json({ 
        message: 'Error submitting feedback'
      });
    }
  }

  // Get feedback statistics (for admin/monitoring)
  public async getFeedbackStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const totalFeedbacks = this.analysisFeedbacks.length;
      const positiveFeedbacks = this.analysisFeedbacks.filter(f => f.liked).length;
      const negativeFeedbacks = totalFeedbacks - positiveFeedbacks;
      
      const stats = {
        total: totalFeedbacks,
        positive: positiveFeedbacks,
        negative: negativeFeedbacks,
        positiveRate: totalFeedbacks > 0 ? (positiveFeedbacks / totalFeedbacks * 100).toFixed(1) : 0,
        recentFeedbacks: this.analysisFeedbacks.slice(-10).reverse() // Last 10 feedbacks
      };

      res.status(200).json(stats);
    } catch (error) {
      console.error('[Feedback Stats] Error:', error);
      res.status(500).json({ 
        message: 'Error retrieving feedback statistics'
      });
    }
  }
}

export default new FoodImageController();