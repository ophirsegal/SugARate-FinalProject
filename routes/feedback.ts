import express from 'express';
import { 
  createFeedback, 
  getFeedbackStats, 
  getUserFeedback, 
  getFeedbackByAnalysisId,
  getFeedbackByPostId,
  deleteFeedback,
  getRecentFeedback
} from '../controllers/feedbackController';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Create or update feedback for meal image analysis
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - analysisId
 *               - isLike
 *               - imageAnalysisData
 *             properties:
 *               analysisId:
 *                 type: string
 *                 description: Unique identifier for the analysis
 *               postId:
 *                 type: string
 *                 description: ID of the associated post
 *               isLike:
 *                 type: boolean
 *                 description: Whether the user liked the analysis
 *               review:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional review text
 *               imageAnalysisData:
 *                 type: object
 *                 required:
 *                   - foodName
 *                   - carbs
 *                   - calories
 *                   - insulinCalculated
 *                   - timestamp
 *                 properties:
 *                   foodName:
 *                     type: string
 *                   carbs:
 *                     type: number
 *                   calories:
 *                     type: number
 *                   protein:
 *                     type: number
 *                   fat:
 *                     type: number
 *                   insulinCalculated:
 *                     type: number
 *                   confidence:
 *                     type: string
 *                   portion:
 *                     type: string
 *                   glycemicIndex:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *       200:
 *         description: Feedback updated successfully
 *       500:
 *         description: Server error
 */
router.post('/', verifyToken, createFeedback);

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: Get feedback statistics
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: analysisType
 *         schema:
 *           type: string
 *           enum: [meal_image, nutrition, general_ai]
 *         description: Filter by analysis type
 *     responses:
 *       200:
 *         description: Feedback statistics
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
 *         description: Server error
 */
router.get('/stats', verifyToken, getFeedbackStats);

/**
 * @swagger
 * /api/feedback/user:
 *   get:
 *     summary: Get user's feedback history
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *     responses:
 *       200:
 *         description: User feedback list
 *       500:
 *         description: Server error
 */
router.get('/user', verifyToken, getUserFeedback);

/**
 * @swagger
 * /api/feedback/recent:
 *   get:
 *     summary: Get recent feedback with reviews
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *           default: 7
 *     responses:
 *       200:
 *         description: Recent feedback with statistics
 *       500:
 *         description: Server error
 */
router.get('/recent', verifyToken, getRecentFeedback);

/**
 * @swagger
 * /api/feedback/analysis/{analysisId}:
 *   get:
 *     summary: Get feedback for a specific analysis
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback details
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.get('/analysis/:analysisId', verifyToken, getFeedbackByAnalysisId);

/**
 * @swagger
 * /api/feedback/post/{postId}:
 *   get:
 *     summary: Get feedback for a specific post
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback details
 *       404:
 *         description: No feedback found for this post
 *       500:
 *         description: Server error
 */
router.get('/post/:postId', verifyToken, getFeedbackByPostId);

/**
 * @swagger
 * /api/feedback/{id}:
 *   delete:
 *     summary: Delete feedback
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', verifyToken, deleteFeedback);

export default router;