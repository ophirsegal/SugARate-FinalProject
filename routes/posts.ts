// src/routes/posts.ts
import express from 'express';
import { verifyToken } from '../middleware/auth';
import postController from '../controllers/postController';

const router = express.Router();

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Creates a new post with content, an optional image, and optional health metrics.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string (optional).
 *               healthMetrics:
 *                 type: object
 *                 properties:
 *                   location:
 *                     type: string
 *                   insulinUnits:
 *                     type: number
 *                   mealCarbs:
 *                     type: number
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Post created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid image format, invalid health metrics, or missing content.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error creating post.
 */
router.post('/', verifyToken, (req, res) => postController.createPost(req, res));

/**
 * @swagger
 * /api/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     description: Update a post's content, image, or health metrics.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 description: Base64 encoded image string (optional).
 *               healthMetrics:
 *                 type: object
 *                 properties:
 *                   location:
 *                     type: string
 *                   insulinUnits:
 *                     type: number
 *                   mealCarbs:
 *                     type: number
 *     responses:
 *       200:
 *         description: Post updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Missing content or invalid image/health metrics.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Not authorized to update this post.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Error updating post.
 */
router.put('/:postId', verifyToken, (req, res) => postController.updatePost(req, res));

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Retrieve all posts
 *     description: Retrieves all posts with associated user and comment details.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Error fetching posts.
 */
router.get('/', verifyToken, (req, res) => postController.getAllPosts(req, res));

/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     summary: Delete a post
 *     description: Deletes a post by its ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete.
 *     responses:
 *       200:
 *         description: Post deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Not authorized to delete this post.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Error deleting post.
 */
router.delete('/:postId', verifyToken, (req, res) => postController.deletePost(req, res));

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Like or unlike a post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to like or unlike.
 *     responses:
 *       200:
 *         description: Like toggled successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 likes:
 *                   type: number
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Error updating like.
 */
router.post('/:postId/like', verifyToken, (req, res) => postController.toggleLike(req, res));

/**
 * @swagger
 * /api/posts/{postId}/comment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Adds a new comment to the specified post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Comment added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Error adding comment.
 */
router.post('/:postId/comment', verifyToken, (req, res) => postController.addComment(req, res));

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Retrieve posts by a specific user
 *     description: Retrieves all posts created by the specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *     responses:
 *       200:
 *         description: List of posts by the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Error fetching user posts.
 */
router.get('/user/:userId', (req, res) => postController.getUserPosts(req, res));

export default router;
