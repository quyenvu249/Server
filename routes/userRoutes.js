var express = require('express');
var router = express.Router();

let middle = require('../middleware/middle');
let userController = require('../controller/userController');

router.get('/',middle.checkAdminLogin, userController.getAllUser);

router.get('/staff',middle.checkAdminLogin, userController.getAllStaff);

router.get('/customer',middle.checkAdminLogin, userController.getAllCustomer);

router.get('/:id/vehicles',middle.checkAdminLogin, userController.getVehicleUser);

router.get('/add-user',middle.checkAdminLogin, userController.getAddUser);

router.post('/save-add-user',middle.checkAdminLogin, userController.postAddUser);

router.get('/delete-user/:id',middle.checkAdminLogin, userController.deleteUser);

router.get('/update-user/:id',middle.checkAdminLogin, userController.getUpdateUser);

router.post('/update-user/:id',middle.checkAdminLogin, userController.postUpdateUser);

router.post('/vehicle/:id/update',middle.checkAdminLogin, userController.updateVehicleUser);

router.get('/vehicle/:id/delete',middle.checkAdminLogin, userController.deleteVehicleUser);

module.exports = router;
