jest.mock('../../models/sub', () => {
  const { mockModelConstructor, makeExec, makeQuery } = require('../helpers/controller');
  const Mock = mockModelConstructor();
  Mock.find = jest.fn(() => makeQuery([]));
  Mock.findOne = jest.fn(() => makeExec(null));
  Mock.findOneAndUpdate = jest.fn();
  Mock.findOneAndDelete = jest.fn();
  return Mock;
});

jest.mock('../../models/product', () => {
  const { makeQuery } = require('../helpers/controller');
  return { find: jest.fn(() => makeQuery([])) };
});

const Sub = require('../../models/sub');
const Product = require('../../models/product');
const { mockRes, makeExec, makeQuery } = require('../helpers/controller');
const sub = require('../../controllers/sub');

beforeEach(() => {
  Sub.mockClear();
  Sub.mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Sub.find.mockImplementation(() => makeQuery([]));
  Sub.findOne.mockImplementation(() => makeExec(null));
  Sub.findOneAndUpdate.mockReset();
  Sub.findOneAndDelete.mockReset();
  Product.find.mockImplementation(() => makeQuery([]));
});

describe('controllers/sub.js', () => {
  describe('create', () => {
    it('saves name, parent, and slug', async () => {
      const res = mockRes();
      await sub.create(
        { body: { name: 'Smartphones', parent: 'cat1' } },
        res,
      );

      expect(Sub).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Smartphones',
          parent: 'cat1',
          slug: 'Smartphones',
        }),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 400 when save fails', async () => {
      Sub.mockImplementationOnce(function (doc) {
        Object.assign(this, doc);
        this.save = jest.fn().mockRejectedValue(new Error('fail'));
      });
      const res = mockRes();
      await sub.create({ body: { name: 'X', parent: 'p' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Sub Category failed');
    });
  });

  describe('list', () => {
    it('returns all subs', async () => {
      const docs = [{ name: 'A' }];
      Sub.find.mockImplementation(() => makeQuery(docs));
      const res = mockRes();
      await sub.list({}, res);
      expect(res.json).toHaveBeenCalledWith(docs);
    });
  });

  describe('read', () => {
    it('returns sub and matching products', async () => {
      const doc = { _id: 's1', slug: 'phones' };
      Sub.findOne.mockImplementation(() => makeExec(doc));
      const products = [{ title: 'P' }];
      Product.find.mockImplementation(() => makeQuery(products));

      const res = mockRes();
      await sub.read({ params: { slug: 'phones' } }, res);

      expect(res.json).toHaveBeenCalledWith({ sub: doc, products });
    });
  });

  describe('update', () => {
    it('updates name, parent, and slug', async () => {
      const updated = { name: 'New', parent: 'p2', slug: 'New' };
      Sub.findOneAndUpdate.mockResolvedValue(updated);
      const res = mockRes();
      await sub.update(
        { params: { slug: 'old' }, body: { name: 'New', parent: 'p2' } },
        res,
      );
      expect(Sub.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'old' },
        { name: 'New', parent: 'p2', slug: 'New' },
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('returns 400 on failure', async () => {
      Sub.findOneAndUpdate.mockRejectedValue(new Error('fail'));
      const res = mockRes();
      await sub.update(
        { params: { slug: 'old' }, body: { name: 'N', parent: 'p' } },
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('remove', () => {
    it('deletes by slug', async () => {
      const deleted = { slug: 'gone' };
      Sub.findOneAndDelete.mockResolvedValue(deleted);
      const res = mockRes();
      await sub.remove({ params: { slug: 'gone' } }, res);
      expect(res.json).toHaveBeenCalledWith(deleted);
    });

    it('returns 400 on failure', async () => {
      Sub.findOneAndDelete.mockRejectedValue(new Error('fail'));
      const res = mockRes();
      await sub.remove({ params: { slug: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
