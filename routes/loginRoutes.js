var express = require('express');
var router = express.Router();

let userController = require('../controller/userController');

router.get('/', (req, res) => { res.redirect('/login') });

router.get('/login', userController.getLogin);

router.post('/login', userController.postLogin);

router.get('/logOut', userController.logOut);

module.exports = router;
