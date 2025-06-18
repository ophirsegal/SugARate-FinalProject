import request from 'supertest';
import dotenv from 'dotenv';        

dotenv.config();
const BASE_URL = process.env.SERVER_URL ||'error' ; // Change if necessary

describe('Messages API Endpoints', () => {
    let token: string;
    let userId = 'testUser123';
    let receiverId = 'testUser456';

    beforeAll(async () => {
        // Log in and get a token
        const loginRes = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(loginRes.status).toBe(200);
        token = loginRes.body.token;
    });

    it('should retrieve user contacts', async () => {
        const res = await request(BASE_URL)
            .get(`/api/messages/contacts/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('contacts');
        expect(Array.isArray(res.body.contacts)).toBeTruthy();
    });

    it('should retrieve chat history between two users', async () => {
        const res = await request(BASE_URL)
            .get(`/api/messages/chat/${userId}/${receiverId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should mark chat messages as read', async () => {
        const res = await request(BASE_URL)
            .put(`/api/messages/chat/read/${userId}/${receiverId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Messages marked as read');
    });

    it('should not mark messages as read without authentication', async () => {
        const res = await request(BASE_URL)
            .put(`/api/messages/chat/read/${userId}/${receiverId}`);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });
});
