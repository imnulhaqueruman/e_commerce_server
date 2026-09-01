/**
 * Cloudinary upload/remove passthrough. Used by the admin product form
 * for image management.
 *
 * Required env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
 * `CLOUDINARY_API_SECRET`. If any are missing, `cloudinary.uploader.*`
 * calls will throw at request time — there is no preflight check.
 *
 * NOTE: this file is decoupled from multipart upload middleware; the
 * route handler is expected to have already parsed the body so
 * `req.body.image` is a base64 data-URL string (the `CloudinaryUpload`
 * component on the client side does that). If you switch to
 * `multer`-based file uploads, replace `req.body.image` with
 * `req.files.path`.
 */
const cloudinary = require('cloudinary');


//config

// Configured once at module load. Cloudinary SDK caches the credentials;
// rotating keys requires a process restart.
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})
// NOTE: the comment above describes a previous multer-based shape. The
// current handler expects `req.body.image` (base64 data URL) per the
// Cloudinary SDK's `cloudinary.uploader.upload(base64, …)` contract.

/**
 * POST /api/uploadimages (admin)
 * Body: `{ image }` — base64 data URL.
 * Returns `{ public_id, url }`. We key off `Date.now()` so concurrent
 * uploads on the same second collide; bump to a uuid if that becomes a
 * problem.
 *
 * `resource_type: 'auto'` lets Cloudinary detect images vs raw files,
 * but this API only ever uploads images today.
 */
// req.files.file.path
exports.upload = async (req,res) =>{
  let result = await cloudinary.uploader.upload(req.body.image,{
      public_id:`${Date.now()}`,
      resource_type:'auto',
  });
  res.json({
      public_id:result.public_id,
      url:result.secure_url,
  })
};
/**
 * POST /api/removeimages (admin)
 * Body: `{ public_id }` — the value returned from a prior `upload`.
 * Callback-style API because cloudinary@1 ships a callback signature
 * for `destroy`. Wraps the failure in `{ success: false, err }` rather
 * than an HTTP 4xx — the client treats that branch as a soft failure
 * (toast) rather than crashing the product form.
 */
exports.remove = (req,res) =>{
   let image_id =req.body.public_id

   cloudinary.uploader.destroy(image_id,(err,result) =>{
       if(err) return res.json({success:false,err});
       res.send('ok');
   })
}