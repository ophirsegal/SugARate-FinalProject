// src/routes/auth.ts
import express from 'express';
import { verifyToken } from '../middleware/auth';
import authController from '../controllers/authController';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               profileImage:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: Username or email already exists.
 */
router.post('/register', (req, res) => authController.register(req, res));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Authenticate a user and return a token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Invalid email or password.
 */
router.post('/login', (req, res) => authController.login(req, res));

/**
 * @swagger
 * /api/auth/users/{userId}/profile-image:
 *   put:
 *     summary: Update user's profile image
 *     description: Update the profile image for a specific user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *             required:
 *               - profileImage
 *     responses:
 *       200:
 *         description: Profile image updated successfully.
 *       400:
 *         description: Invalid image format or size exceeds limit.
 *       403:
 *         description: Not authorized to update this profile.
 *       404:
 *         description: User not found.
 */
router.put('/users/:userId/profile-image', verifyToken, (req, res) => authController.updateProfileImage(req, res));

export default router;
