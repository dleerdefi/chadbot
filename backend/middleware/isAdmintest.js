const { expect } = require('chai');
const sinon = require('sinon');
const isAdmin = require('./isAdmin');

describe('isAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: '123' } };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    next = sinon.spy();
  });

  it('should call next() for admin users', async () => {
    req.user.isAdmin = true;
    await isAdmin(req, res, next);
    expect(next.calledOnce).to.be.true;
  });

  it('should return 403 for non-admin users', async () => {
    req.user.isAdmin = false;
    await isAdmin(req, res, next);
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ error: 'Access denied. Admin privileges required.' })).to.be.true;
    expect(next.called).to.be.false;
  });

  it('should return 403 when no user object is present', async () => {
    req.user = null;
    await isAdmin(req, res, next);
    expect(res.status.calledWith(403)).to.be.true;
    expect(res.json.calledWith({ error: 'Access denied. Authentication required.' })).to.be.true;
    expect(next.called).to.be.false;
  });

  // Add more tests as needed, e.g., for Redis caching scenarios
});