import request from 'supertest';
import dotenv from 'dotenv';

dotenv.config();
    const BASE_URL = process.env.SERVER_URL || 'error'; // Change if necessary

describe('Posts API Endpoints', () => {
    let token: string;
    let postId: string;

    beforeAll(async () => {
        // Log in and get a token
        const loginRes = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(loginRes.status).toBe(200);
        token = loginRes.body.token;
    });

    it('should create a new post successfully', async () => {
        const postData = {
            content: 'This is a test post',
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
            healthMetrics: {
                location: 'Home',
                insulinUnits: 5,
                mealCarbs: 30
            }
        };

        const res = await request(BASE_URL)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send(postData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'Post created successfully');
        expect(res.body).toHaveProperty('post');
        postId = res.body.post._id;
    });

    it('should not allow creating a post without a token', async () => {
        const res = await request(BASE_URL)
            .post('/api/posts')
            .send({ content: 'Unauthorized post attempt' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    it('should fetch all posts', async () => {
        const res = await request(BASE_URL)
            .get('/api/posts')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should update a post', async () => {
        const updateData = {
            content: 'Updated content for the post',
            healthMetrics: {
                location: 'Updated Location',
                insulinUnits: 10,
                mealCarbs: 50
            }
        };

        const res = await request(BASE_URL)
            .put(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Post updated successfully');
    });

    it('should not update a post without a token', async () => {
        const res = await request(BASE_URL)
            .put(`/api/posts/${postId}`)
            .send({ content: 'Unauthorized update attempt' });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    it('should toggle like on a post', async () => {
        const res = await request(BASE_URL)
            .post(`/api/posts/${postId}/like`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    it('should add a comment to the post', async () => {
        const res = await request(BASE_URL)
            .post(`/api/posts/${postId}/comment`)
            .set('Authorization', `Bearer ${token}`)
            .send({ content: 'This is a test comment' });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'Comment added successfully');
    });

    it('should delete the post', async () => {
        const res = await request(BASE_URL)
            .delete(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Post deleted successfully');
    });

    it('should not delete a post without a token', async () => {
        const res = await request(BASE_URL)
            .delete(`/api/posts/${postId}`);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
    });
});
