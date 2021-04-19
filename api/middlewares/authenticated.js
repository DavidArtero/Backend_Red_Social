'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret= 'clave_secreta_red_social';

exports.ensureAuth = function(req, res, next){
    
    if(!req.headers.authorization){
        res.status(403).send({message: 'La petición no tiene la cabecera de autentificación'});
    };

    //Limpiar token (quitar comillas etc)
    var token = req.headers.authorization.replace(/['"]+/g,'');
    //console.log("token->" ,token);

    //Decodificar código
    try{
        var payload = jwt.decode(token, secret);
        
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'El token ha expirado'});
        }

    }catch(ex){
        return res.status(404).send({
            message: 'El token no es vàlido'});
    }
    
    req.user = payload;

    next();
}