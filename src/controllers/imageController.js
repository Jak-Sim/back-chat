const multer = require('multer');
const {
  saveChallengeImage,
  saveNormalImage,
  updateImageStatus,
  uploadToS3,
} = require('../services/imageService');

/**
 * @swagger
 * /image/upload:
 *   post:
 *     summary: 일반 채팅방에 이미지를 업로드합니다.
 *     tags:
 *       - Image
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: user ID
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *       - in: formData
 *         name: roomId
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImageResponse'
 *       '400':
 *         description: 필수 필드 누락 또는 파일 업로드 오류
 *       '500':
 *         description: 서버 오류
 */
const uploadNormalImageController = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.headers['user-id'];
  const file = req.file;

  if (!file || !roomId || !userId) {
    console.error('Missing required fields:', { roomId, userId, file });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const s3Url = await uploadToS3(req.file);
    req.file.s3Url = s3Url;
    const io = req.app.get('io');
    const result = await saveNormalImage(roomId, userId, s3Url, io);

    return res.status(200).json({
      success: true,
      imageUrl: s3Url,
      data: result,
    });
  } catch (error) {
    console.error('Error uploading normal photo:', error);
    return res.status(500).json({ message: 'Failed to upload photo' });
  }
};

/**
 * @swagger
 * /image/mission/upload:
 *   post:
 *     summary: 챌린지 채팅방에 이미지를 업로드합니다.
 *     tags:
 *       - Image
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *       - in: formData
 *         name: roomId
 *         type: string
 *         required: true
 *     responses:
 *       '200':
 *         description: 챌린지 이미지 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImageResponse'
 *       '400':
 *         description: 필수 필드 누락 또는 파일 업로드 오류
 *       '500':
 *         description: 서버 오류
 */
const uploadChallengeImageController = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.headers['user-id'];
  const file = req.file;

  if (!file || !roomId || !userId) {
    console.error('Missing required fields:', { roomId, userId, file });
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const s3Url = await uploadToS3(req.file);
    req.file.s3Url = s3Url;
    console.log('s3Url:', s3Url);
    const io = req.app.get('io');
    const result = await saveChallengeImage(roomId, userId, s3Url, io);

    return res.status(200).json({
      success: true,
      imageUrl: s3Url,
      data: result,
    });
  } catch (error) {
    console.error('Error uploading challenge photo:', error);
    return res.status(500).json({ message: 'Failed to upload challenge photo' });
  }
};

/**
 * @swagger
 * /image/mission/confirm:
 *   post:
 *     summary: 챌린지 이미지의 상태를 업데이트합니다.
 *     tags:
 *       - Image
 *     parameters:
 *       - in: header
 *         name: user-id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: 이미지 상태 업데이트 정보
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateImageStatusRequest'
 *     responses:
 *       '200':
 *         description: 이미지 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateImageStatusResponse'
 *       '400':
 *         description: 잘못된 요청 (필수 필드 누락 또는 유효하지 않은 상태값)
 *       '500':
 *         description: 서버 오류
 */
const updateChallengeImageStatus = async (req, res) => {
  const { imageId, status } = req.body;
  const userId = req.headers['user-id'];

  if (!imageId || !status || !['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  try {
    const result = await updateImageStatus(imageId, status, userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error updating challenge photo status:', error);
    return res.status(500).json({ message: 'Failed to update photo status' });
  }
};

module.exports = {
  uploadNormalImageController,
  uploadChallengeImageController,
  updateChallengeImageStatus,
};