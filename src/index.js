const  express  = require("express")
const MysqlAdapter = require("./database")
const db = new MysqlAdapter()

const app = express()
app.set("port",4000)
app.listen(app.get("port"))
console.log('Escuchando comunicaciones al puerto'+app.get("port"))
db.init()

app.get("/productos", async (req, res) => {
    const productos = await db.query("SELECT * FROM producto")
    console.log(productos)
    res.json(productos)
})