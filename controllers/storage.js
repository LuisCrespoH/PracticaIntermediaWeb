const User = require('../models/users.js'); // Asegúrate de importar el modelo de usuario
const { handleHttpError } = require("../utils/handleError");
const uploadToPinata = require('../utils/handleUploadIPFS.js');
const fs = require('fs');
const MEDIA_PATH = __dirname + '/../storage'; // No se usa en este caso, pero se mantiene

const uploadImage = async (req, res) => {
    try {
        // Obtener el ID del usuario desde los parámetros de la URL
        const user = req.user;

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        // Verificar si el archivo ha sido subido
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        // Obtener los datos del archivo
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        // Subir el archivo a Pinata
        const pinataResponse = await uploadToPinata(fileBuffer, fileName);

        // Obtener el hash de IPFS de la respuesta de Pinata
        const ipfsFile = pinataResponse.IpfsHash;

        // Crear la URL del archivo en Pinata
        const ipfsUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${ipfsFile}`;


        // Actualizar el logo de la compañía con la URL de la imagen
        user.company.logo = ipfsUrl;

        // Guardar el usuario con el nuevo logo
        await user.save();

        // Responder con el nuevo logo
        return res.status(200).json({
            message: 'Logo actualizado correctamente',
            logoUrl: ipfsUrl
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('ERROR_UPLOAD_COMPANY_IMAGE');
    }
};

module.exports = { uploadImage };