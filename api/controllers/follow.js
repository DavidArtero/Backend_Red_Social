'use strict'

var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');


function prueba(req,res){
    res.status(200).send({message: 'Hola desde el controlador follows'});
}

module.exports = {
    prueba
}

