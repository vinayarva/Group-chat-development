const express = require('express');
const multer = require('multer');
const upload = multer();
const chatsControllers = require('../controllers/chat-app');
const userAuth = require('../middleware/auth');

const router = express.Router();
module.exports = (io) => {
    router.post('/add-chats' , userAuth.authenticate, chatsControllers.postMessages(io));
    router.get('/get-chats' , userAuth.authenticate, chatsControllers.getAllMessages );
    router.post('/uploadFile' , userAuth.authenticate , upload.single('myFile') , chatsControllers.uploadFile(io));

    return router ;
}