// src/controllers/nutritionController.ts
import { Request, Response } from 'express';
import OpenAI from 'openai';

class NutritionController {
  private openai: OpenAI | null = null;

  private getOpenAIInstance() {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  public async getNutritionInfo(req: Request, res: Response): Promise<void> {
    try {
      const { query, icrRatio } = req.body;
      
      // Get the user's ICR ratio or use default
      const userIcrRatio = icrRatio || 10;

      if (!query) {
        res.status(400).json({ message: 'Food query is required' });
        return;
      }

      const openai = this.getOpenAIInstance();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert AI assistant specializing in diabetes management. Provide detailed, accurate nutritional information for foods in a clear, readable format.
            
            When responding to food queries:
            1. Begin with a brief description of the food
            2. List key macronutrients (calories, carbs, protein, fat)
            3. Include relevant micronutrients (vitamins, minerals)
            4. Mention glycemic index or impact on blood sugar for diabetic users
            5. ALWAYS include an ICR (Insulin-to-Carb Ratio) calculation section with:
               - Clear information about total carbohydrates
               - Insulin dosage calculation using the user's exact ICR ratio of 1:${userIcrRatio}
               - For example: "For 45g of carbs with your ICR ratio of 1:${userIcrRatio}, take ${(45/userIcrRatio).toFixed(1)} units of insulin"
               - If appropriate, also show general examples for common ICR ratios
            6. Suggest healthier alternatives if appropriate
            7. Format the information in an easy-to-read way with clear sections
            
            Always provide measurements in standard serving sizes, and clarify portion sizes when needed. Be precise with numbers and include units (g, mg, etc). Make the ICR information stand out as it's extremely important for diabetic users.`
          },
          { role: "user", content: `Provide detailed nutrition information for: ${query}` }
        ],
        temperature: 0.5, // More factual responses
        store: true,
      });

      const aiResponse = completion.choices[0].message.content;

      res.status(200).json({
        message: aiResponse,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('[Nutrition AI] Error:', error);
      res.status(500).json({ 
        message: 'Error processing your request'
      });
    }
  }
}

export default new NutritionController();