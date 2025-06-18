import request from 'supertest';

import dotenv from 'dotenv';

dotenv.config();
const BASE_URL = process.env.SERVER_URL || 'error'; // Change if your server runs on a different port

describe('Auth API Endpoints', () => {
    const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        profileImage: 'https://example.com/profile.jpg'
    };

    it('should register a new user successfully', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/register')
            .send(userData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token'); // Assuming register returns a token
    });

    it('should not allow duplicate email registration', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/register')
            .send(userData);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'Username or email already exists');
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: userData.email, password: userData.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: userData.email, password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('message', 'Invalid email or password');
    });
});
