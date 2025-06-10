# SugARate – Smart Insulin Management Platform

**SugARate** is a smart web application designed to assist individuals with Type 1 diabetes in managing their insulin intake more effectively. The system combines image recognition, nutritional databases, and user-friendly design to calculate carbohydrate content and suggest appropriate insulin doses.

## Features

- **AI-Based Food Recognition**  
  Upload a photo of your meal and receive an automatic estimation of carbohydrate content based on visual analysis and nutritional data.

- **Fixed Carbohydrate Dictionary**  
  Built-in dictionary of food items with predefined carbohydrate values per serving, designed for quick logging without image input.

- **Insulin & Carb Tracking Dashboard**  
  Interactive dashboard displaying average daily intake of carbohydrates and insulin doses over time.

- **Authentication System**  
  Secure signup/login flow for managing personal data, powered by Express.js and MongoDB.

- **Mobile-Friendly UI**  
  Responsive front-end built with React, designed for both mobile and desktop experiences.

## Tech Stack

- **Frontend**: React, Axios, CSS  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB (via MongoDB Atlas)  
- **AI Integration**: Firebase ML / Custom TensorFlow Model (optional)  
- **Authentication**: JWT-based token system  
- **Deployment**: Railway (backend), Vercel (frontend)

## Carbohydrate Dictionary (Examples)

| Food Item        | Quantity         | Carbohydrates (g) |
|------------------|------------------|--------------------|
| Apple            | 1 medium         | 19                 |
| White Bread      | 1 slice (30g)    | 15                 |
| Rice (cooked)    | 100g             | 28                 |
| Banana           | 1 medium         | 27                 |
| Yogurt (plain)   | 100g             | 5                  |

Users can access this dictionary inside the app and log items with a single click.

## Analytics & Visualization

SugARate includes visual tools to help users understand their trends over time. Features include:

- Line graphs of daily insulin doses
- Average carbohydrate intake per day
- Weekly trends for improved diabetes management
- Visual breakdown of meals by type and estimated carb content

These insights are personalized for each logged-in user and updated in real-time.

## Project Structure

