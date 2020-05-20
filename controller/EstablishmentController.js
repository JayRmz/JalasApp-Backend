///opt/lampp$ sudo ./manager-linux-x64.run
const EstablishmentModel = require('../model/EstablishmentModel');
const EstablishmentConfModel = require('../model/EstablishmentConfModel');
const FlakeIdGen = require('flake-idgen');
const intformat = require('biguint-format');
const generator = new FlakeIdGen();
const uuidv4= require('uuid/v4');
const Email = require('../util/Email');
const log = require('log-to-file');
const deleteImage = require('../util/deleteImage');
const Base64ToImg = require('../util/base64ToImg');
const config            = require('../util/config.js');
const jsonReq = require('../util/jsonReq');
const validation = require('../util/validation');

async function createEstablishment(req,res) {

    let resJson ={
        'status': 1,
        'message': ''
    };

    if(!validation.isValid(req.body,jsonReq.createEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    //VERIFICAR SI EXISTE EL EMAIL
    let email=req.body.data.email;
    let exist = await EstablishmentModel.verifyMail(email);
    if(exist == '1'){
        resJson.status=1;
        resJson.message="Establishment already exist";
        res.json(resJson);
    }
    else if(exist=='0'){
        //GENERAR ID UNICO POR ESTABLECIMIENTO
        let temp=generator.next();
        let id=intformat(temp,'dec');
        //GENERAR UN CODIGO DE CONFIRMACION
        let uuid=uuidv4();
        //INSERTAR A LA BASE DE DATOS
        let establishmentInfo=req.body.data;
        establishmentInfo.idEstablishment=id;
        establishmentInfo.confirmationCode=uuid;
        let establishmentModel=new EstablishmentModel(establishmentInfo);
        let establishmentConfData=req.body.data.conf;
        let result = await establishmentModel.insertEstablishment(establishmentConfData);
        if(result){
            //ENVIAR UN CORREO DE CONFIRMACION
            let emailResult = await Email.sendConfirmation(email,uuid);
            resJson.message="Establishment Created Correctly";
            log("Sent Email Succesfully "+email);
            res.json(resJson);
        }
        else{
            resJson.status=1;
            resJson.message="Problem Creating Establishment";
            log("Problem creating user "+email,'error.log');
            res.json(resJson);
        }
    }
    else{
        resJson.status=1;
        resJson.message="Establishment already exist";
        log("Problem creating user "+email,'error.log');
        res.json(resJson);
    }

}

async function validateEstablishmentCredentials(req,res) {
    let resJson ={
        'status': 0,
        'message': ''
    };

    if(!validation.isValid(req.body,jsonReq.validateCredentials))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    //VERIFICAR SI EXISTE EL EMAIL
    let email=req.body.data.email;
    let exist = await EstablishmentModel.verifyEstablishmentCredentials(req.body.data);
    if(exist != '0'){
        log("Verified Establishment "+email);
        resJson.status=1;
        resJson.message="Establishment Exist";

    }
    else if(exist=='0') {
        log("Wrong email and password for email "+email,'error.log');
        resJson.status=0;
        resJson.message="Wrong email and password";

    }
    else{
        log("Problem validating Establishment "+email,'error.log');
        resJson.status=0;
        resJson.message="User doesn't exist";

    }
    res.json(resJson);
}

async function updateEstablishment(req,res) {
    let resJson ={
        'status': 0,
        'message': ''
    };

    if(!validation.isValid(req.body,jsonReq.updateEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    //crear nuevo userModel
    let establishmentInfo=req.body.data;
    let establishmentModel=new EstablishmentModel(establishmentInfo);
    //llamar a updateUser
    let result = await establishmentModel.updateEstablishment();

    //regresar la respuesta
    if(result){
        log("update Establishment");
        resJson.message="Establishment Updated Correctly";
        res.json(resJson);
    }
    else{
        log("Fail update Establishment",'error.log');
        resJson.status=1;
        resJson.message="Problem Updating Establishment";
        res.json(resJson);
    }
}

async  function getEstablishmentInfo(req,res){
    let resJson = {
        'status': 0,
        'message': '',
        'data': {}
    };

    if(!validation.isValid(req.body,jsonReq.getEstablishmentInfo))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    //crear un nuevo EstablishmentModel
    let establishmentInfo=req.body.data;
    let establishmentModel=new EstablishmentModel(establishmentInfo);
    //llamar a gerEstablishmentInfo
    let result = await establishmentModel.getEstablishmentInfo();



    let establishmentConfModel=new EstablishmentConfModel(establishmentInfo);
    //llamar a gerEstablishmentConfInfo
    result.conf = await establishmentConfModel.getEstablishmentConfInfo(establishmentInfo.idEstablishment);


    console.log("////////////////////");
    console.log(result);
    console.log("////////////////////");

    //regresar la respuesta
    if(result){
        log("Establishment consulted");
        resJson.data=result;
        resJson.message="Establishment found";
        res.json(resJson);
    }
    else{
        log("Fail consulted Establishment",'error.log');
        resJson.status=1;
        resJson.message="Establishment not found";
        res.json(resJson);
    }


}

async function updateEstablishmentPassword(req,res) {
    let resJson ={
        'status': 0,
        'message': ''
    };

    if(!validation.isValid(req.body,jsonReq.updateEstablishmentPassword))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    //crear nuevo userModel
    let establishmentInfo=req.body.data;
    let establishmentModel=new EstablishmentModel(establishmentInfo);
    //llamar a updateUserPassword
    let result = await establishmentModel.updateEstablishmentPassword();

    //regresar la respuesta
    if(result){
        log("update Establishment Password");
        resJson.message="Establishment Password Updated Correctly";
        res.json(resJson);
    }
    else{
        log("Fail update Establishment Password",'error.log');
        resJson.status=1;
        resJson.message="Problem Updating Establishment Password";
        res.json(resJson);
    }
}

async function setProfileImage(req,res) {
    let resJson ={
        'status': 1,
        'message': ''

    };
    if(!validation.isValid(req.body,jsonReq.setProfileImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    let img64 = req.body.data.image;
    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);

    let temp = generator.next();
    let nameImg = intformat(temp, 'dec');

    let path =config.imagepath+"establishment/profile/";
    let resultSave = await Base64ToImg.base64ToImg(img64,path,"jpg",nameImg.toString());

    if(resultSave)
    {
        let imagesEstablishment =await  EstablishmentConfModel.getImages(idConfiguration.idconfiguration);
        if(imagesEstablishment)
        {
            let oldProfileImage=JSON.parse(imagesEstablishment.images).profileImage;
            let bannerImage = JSON.parse(imagesEstablishment.images).bannerImage;

            let imagesJSON =
                [
                    "profileImage",nameImg,
                    "bannerImage", bannerImage
                ];
            let updateData = [];
            updateData.push({
                "field":"images",
                "data":imagesJSON
            });
            let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
            if(result){
                try {
                    let resultDelete = deleteImage.deleteImage(oldProfileImage, path);
                    if (resultDelete) {
                        log("Update profile Image Correctly");
                        resJson.message = "Update profile Image Correctly";
                        res.json(resJson);
                    } else {
                        log("fail Update profile Image Correctly", 'error.log');
                        resJson.status = 0;
                        resJson.message = "fail Update profile Image Correctly";
                        res.json(resJson);

                    }
                }
                catch(error){
                    log("fail Update profile Image Correctly", 'error.log');
                    resJson.status = 0;
                    resJson.message = "fail Update profile Image Correctly";
                    res.json(resJson);
                }
            }
            else{
                log("fail Update profile Image Correctly",'error.log');
                resJson.status=0;
                resJson.message="fail Update profile Image Correctly";
                res.json(resJson);
            }
        }
    }
    else
    {
        log("fail Update profile Image Correctly", 'error.log');
        resJson.status = 0;
        resJson.message = "fail Update profile Image Correctly";
        res.json(resJson);
    }
}

async function setBannerImage(req,res){
    let resJson ={
        'status': 1,
        'message': ''

    };
    if(!validation.isValid(req.body,jsonReq.setBannerImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    let img64 = req.body.data.image;
    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);

    let temp = generator.next();
    let nameImg = intformat(temp, 'dec');

    let path =config.imagepath+"establishment/banner/";
    let resultSave = await Base64ToImg.base64ToImg(img64,path,"jpg",nameImg.toString());

    if(resultSave)
    {
        let imagesEstablishment =await  EstablishmentConfModel.getImages(idConfiguration.idconfiguration);
        if(imagesEstablishment)
        {
            let profileImage=JSON.parse(imagesEstablishment.images).profileImage;
            let oldBannerImage = JSON.parse(imagesEstablishment.images).bannerImage;
            let imagesJSON =
                [
                    "profileImage", profileImage,
                    "bannerImage", nameImg,
                ];
            let updateData = [];
            updateData.push({
                "field":"images",
                "data":imagesJSON
            });
            let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
            if(result){
                try {
                    let resultDelete = deleteImage.deleteImage(oldBannerImage,path);
                    if (resultDelete) {
                        log("Update banner Image Correctly");
                        resJson.message = "Update banner Image Correctly";
                        res.json(resJson);
                    } else {
                        log("fail Update banner Image Correctly", 'error.log');
                        resJson.status = 0;
                        resJson.message = "fail Update banner Image Correctly";
                        res.json(resJson);
                    }
                }
                catch(error){
                    log("fail Update banner Image Correctly", 'error.log');
                    resJson.status = 0;
                    resJson.message = "fail Update banner Image Correctly";
                    res.json(resJson);
                }
            }
            else{
                log("fail Update profile Image Correctly",'error.log');
                resJson.status=0;
                resJson.message="fail Update profile Image Correctly";
                res.json(resJson);
            }
        }
    }
    else
    {
        log("fail Update banner Image", 'error.log');
        resJson.status = 0;
        resJson.message = "fail Update banner Image";
        res.json(resJson);
    }
}

async function addImage(req,res){
    let resJson ={
        'status': 1,
        'message': ''

    };
    if(!validation.isValid(req.body,jsonReq.addImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }


    let img64 = req.body.data.image;
    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);

    let temp = generator.next();
    let nameImg = intformat(temp, 'dec');

    let path =config.imagepath+"establishment/gallery/";
    let resultSave = await Base64ToImg.base64ToImg(img64,path,"jpg",nameImg.toString());

    if(resultSave)
    {
        let imagesEstablishment =await  EstablishmentConfModel.getGallery(idConfiguration.idconfiguration);
        if(imagesEstablishment)
        {
            let galleryImages = JSON.parse(imagesEstablishment.gallery);

            galleryImages.push(nameImg.toString());
            let updateData = [];
            updateData.push({
                "field":"gallery",
                "data":galleryImages
            });
            let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
            if(result){
                log("add Image to gallery Correctly");
                resJson.message = "add Image to gallery Correctly";
                res.json(resJson);
            }
            else{
                log("fail add Image to gallery",'error.log');
                resJson.status=0;
                resJson.message="fail add Image to gallery";
                res.json(resJson);
            }
        }
    }
    else
    {
        log("fail add Image to gallery", 'error.log');
        resJson.status = 0;
        resJson.message = "fail add Image to gallery";
        res.json(resJson);
    }
}

async function removeImage(req,res){
    let resJson ={
        'status': 1,
        'message': ''

    };
    if(!validation.isValid(req.body,jsonReq.removeImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    let nameImage = req.body.data.image;
    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);


        let imagesEstablishment =await  EstablishmentConfModel.getGallery(idConfiguration.idconfiguration);
        if(imagesEstablishment)
        {
            let galleryImages = JSON.parse(imagesEstablishment.gallery);

            if(galleryImages!=null && galleryImages.length>=1)
            {
                if(galleryImages.includes(nameImage))
                {
                    let index = galleryImages.indexOf(nameImage);
                    galleryImages.splice(index,1);
                    let updateData = [];
                    updateData.push({
                        "field":"gallery",
                        "data":galleryImages
                    });
                    let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
                    if(result){
                        try {
                            let path =config.imagepath+"establishment/gallery/";
                            let resultDelete = deleteImage.deleteImage(nameImage,path);
                            if (resultDelete) {
                                log("delete Image Correctly", 'error.log');
                                resJson.message = "delete Image Correctly";
                                res.json(resJson);
                            } else {
                                log("fail delete Image1");
                                resJson.status = 0;
                                resJson.message = "fail delete Image PZZ";
                                res.json(resJson);
                            }

                        }
                        catch(error){
                            log("fail delete Image1", 'error.log');
                            resJson.status = 0;
                            resJson.message = "fail delete Image PZZ 2"+error;
                            res.json(resJson);
                        }
                    }
                    else{
                        log("fail delete Image to gallery",'error.log');
                        resJson.status=0;
                        resJson.message="fail delete Image to gallery";
                        res.json(resJson);
                    }
                }
                else
                {
                    log("delete Image Correctly", 'error.log');
                    resJson.message = "delete Image Correctly";
                    res.json(resJson);
                }
            }
            else
            {
                log("delete Image Correctly", 'error.log');
                resJson.message = "delete Image Correctly";
                res.json(resJson);
            }
        }

}

async function deleteBannerImage(req,res) {
    let resJson ={
        'status': 1,
        'message': ''

    };

    if(!validation.isValid(req.body,jsonReq.deleteBannerImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);


    let imagesEstablishment =await  EstablishmentConfModel.getImages(idConfiguration.idconfiguration);
    if(imagesEstablishment)
    {
        let bannerImage = JSON.parse(imagesEstablishment.images).bannerImage;
        let profileImage = JSON.parse(imagesEstablishment.images).profileImage;

        let imagesJSON =
            [
                "profileImage",profileImage,
                "bannerImage", "",

            ];
        let updateData = [];
        updateData.push({
            "field":"images",
            "data":imagesJSON
        });
        let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
        if(result){
            try {
                let path =config.imagepath+"establishment/banner/";
                let resultDelete = deleteImage.deleteImage(bannerImage,path);
                if (resultDelete) {
                    log("Delete banner Image Correctly");
                    resJson.message = "Delete banner Image Correctly";
                    res.json(resJson);
                } else {
                    log("fail delete banner Image", 'error.log');
                    resJson.status = 0;
                    resJson.message = "fail Delete banner Image";
                    res.json(resJson);

                }
            }
            catch(error){
                log("fail delete banner Image", 'error.log');
                resJson.status = 0;
                resJson.message = "fail delete banner Image";
                res.json(resJson);
            }
        }
        else{
            log("fail delete banner Image",'error.log');
            resJson.status=0;
            resJson.message="fail delete banner Image Correctly";
            res.json(resJson);
        }
    }

}

async function deleteProfileImage(req,res) {
    let resJson ={
        'status': 1,
        'message': ''

    };

    if(!validation.isValid(req.body,jsonReq.deleteProfileImageEstablishment))
    {
        resJson.status=0;
        resJson.message="wrong formatting";
        res.json(resJson);
        return;
    }

    let idEstablishment = req.body.data.idEstablishment;
    let idConfiguration = await EstablishmentConfModel.getIdConfiguration(idEstablishment);


    let imagesEstablishment =await  EstablishmentConfModel.getImages(idConfiguration.idconfiguration);
    if(imagesEstablishment)
    {
        let bannerImage = JSON.parse(imagesEstablishment.images).bannerImage;
        let profileImage = JSON.parse(imagesEstablishment.images).profileImage;

        let imagesJSON =
            [
                "profileImage","",
                "bannerImage", bannerImage
            ];
        let updateData = [];
        updateData.push({
            "field":"images",
            "data":imagesJSON
        });
        let result = await EstablishmentConfModel.updateEstablishmentConf(updateData, idEstablishment, idConfiguration);
        if(result){
            try {
                let path =config.imagepath+"establishment/profile/";
                let resultDelete = deleteImage.deleteImage(profileImage,path);
                if (resultDelete) {
                    log("Delete profile Image Correctly");
                    resJson.message = "Delete profile Image Correctly";
                    res.json(resJson);
                } else {
                    log("fail delete profile Image", 'error.log');
                    resJson.status = 0;
                    resJson.message = "fail Delete profile Image";
                    res.json(resJson);

                }
            }
            catch(error){
                log("fail delete profile Image", 'error.log');
                resJson.status = 0;
                resJson.message = "fail delete profile Image";
                res.json(resJson);
            }
        }
        else{
            log("fail delete profile Image",'error.log');
            resJson.status=0;
            resJson.message="fail delete profile Image Correctly";
            res.json(resJson);
        }
    }

}

async  function verifyMail(req,res){
    let resJson ={
        'status': 1,
        'message': ''
    };

    if(!validation.isValid(req.body,jsonReq.verifyMail))
    {
        resJson.status=0;
        resJson.message="wrong formatting Email";
        res.json(resJson);
        return;
    }

    try {
        let email = req.body.data.email;
        let exist = await EstablishmentModel.verifyMail(email);
        if (exist == '1') {
            resJson.status = 1;
            resJson.message = "email already exist";
            res.json(resJson);
        }
        else
        {
            resJson.status = 0;
            resJson.message = "email not found";
            res.json(resJson);
        }
    }catch (e) {
        log("Promise error "+e,'error.log');
        resJson.status = 1;
        resJson.message = "Fatal error" + e;
        res.json(resJson)
    }

}


module.exports.CreateEstablishment = createEstablishment;
module.exports.ValidateEstablishmentCredentials = validateEstablishmentCredentials;
module.exports.UpdateEstablishment = updateEstablishment;
module.exports.GetEstablishmentInfo = getEstablishmentInfo;
module.exports.UpdateEstablishmentPassword = updateEstablishmentPassword;
module.exports.SetProfileImage=setProfileImage;
module.exports.SetBannerImage=setBannerImage;
module.exports.VerifyMail=verifyMail;
module.exports.AddImage=addImage;
module.exports.RemoveImage=removeImage;
module.exports.DeleteBannerImage=deleteBannerImage;
module.exports.DeleteProfileImage=deleteProfileImage;
