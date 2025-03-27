const { check } = require("express-validator")
const validateResults = require("../utils/handleValidator")

const validatorRegister = [
    
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty().isLength( {min:8, max: 16} ),
    //check("role").optional(),
    (req, res, next) => {
        return validateResults(req, res, next)
    }
]
const validatorLogin = [
    check("email").exists().notEmpty().isEmail(),
    check("password").exists().notEmpty().isLength( {min:8, max: 16} ),
    (req, res, next) => {
    return validateResults(req, res, next)
    }
]

const validatorCode = [
    check("code")
        .isNumeric()
        .isLength({ min: 6, max: 6 })
        .withMessage("El código debe tener 6 dígitos numéricos"),
    (req, res, next) => {
        validateResults(req, res, next);
    }
];

const validatorPersonalData = [
    check("name").notEmpty().withMessage("El nombre es obligatorio"),
    check("surnames").notEmpty().withMessage("Los apellidos son obligatorios"),
    check("nif")
        .matches(/^\d{8}[A-Z]$/)
        .withMessage("El NIF debe tener 8 números seguidos de una letra"),
    (req, res, next) => validateResults(req, res, next),
];

module.exports = { validatorRegister, validatorLogin, validatorCode, validatorPersonalData }