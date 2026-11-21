const express = require('express')

const router = express.Router();

// middleWares

const {requireAuth,requireAdmin} = require('../middlewares/jwt')

// controller
const {upload,remove} = require('../controllers/cloudinary');



//routes
router.post('/uploadimages',requireAuth,requireAdmin,upload);
router.post('/removeimages',requireAuth,requireAdmin,remove);

module.exports = router;