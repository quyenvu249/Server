let md5 = require('md5');
let uniqid = require('uniqid');
let fs = require('fs');

let Vehicle = require('../model/Vehicle');
let User = require('../model/User');
let Schedule = require('../model/Schedule');
let apiController = require('../controller/apiController')

module.exports.postLogin = async (req, res) => {
    let phoneNumber = req.body.phoneNumber;
    if (phoneNumber.charAt(0) == 0) {
        phoneNumber = `+84${phoneNumber.substring(1, phoneNumber.length)}`
    }
    await User.findOne({phoneNumber}).then((user) => {
        if (!user) {
            res.render('login', {
                err: true,
                message: `Tài khoản không tồn tại`,
                layout: 'temp/default',
                title: 'Đăng nhập'
            });
            return;
        }
        let passWord = md5(req.body.passWord);
        if (passWord != user.passWord) {
            res.render('login', {
                err: true,
                message: `Mật khẩu không chính xác`,
                layout: 'temp/default',
                title: 'Đăng nhập'
            });
            return;
        }
        if (user.role != "Admin") {
            res.render('login', {
                err: true,
                message: `Bạn không phải Admin`,
                layout: 'temp/default',
                title: 'Đăng nhập'
            });
            return;
        }
        res.cookie("id", user._id);
        res.redirect('/users');
    }, (err) => {
        res.render('error/500', {err: true, message: err, layout: 'temp/default', title: 'Có lỗi xảy ra !'});
    }).catch((err) => {
        res.render('error/500', {err: true, message: err, layout: 'temp/default', title: 'Có lỗi xảy ra !'});
    });
}

module.exports.getLogin = function (req, res) {
    res.clearCookie('id');
    res.render('login', {layout: 'temp/default', title: 'Đăng nhập', err: false});
}

module.exports.logOut = function (req, res) {
    res.clearCookie('id');
    res.redirect('/login');
}

module.exports.getAllUser = async (req, res) => {
    await User.find({}).then((data) => {
        res.render('user/users', {layout: 'temp/index', title: "Danh sách người dùng", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getAllCustomer = async (req, res) => {
    await User.find({role: 'Customer'}).then((data) => {
        res.render('user/users', {layout: 'temp/index', title: "Danh sách người dùng", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getAllStaff = async (req, res) => {
    await User.find({role: 'Staff'}).then((data) => {
        res.render('user/users', {layout: 'temp/index', title: "Danh sách người dùng", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getVehicleUser = async (req, res) => {
    let id = req.params.id;
    await Vehicle.find({idUser: id}).then((data) => {
        res.render('user/vehicles', {layout: 'temp/index', title: "Danh sách xe", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getAddUser = function (req, res) {
    res.render('user/addUser', {layout: 'temp/index', title: 'Thêm nhân viên', err: false});
}

module.exports.postAddUser = async (req, res) => {
    let phoneNumber = req.body.phoneNumber;
    let user = await User.findOne({phoneNumber});
    if (user) {
        res.render('user/addUser', {
            layout: 'temp/index',
            title: 'Thêm nhân viên',
            err: true,
            message: `Số điện thoại đã được đăng kí`
        });
        return;
    }
    if (phoneNumber.charAt(0) == 0) {
        phoneNumber = `+84${phoneNumber.substring(1, phoneNumber.length)}`
    }
    let passWord = md5("123456");
    let fullName = req.body.fullName;
    let address = req.body.address;
    let add = new User({phoneNumber, passWord, fullName, address, role: "Staff"});
    add.save().then(() => {
        res.redirect('/users')
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.deleteUser = async (req, res) => {
    let id = req.params.id;
    await User.findByIdAndDelete({_id: id}).then((user) => {
        try {
            if (user.avatar != 'images/img.png') {
                fs.unlinkSync(`./uploads/${user.avatar}`);
            }
        } catch (e) {
            console.log(e)
        }
        res.redirect('/users');
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.getUpdateUser = async (req, res) => {
    let id = req.params.id;
    await User.findById(id).then((user) => {
        res.render('user/updateUser', {layout: 'temp/index', title: 'Cập nhật thông tin', err: false, data: user});
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.updateVehicleUser = async (req, res) => {
    let {name, type, license, color} = req.body;
    await Vehicle.findOneAndUpdate({_id: req.params.id}, {
        $set: {
            name,
            type,
            license,
            color, brand
        }
    }, {new: true}).then((vehicle) => {
        res.redirect(`/users/${vehicle.idUser}/vehicles`);
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.deleteVehicleUser = async (req, res) => {
    await Vehicle.findOneAndDelete({_id: req.params.id}).then((del) => {
        res.redirect(`/users/${del.idUser}/vehicles`);
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.postUpdateUser = async (req, res) => {
    let id = req.params.id;
    await User.findById(id).then(async (user) => {
        let {phoneNumber, fullName, address, role} = req.body;
        if (phoneNumber.charAt(0) == 0) {
            phoneNumber = `+84${phoneNumber.substring(1, phoneNumber.length)}`
        }
        if (phoneNumber != user.phoneNumber) {
            let checkPhone = await User.findOne({phoneNumber});
            if (checkPhone) {
                res.render('user/updateUser', {
                    layout: 'temp/index',
                    title: 'Cập nhật thông tin',
                    err: true,
                    message: 'Số điện thoại đã đăng kí',
                    data: user
                });
                return;
            }
        }
        let avatar = user.avatar;
        if (req.files) {
            try {
                if (user.avatar != 'images/img.png') {
                    fs.unlinkSync(`./uploads/${user.avatar}`);
                }
            } catch (e) {
                console.log(e)
            }

            avatar = req.files.avatar;
            let filename = "user/" + uniqid() + "-" + avatar.name;
            avatar.mv(`./uploads/${filename}`);
            avatar = filename;
        }
        await User.findOneAndUpdate({_id: id}, {
            $set: {
                phoneNumber, fullName, address, role, avatar
            }
        }, {new: true}).then(() => {
            res.redirect('/users');
        }, (err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        }).catch((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        });
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.getSchedules = async (req, res) => {
    let status = req.query.status == undefined ? "" : req.query.status;
    await Schedule.find({status: new RegExp(status, 'i')}).populate('idUser').populate('vehicle').populate('services').then((data) => {
        res.render('schedule/schedules', {layout: 'temp/index', title: "Danh sách đặt lịch", err: false, data})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}
module.exports.confirm = async (req, res) => {
    let perform = req.query.perform;
    if (perform == "Confirm") {
        let user = await User.findById(req.cookies.id);
        if (!user) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'
            })
            return
        }
        let schedule = await Schedule.findById(req.query.id).populate('idUser');
        if (!schedule) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'
            })
            return
        }
        if (schedule.status != 'Pending') {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Lịch này đã được xác nhận hoặc đã hoàn thành'
            })
            return
        }
        let timeConfirm = new Date();
        await Schedule.findOneAndUpdate({_id: schedule._id}, {
            $set: {
                status: 'Confirmed',
                timeConfirm,
                idStaffConfirm: user._id
            }
        }, {new: true}).then((schedu) => {
            apiController.notify('Thông báo', 'Lịch của bạn đang được tiến hành', schedule.idUser.tokenDevice)
            apiController.addNotify(`Lịch của bạn đang được thực hiện`, schedu.idUser, schedu._id)
            res.redirect('/schedules?status=Pending')
        }, (err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        }).then((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })
    } else if (perform == "Cancel") {
        let user = await User.findById(req.cookies.id);
        if (!user) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'
            })
            return
        }
        let schedule = await Schedule.findById(req.query.id);
        if (!schedule) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'
            })
            return
        }
        if (schedule.status != 'Pending') {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Lịch này đã được xác nhận hoặc đã hoàn thành'
            })
            return
        }
        let note = req.body.note;
        await Schedule.findOneAndUpdate({_id: schedule._id}, {
            $set: {
                status: 'Cancelled',
                idStaffConfirm: user._id,
                timeConfirm: new Date(),
                note
            }
        }, {new: true}).then((schedu) => {
            apiController.addNotify(`Lịch của bạn đã bị hủy`, schedu.idUser, schedu._id)
            res.redirect('/schedules?status=Pending')
        }, (err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        }).then((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })
    } else if (perform == "Complete") {
        let user = await User.findById(req.cookies.id);
        if (!user) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không nhận dạng được người dùng. Vui lòng đăng nhập lại!'
            })
            return
        }
        let schedule = await Schedule.findById(req.query.id);
        if (!schedule) {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Không tìm thấy lịch đặt. Vui lòng thử lại!'
            })
            return
        }
        if (schedule.status != 'Confirmed') {
            res.render('error/404', {
                layout: 'temp/index',
                title: "Có lỗi xảy ra !",
                err: true,
                message: 'Lịch này đã được xác nhận hoặc đã hoàn thành'
            })
            return
        }
        await Schedule.findOneAndUpdate({_id: schedule._id}, {
            $set: {
                status: 'Completed'
            }
        }, {new: true}).then((schedu) => {
            apiController.addNotify(`Dịch vụ của bạn đã hoàn thành`, schedu.idUser, schedu._id)
            res.redirect('/schedules?status=Confirmed')
        }, (err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        }).then((err) => {
            res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
        })
    }
}
