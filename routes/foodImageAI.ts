// src/routes/foodImageAI.ts
import express from 'express';
import { verifyToken } from '../middleware/auth';
import foodImageController, { upload } from '../controllers/foodImageController';

const router = express.Router();

/**
 * @swagger
 * /api/ai/food-image-recognition:
 *   post:
 *     summary: Analyze a food image for nutrition information
 *     description: >
 *       Uploads a food image for AI analysis. Returns identified food name, nutrition values including calories,
 *       carbs, protein, fat, and insulin dosage recommendations based on carbohydrate content.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Food image to analyze
 *               description:
 *                 type: string
 *                 description: Optional additional details about the food
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Food analyzed successfully with nutrition information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Detailed nutrition information and insulin requirements
 *                 foodName:
 *                   type: string
 *                   description: Identified food name
 *                 nutritionInfo:
 *                   type: object
 *                   properties:
 *                     calories:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     protein:
 *                       type: number
 *                     fat:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: No image provided or invalid image format.
 *       500:
 *         description: Error processing your request.
 */
router.post('/food-image-recognition', verifyToken, upload.single('image'), (req, res) => foodImageController.analyzeFoodImage(req, res));

/**
 * @swagger
 * /api/ai/food-text-recognition:
 *   post:
 *     summary: Analyze a food description for nutrition information
 *     description: >
 *       Sends a text description of food for AI analysis. Returns estimated nutrition values
 *       including calories, carbs, protein, fat, and insulin dosage recommendations.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Description of the food
 *             required:
 *               - description
 *     responses:
 *       200:
 *         description: Food analyzed successfully with nutrition information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Detailed nutrition information and insulin requirements
 *                 foodName:
 *                   type: string
 *                   description: Identified food name
 *                 nutritionInfo:
 *                   type: object
 *                   properties:
 *                     calories:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     protein:
 *                       type: number
 *                     fat:
 *                       type: number
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Food description is required.
 *       500:
 *         description: Error processing your request.
 */
router.post('/food-text-recognition', verifyToken, (req, res) => foodImageController.analyzeFoodText(req, res));

/**
 * @swagger
 * /api/ai/analyze-food-image:
 *   post:
 *     summary: Analyze a meal image for carbohydrate content and insulin calculation
 *     description: >
 *       Uploads a meal image for detailed analysis including carbohydrate content and automatic
 *       insulin calculation based on the user's ICR ratio. Designed for meal posts.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Meal image to analyze
 *               description:
 *                 type: string
 *                 description: Optional additional details about the meal
 *               icrRatio:
 *                 type: number
 *                 description: User's Insulin-to-Carb Ratio (optional)
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Meal analyzed successfully with nutrition information and insulin calculation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Detailed nutrition information and insulin requirements
 *                 foodName:
 *                   type: string
 *                   description: Identified meal name
 *                 nutritionInfo:
 *                   type: object
 *                   properties:
 *                     calories:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     protein:
 *                       type: number
 *                     fat:
 *                       type: number
 *                 insulinRequired:
 *                   type: number
 *                   description: Calculated insulin units based on carbs and ICR ratio
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: No image provided or invalid image format.
 *       500:
 *         description: Error processing your request.
 */
router.post('/analyze-food-image', verifyToken, upload.single('image'), (req, res) => foodImageController.analyzeFoodImage(req, res));

/**
 * @swagger
 * /api/ai/analysis-feedback:
 *   post:
 *     summary: Submit feedback for food analysis results
 *     description: >
 *       Allows users to provide feedback on the accuracy of food analysis results
 *       including like/dislike and optional review comments.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               analysisId:
 *                 type: string
 *                 description: ID of the analysis to provide feedback for
 *               isLike:
 *                 type: boolean
 *                 description: Whether the user liked (true) or disliked (false) the analysis
 *               review:
 *                 type: string
 *                 description: Optional review text explaining the feedback
 *             required:
 *               - analysisId
 *               - isLike
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid feedback data
 *       500:
 *         description: Error processing feedback
 */
router.post('/analysis-feedback', verifyToken, (req, res) => foodImageController.submitAnalysisFeedback(req, res));

/**
 * @swagger
 * /api/ai/analysis-feedback/stats:
 *   get:
 *     summary: Get feedback statistics for analysis quality monitoring
 *     description: Returns aggregated feedback statistics for analysis quality assessment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feedback statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFeedback:
 *                   type: number
 *                 likes:
 *                   type: number
 *                 dislikes:
 *                   type: number
 *                 likePercentage:
 *                   type: number
 *       500:
 *         description: Error retrieving feedback statistics
 */
router.get('/analysis-feedback/stats', verifyToken, (req, res) => foodImageController.getFeedbackStats(req, res));

export default router;