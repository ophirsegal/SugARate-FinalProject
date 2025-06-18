// src/controllers/messageController.ts
import { Request, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import Message from '../models/Message';
import ChatList from '../models/ChatList';
import User from '../models/User';

class MessageController {
  private io: SocketServer | null = null;

  public setSocketServer(io: SocketServer) {
    this.io = io;
  }

  public setupSocketHandlers(io: SocketServer) {
    this.io = io;
    
    io.on('connection', (socket) => {
      console.log('A user connected');

      socket.on('send_message', async (data) => {
        try {
          const newMessage = new Message({
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text
          });
          await newMessage.save();

          // Update chat lists for both users
          await this.updateChatList(data.senderId, data.receiverId);
          await this.updateChatList(data.receiverId, data.senderId);

          io.emit('receive_message', {
            id: newMessage._id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  }

  private async updateChatList(userId: string, contactId: string) {
    await ChatList.updateOne(
      { userId },
      { 
        $addToSet: { contacts: contactId },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true }
    );
  }

  public async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const chatList = await ChatList.findOne({ userId: req.params.userId });
      
      if (!chatList || !chatList.contacts.length) {
        res.json({ contacts: [] });
        return;
      }

      const contactDetails = await User.find(
        { _id: { $in: chatList.contacts } },
        'username email'
      );

      const contactsWithLastMessage = await Promise.all(
        contactDetails.map(async (contact) => {
          const lastMessage = await Message.findOne({
            $or: [
              { senderId: req.params.userId, receiverId: contact._id },
              { senderId: contact._id, receiverId: req.params.userId }
            ]
          })
          .sort({ timestamp: -1 })
          .limit(1);

          const unreadCount = await Message.countDocuments({
            senderId: contact._id,
            receiverId: req.params.userId,
            read: false
          });

          return {
            _id: contact._id,
            username: contact.username,
            email: contact.email,
            lastMessage: lastMessage ? {
              text: lastMessage.text,
              timestamp: lastMessage.timestamp,
              senderId: lastMessage.senderId
            } : null,
            unreadCount
          };
        })
      );

      contactsWithLastMessage.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - 
               new Date(a.lastMessage.timestamp).getTime();
      });

      res.json({ contacts: contactsWithLastMessage });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }

  public async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      await Message.updateMany({
        senderId: req.params.receiverId,
        receiverId: req.params.userId,
        read: false
      }, { $set: { read: true } });
      res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }

  public async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const messages = await Message.find({
        $or: [
          { senderId: req.params.userId, receiverId: req.params.receiverId },
          { senderId: req.params.receiverId, receiverId: req.params.userId }
        ]
      }).sort({ timestamp: 1 });
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { senderId, receiverId, text } = req.body;

      const newMessage = new Message({
        senderId,
        receiverId,
        text
      });
      
      await newMessage.save();

      // Update chat lists for both users
      await this.updateChatList(senderId, receiverId);
      await this.updateChatList(receiverId, senderId);

      // Emit to socket if available
      if (this.io) {
        this.io.emit('receive_message', {
          id: newMessage._id,
          senderId: senderId,
          receiverId: receiverId,
          text: text,
          timestamp: newMessage.timestamp.toISOString()
        });
      }

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
}

export default new MessageController();

