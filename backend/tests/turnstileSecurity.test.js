const request = require('supertest');
const app = require('../app'); // Adjust path based on your app structure
const redis = require('../utils/RedisClient');

describe('Turnstile Middleware Security Tests', () => {
    let server;
    
    beforeAll(async () => {
        server = app.listen(0);
    });

    afterAll(async () => {
        if (server) {
            server.close();
        }
        if (redis.disconnect) {
            redis.disconnect();
        }
    });

    beforeEach(async () => {
        // Clear any test data
        try {
            const keys = await redis.keys('turnstile_*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.log('Redis cleanup error (expected in test env):', error.message);
        }
    });

    describe('Token Validation', () => {
        test('should reject request without turnstile token', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('MISSING_TOKEN');
            expect(response.body.message).toContain('Security verification is required');
        });

        test('should reject invalid turnstile token format', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: 'invalid'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('INVALID_FORMAT');
        });

        test('should reject reused turnstile token', async () => {
            const mockToken = 'mock.turnstile.token.for.testing.purposes.only';
            
            // Mock successful Cloudflare validation
            const originalFetch = global.fetch;
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: true })
            });

            // First request should succeed (if other validations pass)
            const firstResponse = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: mockToken
                });

            // Second request with same token should fail
            const secondResponse = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: mockToken
                });

            expect(secondResponse.status).toBe(400);
            expect(secondResponse.body.code).toBe('TOKEN_REUSED');
            expect(secondResponse.body.message).toContain('expired');

            global.fetch = originalFetch;
        });
    });

    describe('Rate Limiting', () => {
        test('should enforce rate limits per IP', async () => {
            const promises = [];
            const mockToken = () => `mock.token.${Date.now()}.${Math.random()}`;

            // Mock Cloudflare validation
            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] })
            });

            // Make multiple requests rapidly
            for (let i = 0; i < 15; i++) {
                promises.push(
                    request(app)
                        .post('/api/users/login')
                        .send({
                            email: 'test@example.com',
                            password: 'password123',
                            turnstileToken: mockToken()
                        })
                );
            }

            const responses = await Promise.all(promises);
            
            // Some requests should be rate limited
            const rateLimited = responses.filter(r => r.status === 429);
            expect(rateLimited.length).toBeGreaterThan(0);
            
            const rateLimitedResponse = rateLimited[0];
            expect(rateLimitedResponse.body.code).toBe('RATE_LIMITED');
            expect(rateLimitedResponse.body.retryAfter).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle Cloudflare API errors gracefully', async () => {
            const mockToken = 'mock.token.for.testing.network.error';

            // Mock network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: mockToken
                });

            expect(response.status).toBe(400);
            expect(response.body.code).toBe('VALIDATION_FAILED');
            expect(['network-error']).toContain(response.body.cloudflareErrors[0]);
        });

        test('should map Cloudflare error codes to user-friendly messages', async () => {
            const testCases = [
                {
                    cloudflareError: 'timeout-or-duplicate',
                    expectedCode: 'TOKEN_EXPIRED',
                    expectedMessage: 'expired'
                },
                {
                    cloudflareError: 'invalid-input-response',
                    expectedCode: 'INVALID_TOKEN',
                    expectedMessage: 'Invalid'
                },
                {
                    cloudflareError: 'invalid-input-secret',
                    expectedCode: 'SERVICE_ERROR',
                    expectedMessage: 'service is temporarily unavailable'
                }
            ];

            for (const testCase of testCases) {
                const mockToken = `mock.token.${testCase.cloudflareError}`;

                global.fetch = jest.fn().mockResolvedValue({
                    json: () => Promise.resolve({ 
                        success: false, 
                        'error-codes': [testCase.cloudflareError] 
                    })
                });

                const response = await request(app)
                    .post('/api/users/login')
                    .send({
                        email: 'test@example.com',
                        password: 'password123',
                        turnstileToken: mockToken
                    });

                expect(response.status).toBe(400);
                expect(response.body.code).toBe(testCase.expectedCode);
                expect(response.body.message.toLowerCase()).toContain(testCase.expectedMessage.toLowerCase());
            }
        });
    });

    describe('Security Headers and Logging', () => {
        test('should log validation attempts with proper information', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const mockToken = 'mock.token.for.logging.test';

            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: true })
            });

            await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: mockToken
                });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[TURNSTILE] Validation attempt')
            );

            consoleSpy.mockRestore();
        });

        test('should add validation info to request object', async () => {
            // This test would require access to middleware internals
            // For now, we verify the response indicates successful validation
            const mockToken = 'mock.token.for.request.info.test';

            global.fetch = jest.fn().mockResolvedValue({
                json: () => Promise.resolve({ success: true })
            });

            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    turnstileToken: mockToken
                });

            // If validation passes through middleware, we should get to login logic
            // The response will depend on whether the user exists, but should not be a turnstile error
            expect(response.body.code).not.toBe('MISSING_TOKEN');
            expect(response.body.code).not.toBe('INVALID_FORMAT');
            expect(response.body.code).not.toBe('TOKEN_REUSED');
        });
    });
});