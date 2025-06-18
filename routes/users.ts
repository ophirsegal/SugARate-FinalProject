import express, { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import userController from '../controllers/userController';
import path from 'path';
import fs from 'fs';  // Added fs import

const router: Router = express.Router();

/**
 * @swagger
 * /api/users/{userId}/profile-image:
 *   get:
 *     summary: Get user's profile image
 *     description: Retrieves the profile image for the specified user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose profile image to retrieve.
 *     responses:
 *       200:
 *         description: Profile image file.
 *         content:
 *           image/*:
 *             schema:
 *               type: string 
 *               format: binary
 *       404:
 *         description: Image not found.
 *       500:
 *         description: Error retrieving image.
 */
router.get('/:userId/profile-image', (req, res) => {
  const imageDir = path.join(process.cwd(), 'uploads/profile-images');
  const imageFiles = [`${req.params.userId}.jpg`, `${req.params.userId}.jpeg`, `${req.params.userId}.png`, `${req.params.userId}.gif`];
  
  // Try each possible image extension
  for (const filename of imageFiles) {
    const imagePath = path.join(imageDir, filename);
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath);
    }
  }
  
  // If no image found, send default avatar or 404
  res.status(404).send('Image not found');
});

/**
 * @swagger
 * /api/users/{userId}/profile-image:
 *   put:
 *     summary: Update user's profile image
 *     description: Updates the profile image for the specified user. The image must be a valid Base64 encoded image and should not exceed 5MB. The request is authorized only if the user making the request matches the user ID in the path.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose profile image is to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 description: A valid Base64 encoded image string.
 *             required:
 *               - profileImage
 *     responses:
 *       200:
 *         description: Profile image updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *       400:
 *         description: Invalid image format or size exceeds 5MB.
 *       403:
 *         description: Not authorized to update this profile.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error updating profile image.
 */
router.put('/:userId/profile-image', verifyToken, (req, res) => userController.updateProfileImage(req, res));

/**
 * @swagger
 * /api/users/{userId}/username:
 *   put:
 *     summary: Update user's username
 *     description: Updates the username for the specified user. The username must be unique and follow the validation rules.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose username is to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username (3-30 characters, alphanumeric with _.-).
 *             required:
 *               - username
 *     responses:
 *       200:
 *         description: Username updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 username:
 *                   type: string
 *       400:
 *         description: Invalid username format or username already taken.
 *       403:
 *         description: Not authorized to update this profile.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error updating username.
 */
router.put('/:userId/username', verifyToken, (req, res) => userController.updateUsername(req, res));

/**
 * @swagger
 * /api/users/{userId}/icr-ratio:
 *   put:
 *     summary: Update user's ICR (Insulin-to-Carb Ratio)
 *     description: Updates the ICR ratio for the specified user. The ratio must be a number between 1 and 30.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose ICR ratio is to be updated.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               icrRatio:
 *                 type: number
 *                 description: The new ICR ratio (between 1 and 30).
 *             required:
 *               - icrRatio
 *     responses:
 *       200:
 *         description: ICR ratio updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 icrRatio:
 *                   type: number
 *       400:
 *         description: Invalid ICR ratio.
 *       403:
 *         description: Not authorized to update this profile.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Error updating ICR ratio.
 */
router.put('/:userId/icr-ratio', verifyToken, (req, res) => userController.updateIcrRatio(req, res));

export default router;