var express = require('express');
var router = express.Router();

let middle = require('../middleware/middle');
let introController = require('../controller/introController');

router.get('/', middle.checkAdminLogin, introController.getAllIntro);

router.get('/using', middle.checkAdminLogin, introController.getIntroUsing);

router.get('/not-use', middle.checkAdminLogin, introController.getIntroNotUse);

router.get('/add-intro',middle.checkAdminLogin, introController.getAddIntro);

router.post('/save-add-intro',middle.checkAdminLogin, introController.postAddIntro);

router.post('/update-intro/:id',middle.checkAdminLogin, introController.postUpdateIntro);

router.get('/delete-intro/:id',middle.checkAdminLogin, introController.deleteIntro);

module.exports = router;
