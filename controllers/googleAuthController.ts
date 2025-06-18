import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import GoogleUser from '../models/GoogleUser';
import User from '../models/User';
import { google } from 'googleapis';
import { generateToken } from '../middleware/auth';
import axios from 'axios';

class GoogleAuthController {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      (req.session as any).state = state;
      const url = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        include_granted_scopes: true,
        state: state
      });
      res.json({ url });
    } catch (error) {
      console.error('URL generation error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  handleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, state } = req.query;
      if (typeof code !== 'string' || typeof state !== 'string') {
        res.status(400).send('Invalid or missing authorization code or state parameter');
        return;
      }
      if (state !== (req.session as any).state) {
        res.status(400).send('Invalid state parameter');
        return;
      }
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const userData = ticket.getPayload();
      if (!userData) {
        res.status(500).send('Failed to retrieve user data from Google');
        return;
      }
      const { normalUser } = await this.createOrUpdateUsers(userData);
      let base64ProfileImage = null;
      if (userData.picture) {
        try {
          const response = await axios.get(userData.picture, { responseType: 'arraybuffer' });
          base64ProfileImage = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
        } catch (imageError) {
          console.error('Error fetching profile image:', imageError);
        }
      }
      (req.session as any).state = undefined;
      const authToken = generateToken(normalUser._id);
      const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
      console.log("Sending auth data to client with origin:", clientOrigin);
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage(
                ${JSON.stringify({
                  token: authToken,
                  user: {
                    id: normalUser._id,
                    username: normalUser.username,
                    email: normalUser.email,
                    profileImage: base64ProfileImage || normalUser.profileImage,
                  },
                })},
                "${clientOrigin}"
              );
              window.close();
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Google Auth Error:', error);
      res.status(500).send(`
        <html>
          <body>
            <h1>Authentication failed</h1>
            <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          </body>
        </html>
      `);
    }
  };

  private async createOrUpdateUsers(userData: any) {
    let googleUser = await GoogleUser.findOne({ email: userData.email });
    if (!googleUser) {
      googleUser = await GoogleUser.create({
        email: userData.email,
        name: userData.name || userData.email,
        picture: userData.picture,
        googleId: userData.sub,
        firstName: userData.given_name,
        lastName: userData.family_name
      });
    } else {
      googleUser.name = userData.name || googleUser.name;
      googleUser.picture = userData.picture;
      googleUser.firstName = userData.given_name;
      googleUser.lastName = userData.family_name;
      await googleUser.save();
    }
    let normalUser = await User.findOne({ email: userData.email });
    if (!normalUser) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const username = userData.email.split('@')[0] || userData.given_name.toLowerCase();
      let finalUsername = username;
      let counter = 1;
      while (await User.findOne({ username: finalUsername })) {
        finalUsername = `${username}${counter}`;
        counter++;
      }
      normalUser = await User.create({
        username: finalUsername,
        email: userData.email,
        password: hashedPassword,
        profileImage: userData.picture
      });
    }
    return { googleUser, normalUser };
  }
}

export default new GoogleAuthController();
