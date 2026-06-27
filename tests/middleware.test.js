const { authenticate, authorize } = require('../src/middleware/auth');
const { generateToken } = require('../src/utils/jwt');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  it('should call next() with valid token', () => {
    const token = generateToken('user-id', ['GRANTEE']);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toHaveProperty('userId', 'user-id');
  });

  it('should return 401 when no authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is malformed', () => {
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when Bearer prefix is missing', () => {
    const token = generateToken('user-id', ['GRANTEE']);
    const req = { headers: { authorization: token } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('authorize middleware', () => {
  it('should call next() when user has required role', () => {
    const req = { user: { userId: 'user-id', roles: ['GRANTOR'] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('GRANTOR')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 when user lacks required role', () => {
    const req = { user: { userId: 'user-id', roles: ['GRANTEE'] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('GRANTOR')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when req.user is missing', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    authorize('ADMIN')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should allow user with one of multiple roles', () => {
    const req = { user: { userId: 'user-id', roles: ['ADMIN'] } };
    const res = mockRes();
    const next = jest.fn();

    authorize('GRANTOR', 'ADMIN')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
