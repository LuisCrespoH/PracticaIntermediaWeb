const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
};

module.exports = { generateCode };