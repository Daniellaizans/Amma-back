const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token no proporcionado" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });

        req.user = user; // Agrega los datos del usuario al objeto de solicitud
        next();
    });
}

module.exports = {authenticateToken}
