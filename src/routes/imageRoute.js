const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadNormalImageController, uploadChallengeImageController, updateChallengeImageStatus } = require('../controllers/imageController');
const router = express.Router();
const uploadToS3 = require('../services/imageService');

const storage = multer.memoryStorage();

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

router.post('/upload', (req, res) => {
    // #swagger.tags = ['Image']
    // #swagger.description = 'Upload a normal image.'
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload error.' });
        }
        uploadNormalImageController(req, res);
    });
});

router.post('/mission/upload', (req, res) => {
    // #swagger.tags = ['Image']
    // #swagger.description = 'Upload a challenge image.'
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: 'File upload error.' });
        }
        uploadChallengeImageController(req, res);
    });
});

router.post('/mission/confirm', (req, res) => {
    // #swagger.tags = ['Image']
    // #swagger.description = 'Update the status of a challenge image.'
    updateChallengeImageStatus(req, res);
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