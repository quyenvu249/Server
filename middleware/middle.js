let jwt = require('jsonwebtoken');
let User = require('../model/User');

module.exports.checkLogin = (req, res, next) => {
    if (req.headers.authorization) {
        jwt.verify(req.headers.authorization, 'duan', (err, decoded) => {
           if (err) {
               res.json({success: false, message: err})
               return;
           } else if (decoded){
               req.user = decoded;
               next();
           }
        });
    } else {
        res.json({success: false, message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập lại'});
    }
}
module.exports.checkAdminLogin = async (req, res, next) => {
    if (req.cookies.id) {
       let user = await User.findOne({_id:req.cookies.id});
       if (user && user.role == "Admin"){
           res.locals.img = user.avatar;
           next();
       } else {
           res.redirect('/login');
       }
    } else {
        res.redirect('/login');
    }
}
