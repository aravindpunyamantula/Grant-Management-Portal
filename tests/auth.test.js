const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { User, Role, sequelize } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await Role.bulkCreate([
    { name: 'ADMIN', description: 'Administrator' },
    { name: 'GRANTOR', description: 'Grant creator' },
    { name: 'GRANTEE', description: 'Grant applicant' },
  ]);
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'test@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: '123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('should return 409 if email already exists', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      email: 'duplicate@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
    });
  });

  it('should login with valid credentials and return JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');

    const decoded = jwt.decode(res.body.accessToken);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('roles');
    expect(Array.isArray(decoded.roles)).toBe(true);
  });

  it('should return 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });
});

describe('JWT payload validation', () => {
  it('should contain userId and roles in JWT payload', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'JWT Test User',
      email: 'jwt@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'jwt@example.com',
      password: 'password123',
    });

    const decoded = jwt.decode(res.body.accessToken);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('roles');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });
});
