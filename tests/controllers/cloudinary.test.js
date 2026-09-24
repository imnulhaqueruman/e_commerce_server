jest.mock('cloudinary', () => ({
  config: jest.fn(),
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn(),
  },
}));

const cloudinary = require('cloudinary');
const { mockRes } = require('../helpers/controller');
const ctrl = require('../../controllers/cloudinary');

beforeEach(() => {
  cloudinary.uploader.upload.mockReset();
  cloudinary.uploader.destroy.mockReset();
});

describe('controllers/cloudinary.js', () => {
  describe('upload', () => {
    it('uploads base64 image and returns public_id + url', async () => {
      cloudinary.uploader.upload.mockResolvedValue({
        public_id: '123',
        secure_url: 'https://cdn.example/img.png',
      });

      const res = mockRes();
      await ctrl.upload({ body: { image: 'data:image/png;base64,abc' } }, res);

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'data:image/png;base64,abc',
        expect.objectContaining({ resource_type: 'auto' }),
      );
      expect(res.json).toHaveBeenCalledWith({
        public_id: '123',
        url: 'https://cdn.example/img.png',
      });
    });
  });

  describe('remove', () => {
    it('destroys by public_id and sends ok', () => {
      cloudinary.uploader.destroy.mockImplementation((_id, cb) =>
        cb(null, { result: 'ok' }),
      );
      const res = mockRes();
      ctrl.remove({ body: { public_id: 'img_1' } }, res);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'img_1',
        expect.any(Function),
      );
      expect(res.send).toHaveBeenCalledWith('ok');
    });

    it('returns soft-failure json when destroy errors', () => {
      cloudinary.uploader.destroy.mockImplementation((_id, cb) =>
        cb(new Error('gone'), null),
      );
      const res = mockRes();
      ctrl.remove({ body: { public_id: 'img_1' } }, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        err: expect.any(Error),
      });
    });
  });
});
