const express = require("express");
const cors = require("cors")
require('dotenv').config();

const routers = require('./routes')
const app = express()
const dbConnect = require('./config/mongo')
//Le decimos a la app de express() que use cors para evitar el error Cross-Domain (XD)
app.use(cors())
app.use(express.json())
app.use('/api', routers)
//app.use(express.static("storage"))
const port = process.env.PORT || 3000
app.listen(port, () => {
console.log("Servidor escuchando en el puerto " + port)
dbConnect()
})