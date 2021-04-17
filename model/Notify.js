let mongosee = require('mongoose');
let notifySchema = new mongosee.Schema({
    status:{
        type:Boolean,
        required:true,
        default:true
    },
    title: {
        type:String,
        required:true
    },
    user: {
        type:String,
        required:true
    },
    time: {
        type:Date,
        required:true
    },
    schedule: {
        type: String,
        required:true
    }
})
module.exports = mongosee.model('Notify', notifySchema,'notify');