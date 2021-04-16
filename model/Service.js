let mongosee = require('mongoose')
let serviceSchema = new mongosee.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
})
module.exports = mongosee.model('Service', serviceSchema, 'service');
