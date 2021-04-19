'use strict'

//Mongoose
var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

//Conexión a MongoDb
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/mean_social', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(()=>{
        console.log("Conexión a la BD realizada correctamente");

        //Crear servidor
        app.listen(port,()=>{
            console.log("Servidor corriendo en http://localhost:3800");
        });
    })
    .catch(err=>console.log(err));

    
