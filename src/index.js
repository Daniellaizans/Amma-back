const  express  = require("express")
const cors = require("cors");

const MysqlAdapter = require("./database")
const { generarToken } = require("./utils/jwt");
const {authenticateToken} = require("./utils/middleware")
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
require("dotenv").config();
const db = new MysqlAdapter()
const {ListMarcas,ListCategorias} = require ("./sql");
const app = express()
app.set("port",4000)
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173", // Permite solo solicitudes desde tu frontend
        methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
        credentials: true, // Si manejas cookies o encabezados de autenticación
    })
);
app.listen(app.get("port"))
console.log('Escuchando comunicaciones al puerto'+app.get("port"))
db.init()


//Usuarios
app.post("/login", async (req, res) => {
    const { user, password } = req.body;

    // Verifica el usuario en la base de datos
    const usuario = await db.query("SELECT * FROM Usuarios WHERE usuario = ?", [user]);
    if (!usuario.length) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verifica la contraseña
    const validPassword = await bcrypt.compare(password, usuario[0].contrasena);
    if (!validPassword) {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Genera un token JWT usando la función externa
    const token = generarToken({
        idUsuario: usuario[0].idUsuario,
        esAdministrador: usuario[0].esAdministrador,
    });

    res.json({ token });
});

app.post("/registro-user",
    // Middleware de validación
    [
        body("user").notEmpty().withMessage("Debe ser un Usuario válido."),
        body("nombre").notEmpty().withMessage("Debe ser un Nombre válido."),
        body("password")
            .isLength({ min: 6 })
            .withMessage("La contraseña debe tener al menos 6 caracteres."),
    ],
    async (req, res) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }

        const { nombre,user, password } = req.body;
        try {
            // Verificar si el usuario ya existe
            const existeUsuario = await db.query("SELECT * FROM Usuarios WHERE usuario = ?", [user]);
            if (existeUsuario.length > 0) {
                return res.status(400).json({ error: "El Usuario ya está registrado." });
            }

            // Cifrar la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insertar el nuevo usuario en la base de datos
            await db.query("INSERT INTO Usuarios (nombre,usuario, contrasena, esAdministrador) VALUES (?, ?, ?, ?)", [
                nombre,
                user,
                hashedPassword,
                true
            ]);

            res.status(201).json({ mensaje: "Usuario registrado exitosamente." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al registrar el usuario." });
        }
    }
);

app.get("/usuarios",authenticateToken, async (req, res) => {
    const Usuarios = await db.query("SELECT usuario, idUsuario, nombre, esAdministrador, fechaRegistro FROM usuarios where esAdministrador = true")
    res.json(Usuarios)
})

app.delete("/usuarios:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica si la categoría existe
        const usuarios = await db.query("SELECT * FROM usuarios WHERE idUsuario = ?", [id]);
        if (usuarios.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada." });
        }

        // Eliminar la categoría
        await db.query("DELETE FROM usuarios WHERE idUsuario = ?", [id]);

        res.status(200).json({ mensaje: "Marcas eliminada exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la Marca." });
    }
});

app.put("/usuarios:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {nombre, usuario} = req.body;
    try {
        // Verifica si la categoría existe
        const categoria = await db.query("SELECT * FROM usuarios WHERE idUsuario = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        // Eliminar la categoría
        await db.query("UPDATE usaurios SET nombre = ?, usuario = ? WHERE idMarca = ?", [
            nombre,
            usuario,
            id,
        ]);

        res.status(200).json({ mensaje: "Usuario editado exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al editar al Usuario." });
    }
});

//Productos
app.get("/listproductos",authenticateToken, async (req, res) => {
    const productos = await db.query("SELECT * FROM productos")
    console.log(productos)
    res.json(productos)
})

//Marcas
app.get("/marcas",authenticateToken, async (req, res) => {
    const productos = await db.query(ListMarcas)
    res.json(productos)
})

app.post("/marcas",
    // Middleware de validación
    [
        body("nombre").notEmpty().withMessage("Debe haber un nombre."),
        body("descripcion").notEmpty().withMessage("Debe haber una descripcion."),
    ],
    async (req, res) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }

        const { nombre, descripcion, estado } = req.body;
        try {

            // Insertar el nuevo usuario en la base de datos
            await db.query("INSERT INTO marcas (nombreMarca, descripcion, estado) VALUES (?, ?, ?)", [
                nombre,
                descripcion,
                estado
            ]);

            res.status(201).json({ mensaje: "Marca registrada exitosamente." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al registrar la marca." });
        }
    }
);

app.delete("/marcas/:id",authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica si la categoría existe
        const categoria = await db.query("SELECT * FROM marcas WHERE idMarca = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada." });
        }

        // Eliminar la categoría
        await db.query("UPDATE marcas SET estado = false WHERE idMarca = ?", [id]);

        res.status(200).json({ mensaje: "Marcas eliminada exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la Marca." });
    }
});

app.put("/marcas/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {nombre, descripcion, estado} = req.body;
    try {
        // Verifica si la categoría existe
        const categoria = await db.query("SELECT * FROM marcas WHERE idMarca = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Marca no encontrada." });
        }

        // Eliminar la categoría
        await db.query("UPDATE marcas SET nombreMarca = ?, descripcion = ?, estado = ? WHERE idMarca = ?", [
            nombre,
            descripcion,
            estado,
            id,
        ]);

        res.status(200).json({ mensaje: "Marca editada exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al editar la marca." });
    }
});

//Categorias
app.get("/categoria",authenticateToken, async (req, res) => {
    const productos = await db.query(ListCategorias)
    console.log(productos)
    res.json(productos)
})

app.post("/categoria",
    // Middleware de validación
    [
        body("nombre").notEmpty().withMessage("Debe haber un nombre."),
        body("descripcion").notEmpty().withMessage("Debe haber una descripcion."),
    ],
    async (req, res) => {
        const errores = validationResult(req);
        if (!errores.isEmpty()) {
            return res.status(400).json({ errores: errores.array() });
        }

        const { nombre, descripcion } = req.body;
        try {

            // Insertar el nuevo usuario en la base de datos
            await db.query("INSERT INTO categorias (nombreCategoria, descripcion) VALUES (?, ?)", [
                nombre,
                descripcion
            ]);

            res.status(201).json({ mensaje: "Categoria registrada exitosamente." });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error al registrar la Categoria." });
        }
    }
);

app.delete("/categoria/:id",authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Verifica si la categoría existe
        const categoria = await db.query("SELECT * FROM categorias WHERE idCategoria = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada." });
        }

        // Eliminar la categoría
        await db.query("DELETE FROM categorias WHERE idCategoria = ?", [id]);

        res.status(200).json({ mensaje: "Categoría eliminada exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al eliminar la categoría." });
    }
});

app.put("/categoria/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {nombre, descripcion} = req.body;
    try {
        // Verifica si la categoría existe
        const categoria = await db.query("SELECT * FROM categorias WHERE idCategoria = ?", [id]);
        if (categoria.length === 0) {
            return res.status(404).json({ error: "Categoría no encontrada." });
        }

        // Eliminar la categoría
        await db.query("UPDATE categorias SET nombreCategoria = ?, descripcion = ? WHERE idCategoria = ?", [
            nombre,
            descripcion,
            id,
        ]);

        res.status(200).json({ mensaje: "Categoría editada exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al editar la categoría." });
    }
});