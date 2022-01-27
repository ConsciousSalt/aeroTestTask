const express = require('express');
const multer = require('multer');
const fileController = require('./../controllers/file');
const userController = require('./../controllers/user');
const upload = multer({ dest: 'upload/' });
const router = express.Router();

router.route('/list').get(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    fileController.getFilesList);
    
router.route('/upload').post(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    upload.single('uploadFile'),
    fileController.populateFileWithDBData,
    fileController.uploadFile)

router.route('/:id').get(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    fileController.checkID,
    fileController.getFileinfo);

router.route('/download/:id').get(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    fileController.checkID,
    fileController.downloadFile);

router.route('/update/:id').put(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    fileController.checkID,
    upload.single('uploadFile'),
    fileController.populateFileWithDBData,
    fileController.updateFile);

router.route('/delete/:id').delete(userController.getBearerFromHeader,
    userController.verifyAccessToken,
    fileController.checkID,
    fileController.deleteFile);

module.exports = router;