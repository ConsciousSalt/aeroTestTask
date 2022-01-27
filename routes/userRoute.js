const express = require('express');
const bodyParser = require('body-parser');
const appUtil = require('../model/appUtil');
const userController = require('../controllers/user');

const router = express.Router();


router.route('/signup').post(bodyParser.json(), userController.checkUserId,
    userController.checkVacantID,
    userController.checkUserPassword,
    userController.encodePassword,
    userController.populateUserWithDBData,
    userController.signupUser);

router.route('/signin').post(bodyParser.json(), userController.checkUserId,
    userController.checkUserPassword,
    userController.populateUserWithDBData,
    userController.signinUser);

router.route('/signin/new_token').post(bodyParser.json(), userController.verifyRefreshToken, userController.refreshAccessToken);

router.route('/info').get(userController.getBearerFromHeader, userController.verifyAccessToken, userController.getUserInfo);

router.route('/logout').get(userController.getBearerFromHeader, userController.verifyAccessToken, userController.logoutUser);

module.exports = router;