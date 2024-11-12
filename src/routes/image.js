const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadPhotoController } = require('../controllers/imageController');
const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// 파일 검증 미들웨어
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Invalid file type');
        error.code = 'INVALID_FILE_TYPE';
        return cb(error, false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});

router.post('/upload', upload.single('image'), (req, res, next) => {
    uploadPhotoController(req, res).catch(next);
});

// 에러 핸들링
router.use((err, req, res, next) => {
    if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ message: 'Invalid file type' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size is too large' });
    }
    res.status(500).json({ message: 'Internal server error' });
});


module.exports = router;