'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Entidad o Schema
var MessageSchema = Schema({
    text: String,
    created_at: String,
    emmiter: { type: Schema.ObjectId, ref:'User' },
    receiver: { type: Schema.ObjectId, ref:'User' }
});


//Exportar modelo (indicar esquema)
module.exports = mongoose.model('Message', MessageSchema);