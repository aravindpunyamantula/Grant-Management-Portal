const request = require('supertest');
const app = require('../src/app');
const { User, Role, Grant, Application, sequelize } = require('../src/models');
const { generateToken } = require('../src/utils/jwt');

let grantorToken, grantorBToken, granteeToken;
let grantorUser, grantorUserB, granteeUser;
let testGrantId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const roles = await Role.bulkCreate([
    { name: 'ADMIN', description: 'Administrator' },
    { name: 'GRANTOR', description: 'Grant creator' },
    { name: 'GRANTEE', description: 'Grant applicant' },
  ]);

  const grantorRole = roles[1];
  const granteeRole = roles[2];

  grantorUser = await User.create({ name: 'Grantor A', email: 'grantorA@test.com', password: 'password123' });
  grantorUserB = await User.create({ name: 'Grantor B', email: 'grantorB@test.com', password: 'password123' });
  granteeUser = await User.create({ name: 'Grantee', email: 'grantee@test.com', password: 'password123' });

  await grantorUser.addRole(grantorRole);
  await grantorUserB.addRole(grantorRole);
  await granteeUser.addRole(granteeRole);

  grantorToken = generateToken(grantorUser.id, ['GRANTOR']);
  grantorBToken = generateToken(grantorUserB.id, ['GRANTOR']);
  granteeToken = generateToken(granteeUser.id, ['GRANTEE']);
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/grants', () => {
  it('should allow GRANTOR to create a grant', async () => {
    const res = await request(app)
      .post('/api/grants')
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ title: 'Tech Innovation Grant', description: 'For tech startups', amount: 50000 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Tech Innovation Grant');
    expect(res.body.grantor_id).toBe(grantorUser.id);
    testGrantId = res.body.id;
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/grants')
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ title: 'No Amount Grant' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/grants', () => {
  it('should return list of grants for authenticated user', async () => {
    const res = await request(app)
      .get('/api/grants')
      .set('Authorization', `Bearer ${granteeToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request(app).get('/api/grants');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/grants/:grantId', () => {
  it('should return a specific grant', async () => {
    const res = await request(app)
      .get(`/api/grants/${testGrantId}`)
      .set('Authorization', `Bearer ${granteeToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(testGrantId);
  });

  it('should return 404 for non-existent grant', async () => {
    const res = await request(app)
      .get('/api/grants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${granteeToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/grants/:grantId', () => {
  it('should allow owner GRANTOR to update grant', async () => {
    const res = await request(app)
      .put(`/api/grants/${testGrantId}`)
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ title: 'Updated Grant Title', description: 'Updated', amount: 75000 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Grant Title');
  });

  it('should deny different GRANTOR from updating grant (403)', async () => {
    const res = await request(app)
      .put(`/api/grants/${testGrantId}`)
      .set('Authorization', `Bearer ${grantorBToken}`)
      .send({ title: 'Stolen Grant', description: 'Stolen', amount: 1000 });

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent grant', async () => {
    const res = await request(app)
      .put('/api/grants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ title: 'Ghost', description: 'Ghost', amount: 1000 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/grants/:grantId', () => {
  it('should deny different GRANTOR from deleting grant (403)', async () => {
    const res = await request(app)
      .delete(`/api/grants/${testGrantId}`)
      .set('Authorization', `Bearer ${grantorBToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow owner GRANTOR to delete grant', async () => {
    const grant = await Grant.create({
      title: 'To Delete',
      description: 'Will be deleted',
      amount: 1000,
      grantor_id: grantorUser.id,
    });

    const res = await request(app)
      .delete(`/api/grants/${grant.id}`)
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 for non-existent grant on delete', async () => {
    const res = await request(app)
      .delete('/api/grants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(404);
  });
});

describe('POST /api/grants/:grantId/apply', () => {
  it('should allow GRANTEE to apply for a grant', async () => {
    const res = await request(app)
      .post(`/api/grants/${testGrantId}/apply`)
      .set('Authorization', `Bearer ${granteeToken}`)
      .send({ proposal: 'My detailed proposal for funding...' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.grant_id).toBe(testGrantId);
    expect(res.body.grantee_id).toBe(granteeUser.id);
  });

  it('should return 409 if GRANTEE applies twice', async () => {
    const res = await request(app)
      .post(`/api/grants/${testGrantId}/apply`)
      .set('Authorization', `Bearer ${granteeToken}`)
      .send({ proposal: 'Duplicate application' });

    expect(res.status).toBe(409);
  });

  it('should return 403 if GRANTOR tries to apply', async () => {
    const res = await request(app)
      .post(`/api/grants/${testGrantId}/apply`)
      .set('Authorization', `Bearer ${grantorToken}`)
      .send({ proposal: 'Grantor applying' });

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent grant', async () => {
    const res = await request(app)
      .post('/api/grants/00000000-0000-0000-0000-000000000000/apply')
      .set('Authorization', `Bearer ${granteeToken}`)
      .send({ proposal: 'Ghost grant' });

    expect(res.status).toBe(404);
  });

  it('should return 400 if grant is closed', async () => {
    const closedGrant = await Grant.create({
      title: 'Closed Grant',
      description: 'Closed',
      amount: 5000,
      status: 'CLOSED',
      grantor_id: grantorUser.id,
    });

    const newGrantee = await User.create({ name: 'New Grantee', email: 'newgrantee@test.com', password: 'pass123' });
    const newGranteeToken = generateToken(newGrantee.id, ['GRANTEE']);

    const res = await request(app)
      .post(`/api/grants/${closedGrant.id}/apply`)
      .set('Authorization', `Bearer ${newGranteeToken}`)
      .send({ proposal: 'Applying to closed grant' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if proposal is missing', async () => {
    const grant = await Grant.create({
      title: 'New Grant',
      description: 'Open',
      amount: 3000,
      grantor_id: grantorUser.id,
    });

    const res = await request(app)
      .post(`/api/grants/${grant.id}/apply`)
      .set('Authorization', `Bearer ${granteeToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /api/grants/:grantId/applications', () => {
  it('should allow grant owner GRANTOR to see applications', async () => {
    const res = await request(app)
      .get(`/api/grants/${testGrantId}/applications`)
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should deny different GRANTOR from viewing applications (403)', async () => {
    const res = await request(app)
      .get(`/api/grants/${testGrantId}/applications`)
      .set('Authorization', `Bearer ${grantorBToken}`);

    expect(res.status).toBe(403);
  });

  it('should deny GRANTEE from viewing grant applications (403)', async () => {
    const res = await request(app)
      .get(`/api/grants/${testGrantId}/applications`)
      .set('Authorization', `Bearer ${granteeToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent grant applications', async () => {
    const res = await request(app)
      .get('/api/grants/00000000-0000-0000-0000-000000000000/applications')
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(404);
  });
});
