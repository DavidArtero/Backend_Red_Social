'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Entidad o Schema
var FollowSchema = Schema({
    user: { type: Schema.ObjectId, ref:'User' },
    followed: { type: Schema.ObjectId, ref:'User' }
});


//Exportar modelo (indicar esquema)
module.exports = mongoose.model('Follow', FollowSchema);