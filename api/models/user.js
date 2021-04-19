'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Entidad o Schema
var UserSchema = Schema({
    name: String,
    surname: String,
    nick: String,
    email: String,
    password: String,
    role: String,
    image: String
});


//Exportar modelo (indicar esquema)
module.exports = mongoose.model('User', UserSchema);