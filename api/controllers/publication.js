'use strict'

var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');

function probando(req, res){
    res.status(200).send({
        message: 'Controlador de publicaciones'
    });
}

function savePublication(req, res){
    var params = req.body;
   
    //Settear datos

    if(!params.text) return res.status(200).send({message: 'Debes enviar un texto'});

    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();

    publication.save((err, publicationStored) =>{
        if(err) return res.status(500).send({message: 'Error al guardar la publicación'});

        if(!publicationStored) return res.status(404).send({message: 'La publicación no ha sido guardada'}); 

        return res.status(200).send({publication: publicationStored});
    });
}

function getPublications(req, res){
    var page = 1;
    //Si recibimos la página por los parámetros
    if(req.params.page){
        page = req.params.page;
    }

    var itemsPerPage = 4;

    //find de usuarios que seguimos
    Follow.find({user: req.user.sub}).populate('followed').exec((err, follows) => {
        if(err) return res.status(500).send({message: 'Error al devolver el seguimiento'});
        //Array de ids que seguimos
        var follows_clean = [];
        follows.forEach((follow) => {
            follows_clean.push(follow.followed);
        });
        //console.log("array gente que seguimos->",follows_clean);
        Publication.find({user: {"$in": follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) =>{
            if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});

            if(!publications) return res.status(404).send({message: 'No hay publicaciones'});

            return res.status(200).send({
                total_items: total,
                pages: Math.ceil(total/itemsPerPage),
                page: page,
                publications
            })

        });

    });

}

function getPublication(req, res){
    var publicationId = req.params.id;

    Publication.findById(publicationId, (err, publication) => {
        if(err) return res.status(500).send({message: 'Error al devolver la publicación'});

        if(!publication) return res.status(404).send({message: 'No existe la publicación'});

        return res.status(200).send({publication});
    });
}

/*function deletePublication(req, res){
    var publicatioId = req.params.id;
 
    Publication.deleteOne({'user': req.user.sub, '_id': publicatioId}).then(err => {
        if(err) return res.status(500).send({message: 'Error al intentar eliminar la publicación'});
 
        //if(!publicationRemoved) return res.status(404).send({message: 'La publicación no existe o ya ha sido eliminada'});
 
        return res.status(200).send({message: 'La publicación ha sido eliminada'});
    });
}*/

function deletePublication(req, res){
    var publicationId = req.params.id;
    const query = { "user": req.user.sub, "_id": publicationId };
    console.log(query)

    const options = {
        "sort": { "quantity": -1 }
    }
    Publication.findOneAndDelete(query, options)
    .then(deletedDocument => {
      if(deletedDocument) {
        console.log(`Documento borrado correctamente: ${deletedDocument}.`)
      } else {
        return res.status(200).send({message:'Ningún documento coincide'});
      }
      return res.status(200).send({deletedDocument});
    })
    .catch(err => console.error(`Error al borrar el documento: ${err}`))
 }

 //Subir archivo de imagen/avar usuario
function uploadImage(req,res){
    var publicationId = req.params.id;


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

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
           
           //Evitar que otro usuario modifique una publicación que no es suya
           Publication.findOne({'user': req.user.sub, '_id': publicationId}).exec((err, publication) => {
            if(publication){
                 //Actualizar documento de publicación
                Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new: true}, (err, publicationUpdated)=>{
                    if(err) return res.status(500).send({message: 'Error en la petición'})

                    if(!publicationUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
            
                    return res.status(200).send({publication: publicationUpdated});
                });
            }else{
                return removeFilesOfUploads(res, file_path,'No tienes permisos para actualizar esta publicacion');
            }
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

    var path_file = './uploads/publications/' + image_file;

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
    probando,
    savePublication,
    getPublications,
    getPublication,
    deletePublication,
    uploadImage,
    getImageFile

}