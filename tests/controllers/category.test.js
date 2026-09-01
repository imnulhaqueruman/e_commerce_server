jest.mock('../../models/category', () => {
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
  return {
    find: jest.fn(() => makeQuery([])),
  };
});

jest.mock('../../models/sub', () => ({
  find: jest.fn(() => ({
    exec: jest.fn((cb) => cb(null, [])),
  })),
}));

const Category = require('../../models/category');
const Product = require('../../models/product');
const Sub = require('../../models/sub');
const { mockRes, makeExec, makeQuery } = require('../helpers/controller');
const category = require('../../controllers/category');

beforeEach(() => {
  Category.mockClear();
  Category.mockImplementation(function (doc) {
    Object.assign(this, doc);
    this.save = jest.fn().mockResolvedValue(this);
  });
  Category.find.mockImplementation(() => makeQuery([]));
  Category.findOne.mockImplementation(() => makeExec(null));
  Category.findOneAndUpdate.mockReset();
  Category.findOneAndDelete.mockReset();
  Product.find.mockImplementation(() => makeQuery([]));
});

describe('controllers/category.js', () => {
  describe('create', () => {
    it('slugifies name and saves', async () => {
      const res = mockRes();
      await category.create({ body: { name: 'Laptops & PCs' } }, res);

      expect(Category).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Laptops & PCs', slug: 'Laptops-and-PCs' }),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 400 when save fails', async () => {
      Category.mockImplementationOnce(function (doc) {
        Object.assign(this, doc);
        this.save = jest.fn().mockRejectedValue(new Error('dup'));
      });
      const res = mockRes();
      await category.create({ body: { name: 'Dup' } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Create Category failed');
    });
  });

  describe('list', () => {
    it('returns categories newest first', async () => {
      const docs = [{ name: 'A' }];
      Category.find.mockImplementation(() => makeQuery(docs));
      const res = mockRes();
      await category.list({}, res);
      expect(res.json).toHaveBeenCalledWith(docs);
    });
  });

  describe('read', () => {
    it('returns category and its products', async () => {
      const cat = { _id: 'c1', slug: 'phones' };
      Category.findOne.mockImplementation(() => makeExec(cat));
      const products = [{ title: 'X' }];
      Product.find.mockImplementation(() => makeQuery(products));

      const res = mockRes();
      await category.read({ params: { slug: 'phones' } }, res);

      expect(Category.findOne).toHaveBeenCalledWith({ slug: 'phones' });
      expect(res.json).toHaveBeenCalledWith({ category: cat, products });
    });
  });

  describe('update', () => {
    it('updates name and regenerates slug', async () => {
      const updated = { name: 'New', slug: 'New' };
      Category.findOneAndUpdate.mockResolvedValue(updated);

      const res = mockRes();
      await category.update(
        { params: { slug: 'old' }, body: { name: 'New' } },
        res,
      );

      expect(Category.findOneAndUpdate).toHaveBeenCalledWith(
        { slug: 'old' },
        { name: 'New', slug: 'New' },
        { new: true },
      );
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('returns 400 on failure', async () => {
      Category.findOneAndUpdate.mockRejectedValue(new Error('fail'));
      const res = mockRes();
      await category.update(
        { params: { slug: 'old' }, body: { name: 'New' } },
        res,
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Category Update failed');
    });
  });

  describe('remove', () => {
    it('deletes by slug', async () => {
      const deleted = { slug: 'gone' };
      Category.findOneAndDelete.mockResolvedValue(deleted);
      const res = mockRes();
      await category.remove({ params: { slug: 'gone' } }, res);
      expect(res.json).toHaveBeenCalledWith(deleted);
    });

    it('returns 400 on failure', async () => {
      Category.findOneAndDelete.mockRejectedValue(new Error('fail'));
      const res = mockRes();
      await category.remove({ params: { slug: 'x' } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getSubs', () => {
    it('lists subs for a parent category id', () => {
      const subs = [{ name: 'Android' }];
      Sub.find.mockImplementation(() => ({
        exec: (cb) => cb(null, subs),
      }));
      const res = mockRes();
      category.getSubs({ params: { _id: 'parent1' } }, res);
      expect(Sub.find).toHaveBeenCalledWith({ parent: 'parent1' });
      expect(res.json).toHaveBeenCalledWith(subs);
    });
  });
});
