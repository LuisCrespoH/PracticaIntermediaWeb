const express = require("express")
const { registerCtrl, loginCtrl } = require("../controllers/auth")
const { validatorRegister, validatorLogin } = require("../validators/auth")
const router = express.Router()


//POST http://localhost:3000/api/auth/register
router.post("/register", validatorRegister, registerCtrl)

//POST http://localhost:3000/api/auth/login
router.post("/login", validatorLogin, loginCtrl) 


module.exports = router