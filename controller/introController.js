let uniqid = require('uniqid');
let fs = require('fs');

let New = require('../model/New');

module.exports.getAllIntro = async (req, res) => {
    await New.find({}).then((data) => {
        res.render('introduce/Introduces', {layout: 'temp/index', title: "Bảng tin", err: false, data:data.reverse()})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getIntroUsing = async (req, res) => {
    await New.find({status:true}).then((data) => {
        res.render('introduce/Introduces', {layout: 'temp/index', title: "Những tin đang sử dụng", err: false, data:data.reverse()})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getIntroNotUse = async (req, res) => {
    await New.find({status:false}).then((data) => {
        res.render('introduce/Introduces', {layout: 'temp/index', title: "Những tin không sử dụng", err: false, data:data.reverse()})
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    })
}

module.exports.getAddIntro = (req, res) => {
    res.render('introduce/addIntro', {layout: 'temp/index', title: 'Thêm tin tức', err: false});
}

module.exports.postAddIntro = (req, res) => {
    let {title, description} = req.body;
    let image = req.files.image;
    let filename = "intro/" + uniqid() + "-" + image.name;
    image.mv(`./uploads/${filename}`);
    image = filename;
    let addIntro = new New({title, description, image});
    addIntro.save().then(() => {
        res.redirect('/introduces');
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}

module.exports.postUpdateIntro = async (req, res) => {
    let id = req.params.id;
    await New.findById(id).then(async (intro) => {
        let {title, description, status} = req.body;
        let image = intro.image;
        if (req.files) {
            image = req.files.image;
            if (intro.image != ""){
                fs.unlinkSync(`./uploads/${intro.image}`);
            }
            let filename = "intro/" + uniqid() + "-" + image.name;
            image.mv(`./uploads/${filename}`);
            image = filename;
        }
        await New.findOneAndUpdate({_id: id}, {
            $set: {
                title, description, image, status
            }
        }, {new: true}).then(() => {
            res.redirect('/introduces');
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

module.exports.deleteIntro = async (req, res) => {
    let id = req.params.id;
    await New.findByIdAndDelete({_id: id}).then((intro) => {
        if (intro.image != ""){
            fs.unlinkSync(`./uploads/${intro.image}`);
        }
        res.redirect('/introduces');
    }, (err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    }).catch((err) => {
        res.render('error/404', {layout: 'temp/index', title: "Có lỗi xảy ra !", err: true, message: err})
    });
}
