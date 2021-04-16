let mongosee = require('mongoose');
let newSchema = new mongosee.Schema({
    image:{
        type:String,
        required:true
    },
    title: {
        type:String,
        required:true
    },
    status: {
        type:Boolean,
        required:true,
        default: false
    },
    description: {
        type:String,
        required:true
    }
})
module.exports = mongosee.model('New', newSchema,'new');
