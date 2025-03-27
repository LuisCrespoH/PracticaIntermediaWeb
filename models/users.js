const mongoose = require('mongoose');

const UserScheme = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true
        },
        password: String,
        role: {
            type: ['user', 'admin'],
            default: 'user'
        },
        code: {
            type: String, // Lo guardamos como string para mantener los ceros iniciales (ej: "045678")
            required: true,
            unique: true,
            minlength: 6,
            maxlength: 6
        },
        attempts: {
            type: Number,
            default: 3, // Número máximo de intentos
            required: true
        },
        status: {
            type: Number,
            default: 0, // 0 = no validado, 1 = validado
            enum: [0, 1] // Solo puede ser 0 o 1
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model('users', UserScheme);
