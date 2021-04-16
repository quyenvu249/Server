var express = require('express');
var router = express.Router();

let middle = require('../middleware/middle');
let userController = require('../controller/userController');

router.get('/',middle.checkAdminLogin, userController.getSchedules);
router.post('/confirm',middle.checkAdminLogin, userController.confirm);

module.exports = router;
