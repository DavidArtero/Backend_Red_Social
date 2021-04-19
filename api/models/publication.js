'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Entidad o Schema
var PublicationSchema = Schema({
    text: String,
    file: String,
    created_at: String,
    user: { type:Schema.ObjectId, ref:'User' }//User es del tipo ObjectId y hace referencia a User
});


//Exportar modelo (indicar esquema)
module.exports = mongoose.model('Publication', PublicationSchema);