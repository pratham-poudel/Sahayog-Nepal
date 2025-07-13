// Jest setup file for email abuse protection tests
const Redis = require('ioredis');

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    mget: jest.fn().mockResolvedValue([]),
    sadd: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    srem: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    ttl: jest.fn().mockResolvedValue(-1),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    off: jest.fn()
  };
  
  return jest.fn().mockImplementation(() => mockRedis);
});

// Mock RedisClient
jest.mock('../utils/RedisClient', () => ({
  setex: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  mget: jest.fn().mockResolvedValue([]),
  sadd: jest.fn().mockResolvedValue(1),
  smembers: jest.fn().mockResolvedValue([]),
  srem: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  ttl: jest.fn().mockResolvedValue(-1),
  disconnect: jest.fn().mockResolvedValue(undefined)
}));

// Mock database connection
jest.mock('../db/db', () => ({
  connectToAstraDb: jest.fn().mockResolvedValue(true)
}));

// Mock email utilities
jest.mock('../utils/sendOtpEmail', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/sendTransactionEmail', () => ({
  sendTransactionEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/SendWelcomeEmail', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

// Mock User model
jest.mock('../models/User', () => ({
  findOne: jest.fn(),
  findById: jest.fn(),
  save: jest.fn()
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379';

// Global test timeout
jest.setTimeout(30000);

// Setup and teardown
beforeAll(async () => {
  console.log('Starting email abuse protection tests...');
});

afterAll(async () => {
  console.log('Email abuse protection tests completed.');
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
