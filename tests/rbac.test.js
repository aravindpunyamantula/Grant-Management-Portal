const request = require('supertest');
const app = require('../src/app');
const { User, Role, sequelize } = require('../src/models');
const { generateToken } = require('../src/utils/jwt');

let adminToken, grantorToken, granteeToken;
let adminUser, grantorUser, granteeUser;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const roles = await Role.bulkCreate([
    { name: 'ADMIN', description: 'Administrator' },
    { name: 'GRANTOR', description: 'Grant creator' },
    { name: 'GRANTEE', description: 'Grant applicant' },
  ]);

  const adminRole = roles[0];
  const grantorRole = roles[1];
  const granteeRole = roles[2];

  adminUser = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  grantorUser = await User.create({ name: 'Grantor', email: 'grantor@test.com', password: 'password123' });
  granteeUser = await User.create({ name: 'Grantee', email: 'grantee@test.com', password: 'password123' });

  await adminUser.addRole(adminRole);
  await grantorUser.addRole(grantorRole);
  await granteeUser.addRole(granteeRole);

  adminToken = generateToken(adminUser.id, ['ADMIN']);
  grantorToken = generateToken(grantorUser.id, ['GRANTOR']);
  granteeToken = generateToken(granteeUser.id, ['GRANTEE']);
});

afterAll(async () => {
  await sequelize.close();
});

describe('Authentication middleware', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request(app).post('/api/grants');
    expect(res.status).toBe(401);
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/grants')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

describe('RBAC - GRANTOR access', () => {
  it('should allow GRANTOR to create a grant', async () => {
    const res = await request(app)
      .post('/api/grants')
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ title: 'Test Grant', description: 'Description', amount: 10000 });
    expect(res.status).toBe(201);
  });

  it('should deny GRANTEE from creating a grant (403)', async () => {
    const res = await request(app)
      .post('/api/grants')
      .set('Authorization', `Bearer ${granteeToken}`)
      .send({ title: 'Test Grant', description: 'Description', amount: 10000 });
    expect(res.status).toBe(403);
  });
});

describe('RBAC - ADMIN role assignment', () => {
  it('should allow ADMIN to assign a role to a user', async () => {
    const newUser = await User.create({ name: 'New User', email: 'newuser@test.com', password: 'pass123' });

    const res = await request(app)
      .post(`/api/users/${newUser.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'GRANTOR' });

    expect(res.status).toBe(200);
    expect(res.body.user.roles).toContain('GRANTOR');
  });

  it('should deny non-ADMIN from assigning roles (403)', async () => {
    const res = await request(app)
      .post(`/api/users/${granteeUser.id}/roles`)
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ roleName: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/users/00000000-0000-0000-0000-000000000000/roles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'GRANTOR' });

    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid role name', async () => {
    const res = await request(app)
      .post(`/api/users/${granteeUser.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'SUPERUSER' });

    expect(res.status).toBe(400);
  });

  it('should return 409 if user already has the role', async () => {
    const res = await request(app)
      .post(`/api/users/${granteeUser.id}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleName: 'GRANTEE' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/users - ADMIN only', () => {
  it('should allow ADMIN to list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should deny non-ADMIN from listing users (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${granteeToken}`);
    expect(res.status).toBe(403);
  });
});
