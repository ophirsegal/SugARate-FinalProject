import express from 'express';
import messageController from '../controllers/messageController';
import { Server as SocketServer } from 'socket.io';
import { verifyToken } from '../middleware/auth'; // Import token verification middleware

const router = express.Router();

/**
 * Sets up socket handlers for real-time messaging.
 * @param io - Socket.io server instance.
 */
export const setupSocketHandlers = (io: SocketServer) => {
  messageController.setupSocketHandlers(io);
};

/**
 * @swagger
 * /api/messages/contacts/{userId}:
 *   get:
 *     summary: Retrieve user contacts with last message details
 *     description: |
 *       Retrieves the list of contacts for the given user along with the latest message details and unread count.
 *       If no contacts exist, an empty array is returned.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the user.
 *     responses:
 *       200:
 *         description: A JSON object containing an array of contacts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       lastMessage:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           text:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                           senderId:
 *                             type: string
 *                       unreadCount:
 *                         type: number
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error fetching contacts.
 */
router.get('/contacts/:userId', verifyToken, (req, res) => messageController.getContacts(req, res));

/**
 * @swagger
 * /api/messages/chat/read/{userId}/{receiverId}:
 *   put:
 *     summary: Mark chat messages as read
 *     description: Marks all messages as read for a chat between the specified user and receiver.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user who is marking the messages as read.
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the other chat participant.
 *     responses:
 *       200:
 *         description: Messages marked as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to mark messages as read.
 */
router.put('/chat/read/:userId/:receiverId', verifyToken, (req, res) => messageController.markMessagesAsRead(req, res));

/**
 * @swagger
 * /api/messages/chat/{userId}/{receiverId}:
 *   get:
 *     summary: Retrieve chat history
 *     description: Retrieves the complete chat history between the specified user and receiver.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the first user.
 *       - in: path
 *         name: receiverId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the second user.
 *     responses:
 *       200:
 *         description: A JSON array of message objects sorted by timestamp.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   senderId:
 *                     type: string
 *                   receiverId:
 *                     type: string
 *                   text:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                   read:
 *                     type: boolean
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to fetch messages.
 */
router.get('/chat/:userId/:receiverId', verifyToken, (req, res) => messageController.getChatHistory(req, res));

/**
 * @swagger
 * /api/messages/send:
 *   post:
 *     summary: Send a message
 *     description: Sends a message from one user to another.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: string
 *                 description: The ID of the sender.
 *               receiverId:
 *                 type: string
 *                 description: The ID of the receiver.
 *               text:
 *                 type: string
 *                 description: The message text.
 *             required:
 *               - senderId
 *               - receiverId
 *               - text
 *     responses:
 *       201:
 *         description: Message sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 senderId:
 *                   type: string
 *                 receiverId:
 *                   type: string
 *                 text:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 read:
 *                   type: boolean
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to send message.
 */
router.post('/send', verifyToken, (req, res) => messageController.sendMessage(req, res));

export default router;
