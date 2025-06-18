// src/controllers/aiChatController.ts
import { Request, Response } from 'express';
import OpenAI from 'openai';

class AIChatController {
  private openai: OpenAI | null = null;

  private getOpenAIInstance() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  public async handleChat(req: Request, res: Response): Promise<void> {
    try {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ message: 'Message is required' });
        return;
      }

      const openai = this.getOpenAIInstance();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a knowledgeable AI health assistant specialized in diabetes management. Provide accurate, helpful, and compassionate advice while being clear that you are not a replacement for professional medical care."
          },
          { role: "user", content: message }
        ],
        store: true,
      });

      const aiResponse = completion.choices[0].message.content;

      res.status(200).json({
        message: aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[AI Chat] Error:', error);
      res.status(500).json({ 
        message: 'Error processing your request'
      });
    }
  }
}

export default new AIChatController();