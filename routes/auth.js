const express = require("express")
const { registerCtrl, loginCtrl, verifyCodeCtrl, updatePersonalDataCtrl, updateCompanyCtrl } = require("../controllers/auth")
const { validatorRegister, validatorLogin, validatorCode, validatorPersonalData, validatorCompany } = require("../validators/auth")
const authMiddleware = require("../middleware/session");
const router = express.Router()


//POST http://localhost:3000/api/auth/register
router.post("/register", validatorRegister, registerCtrl)

//POST http://localhost:3000/api/auth/login
router.post("/login", validatorLogin, loginCtrl) 

router.post("/validation", authMiddleware, validatorCode, verifyCodeCtrl);

router.put("/register", authMiddleware, validatorPersonalData, updatePersonalDataCtrl);

router.patch("/company", authMiddleware, validatorCompany, updateCompanyCtrl);


module.exports = router