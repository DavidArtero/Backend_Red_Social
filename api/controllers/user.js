'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var fs= require('fs');
var path = require('path');



const { restart } = require('nodemon');
var User = require('../models/user');
var jwt = require('../services/jwt');
const Follow = require('../models/follow');
var Publication = require('../models/publication');
const user = require('../models/user');

//Métodos de pruebas
function home (req,res){
    res.status(200).send({
        message: 'Hola desde el servidor de NodeJS'
    });
    
};

function pruebas(req,res){
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
};

//Registro
function saveUser(req,res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname && params.nick && params.email && params.password){

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //Evitar duplicados
        User.find({ $or: [
                    {email: user.email.toLowerCase()},
                    {nick: user.nick.toLowerCase()}
            ]}).exec((err,users) => {
                if(err) return res.status(500).send({ message: 'Error en la petición de usuario'});
                if(users && users.length >= 1) {
                   return res.status(200).send({ message: 'El usuario ya existe' });
                }
                else{
                    //Codificar password y guardar en base de datos
                    bcrypt.hash(params.password, null, null, (err,hash)=>{
                        user.password = hash;
                        user.save((err, userStored) =>{
                            if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

                            if(userStored){
                                res.status(200).send({user: userStored});
                            }else{
                                res.status(404).send({message: 'No se ha registrado el usuario'});
                            }
                        });
                    });

                }
            });
    }else{
        res.status(200).send({
            message: 'Envía todos los campos necesarios'
        });
    }
}

//Login
function loginUser(req,res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email:email}, (err,user)=>{
        if(err) return res.status(500).send({meesage: 'Error en la petición'});

        if(user){
            bcrypt.compare(password, user.password, (err, check) =>{
                if(check){
                    
                    if(params.gettoken){    
                        //dgenerar y devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    }else{
                        //Devolver datos de usuario
                        user.password=undefined; //Quitamos el campo passowrd para no devolverlo en la respuesta
                        return res.status(200).send({user});
                    }


                   
                }else{
                    return res.status(404).send({meesage: 'El usuario no ha podido identificarse'});
                }
            });
        }else{
            return res.status(404).send({meesage: 'El usuario no ha podido identificarse correctamente'});
        }
    });

}

//Datos de un usuario
function getUser(req,res){
    var userId = req.params.id;

    User.findById(userId, (err, user)=>{
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!user) return res.status(404).send({message: 'El usuario no existe'});

        followThisUser(req.user.sub, userId).then((value) => {
            user.password = undefined;
            return res.status(200).send({
                user, 
                following: value.following, 
                followed: value.followed});
        })
              
    });
};

async function followThisUser(identity_user_id, user_id) {
    var following = await Follow.findOne({ "user": identity_user_id, "followed": user_id }).exec().then((follow) => {
        return follow;
    }).catch((err) => {
        return handleError(err);
    });
 
    var followed = await Follow.findOne({ "user": user_id, "followed": identity_user_id }).exec().then((follow) => {
        console.log(follow);
        return follow;
    }).catch((err) => {
        return handleError(err);
    });
 
 
    return {
        following: following,
        followed: followed
    }
}


//Devolver listado usuarios paginado   
function getUsers(req,res){
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 5;

    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total)=>{
        if(err) return res.status(500).send({message: 'Error en la petición'})
        
        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

        followUserIds(identity_user_id).then((value) => {
                        
            return res.status(200).send({
                users,  
                users_following: value.following,
                users_follow_me: value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        });

      
    });
}


async function followUserIds(user_id){
    var following = await Follow.find({"user": user_id}).select({'_id': 0, '__uv': 0, 'user': 0}).exec().then((follows)=>{    
    var follows_clean=[];
    
    follows.forEach((follow)=>{
    follows_clean.push(follow.followed);
    });
    
    console.log("follows_clean", follows_clean);
    return follows_clean;
    }).catch((err)=>{
    return handleerror(err);
    });
    
    var followed = await Follow.find({"followed": user_id}).select({'_id': 0, '__uv': 0, 'followed': 0}).exec().then((follows)=>{
    var follows_clean=[];

    follows.forEach((follow)=>{
    follows_clean.push(follow.user);
    });

    return follows_clean;
    
    }).catch((err)=>{
        return handleerror(err);
    });
        return {    
        following: following,
        followed: followed
        }
}

//Contador seguidores/seguidos
function getCounters(req,res){
    var user_id = req.user.sub;

    if(req.params.id){
        user_id = req.params.id;
    }
        
        getCountFollow(user_id).then((value) => {
            return res.status(200).send({value});
        });
}

async function getCountFollow(user_id) {
    var following = await Follow.countDocuments({ "user": user_id })
        .exec()
        .then((count) => {
            console.log(count);
            return count;
        })
        .catch((err) => { return handleError(err); });
 
    var followed = await Follow.countDocuments({ "followed": user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });

    
        var publications = await Publication.countDocuments({ "user": user_id })
        .exec()
        .then((count) => {
            return count;
        })
        .catch((err) => { return handleError(err); });


 
    return { 
        following: following, 
        followed: followed,
        publications: publications
    }
 
}

//Editar datos usuario
function updateUser(request, response) {
    let userId = request.params.id;
    let update = request.body;
    
    // Quitar propiedad password
    delete update.password;

    // Si el id que llega por la url es diferente al id del usuario identificado
    if (userId != request.user.sub) {
        return response.status(500).send({ message: 'No tienes permiso para actualizar los datos' });

    }

    //Regex para evitar duplicados may/min
    const findEmail = new RegExp(update.email,"i");
    const findNick = new RegExp(update.nick,"i");


    // Evitar actualizar datos duplicados
    User.find({
        $or: [
            { email: findEmail },
            { nick: findNick }
        ]
        
    }).exec((error, users) => {
        var user_isset = false;
        
        users.forEach((user)=>{
           
            console.log("foreach", user._id);
            console.log(user._id,"+", userId)
            
            if (user && user._id != userId){
                user_isset = true;
            }  
        });

        if(user_isset) return response.status(404).send({ message: 'Email o password no disponibles' });
        

        // { new: true } devuelve el objeto actualizado

        User.findByIdAndUpdate(userId, update, { new: true }, (error, userUpdated) => {

            if (error) return response.status(500).send({ message: 'No se ha podido procesar la peticion para actualizar usuario' });
            if (!userUpdated) return response.status(404).send({ message: 'No se ha podido actualizar el usuario' });
            return response.status(200).send({ user: userUpdated });

        });

    });



}

//Subir archivo de imagen/avar usuario
function uploadImage(req,res){
    var userId = req.params.id;


    if(req.files){
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        //console.log(file_split);

        var file_name = file_split[2];
        //console.log('file_name->', file_name)

        var ext_split = file_name.split('\.');
        //console.log("extension->", ext_split)

        //Guardar si es jpg, pgn o la extensión
        var file_ext = ext_split[1];
        //console.log("extension->", file_ext);

        if(userId != req.user.sub){
           return removeFilesOfUploads(res, file_path,'No tienes permisos para actualizar los datos del usuario');
        }

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
            //Actualizar documento usuario logueado
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated)=>{
                if(err) return res.status(500).send({message: 'Error en la petición'})

                if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
        
                return res.status(200).send({user: userUpdated});
            });
            
        }else{
            //Borrar archivos guardados por multiparty
           return removeFilesOfUploads(res, file_path,'Extensión no válida');
        }


    }else{
        return res.status(200).send({message: 'No se han subido imágenes'});
    }
}

//Borrar archivos de subidas
function removeFilesOfUploads(res, file_path,message){
    fs.unlink(file_path,(err)=>{
        return res.status(200).send({message: message});
    });
}

//Devolver imagen
function getImageFile(req, res){
    var image_file = req.params.imageFile;

    var path_file = './uploads/users/' + image_file;

    fs.exists(path_file, (exists) => {
		if(exists){
			res.sendFile(path.resolve(path_file));
		}else{
			res.status(200).send({message: "No existe la imagen..."})
			//console.log(exists);
		}
	});

}



module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile,
    
}