const { matchedData } = require("express-validator");
const { tokenSign } = require("../utils/handleJwt");
const { encrypt, compare } = require("../utils/handlePassword");
const { handleHttpError } = require("../utils/handleError");
const { generateCode } = require("../utils/handleCode");
const uploadToPinata = require('../utils/handleUploadIPFS.js')
const usersModel = require("../models/users");

/**
 * Encargado de registrar un nuevo usuario
 * @param {*} req 
 * @param {*} res 
 */
const registerCtrl = async (req, res) => {
    try {
        req = matchedData(req);

        const existingUser = await usersModel.findOne({ email: req.email });
        if (existingUser) {
            // Si el correo ya existe, devuelve un error 409
            return handleHttpError(res, "EMAIL_ALREADY_REGISTERED", 409);
        }
        const password = await encrypt(req.password);
        const code = generateCode(); // Generamos el código de validación

        const body = { ...req, password, code }; // Agregamos el código generado

        const dataUser = await usersModel.create(body);

        // Generamos el token
        const token = await tokenSign(dataUser);

        // Construimos la respuesta con solo los campos requeridos (sin la contraseña ni codigo)
        const responseData = {
            token,
            user: {
                email: dataUser.email,
                role: dataUser.role,
                status: dataUser.status
            }
        };

        res.send(responseData);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_REGISTER_USER");
    }
};

/**
 * Encargado de hacer login del usuario
 * @param {*} req 
 * @param {*} res 
 */
const loginCtrl = async (req, res) => {
    try {
        req = matchedData(req);
        const user = await usersModel.findOne({ email: req.email }).select("password name age role email status");

        if (!user) {
            handleHttpError(res, "USER_NOT_EXISTS", 404);
            return;
        }

        const hashPassword = user.password;
        const check = await compare(req.password, hashPassword);

        if (!check) {
            handleHttpError(res, "INVALID_PASSWORD", 401);
            return;
        }

        user.set('password', undefined, { strict: false });

        const data = {
            token: await tokenSign(user),
            user: {
                email: user.email,
                role: user.role,
                status: user.status
            }
        };

        res.send(data);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_LOGIN_USER");
    }
};
/**
 * Encargado de verificar el código de validación
 * @param {*} req 
 * @param {*} res 
 */
const verifyCodeCtrl = async (req, res) => {
    try {
        // El usuario ya está autenticado gracias al middleware
        const user = req.user;

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        // Si ya no tiene intentos disponibles, bloquear validación
        if (user.attempts <= 0) {
            return handleHttpError(res, "MAX_ATTEMPTS_REACHED", 403);
        }

        // Extraer el código enviado en la petición
        req = matchedData(req);
        const { code } = req;

        // Verificar si el código coincide con el almacenado
        if (user.code !== code) {
            user.attempts -= 1; // Reducir el número de intentos
            await user.save();
            return handleHttpError(res, "INVALID_CODE", 400);
        }

        // Si el código es correcto, actualizar el status a 1 (validado) y resetear intentos
        user.status = 1;
        user.attempts = 3; // Restablecer intentos para futuras verificaciones
        await user.save();

        res.send({ message: "Código validado correctamente" });

    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_VERIFY_CODE");
    }
};
/**
 * Actualiza los datos personales del usuario autenticado
 * @param {*} req 
 * @param {*} res 
 */
const updatePersonalDataCtrl = async (req, res) => {
    try {
        const userId = req.user._id; // ID del usuario autenticado a partir del token
        const { name, surnames, nif } = matchedData(req); // Validar datos del cuerpo

        // Actualizar usuario en la base de datos
        const updatedUser = await usersModel.findByIdAndUpdate(
            userId,
            { name, surnames, nif },
            { new: true, fields: "email name surnames nif role status" } // Solo devuelve estos campos
        );

        if (!updatedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_UPDATING_USER");
    }
};
const updateCompanyCtrl = async (req, res) => {
    try {
        const userId = req.user._id; // ID del usuario autenticado
        let { company } = matchedData(req); // Validar datos del cuerpo

        // Actualizar usuario en la base de datos
        const updatedUser = await usersModel.findByIdAndUpdate(
            userId,
            { company },
            { new: true, fields: "email name surnames nif role status company" } // Devolvemos solo estos campos
        );

        if (!updatedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_UPDATING_COMPANY");
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = req.user; // Ya está en req gracias al middleware

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error obteniendo el usuario:', error);
        res.status(500).json({ message: 'Error obteniendo el usuario' });
    }
};
const deleteUser = async (req, res) => {
    try {
        const user = req.user; // Usuario autenticado extraído del token JWT
        const softDelete = req.query.soft !== 'false'; // Si ?soft=false, será hard delete

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (softDelete) {
            // Soft delete: Actualiza el campo "deleted" sin eliminar el documento
            await usersModel.findByIdAndUpdate(user._id, { deleted: true });
            return res.status(200).json({ message: 'Usuario eliminado (soft delete)' });
        } else {
            // Hard delete: Elimina el usuario de la base de datos
            await usersModel.findByIdAndDelete(user._id);
            return res.status(200).json({ message: 'Usuario eliminado permanentemente' });
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ message: 'Error eliminando usuario' });
    }
};

const uploadImage = async (req, res) => {
    try {
        const id = req.user.id; // Obtiene el ID del usuario autenticado

        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        // Subir la imagen a Pinata
        const pinataResponse = await uploadToPinata(fileBuffer, fileName);
        if (!pinataResponse || !pinataResponse.IpfsHash) {
            throw new Error("Failed to upload to Pinata");
        }

        const ipfsUrl = `https://${process.env.PINATA_GATEWAY_URL}/ipfs/${pinataResponse.IpfsHash}`;

        // Actualizar el usuario con la URL y el filename
        const updatedUser = await usersModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    "company.logo": fileName,
                    "company.url": ipfsUrl
                }
            },
            { new: true, select: "-password -code -attempts" } // Excluir campos sensibles
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.send(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).send("ERROR_UPLOAD_COMPANY_IMAGE");
    }
};


module.exports = { registerCtrl, loginCtrl, verifyCodeCtrl, updatePersonalDataCtrl, updateCompanyCtrl, getUserProfile, deleteUser, uploadImage };
