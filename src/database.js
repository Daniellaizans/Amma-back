const mysql = require("promise-mysql")
const dotenv = require("dotenv")
dotenv.config()

class MysqlAdapter {
    constructor() {
      this.credentials = {
        host: process.env.HOST,
        user: process.env.USER,
        database: process.env.DATABASE,
        password: process.env.PASSWORD,
      };
      this.db = null; // Conexión inicializada como null
    }
  
    async init() {
      try {
        // Crear la conexión
        this.db = await mysql.createConnection(this.credentials);
        console.log("Conexión exitosa a la base de datos");
        this.checkTableExists()
      } catch (error) {
        console.error("Error al conectar a la base de datos:", error.message);
        throw error; // Opcional: lanzar el error si quieres manejarlo más arriba
      }
    }
  
    async query(sql, params = []) {
      if (!this.db) {
        throw new Error("La conexión a la base de datos no está inicializada");
      }
      try {
        return await this.db.query(sql, params);
      } catch (error) {
        console.error("Error al ejecutar la consulta:", error.message);
        throw error;
      }
    }
  
    async close() {
      if (this.db) {
        await this.db.end();
        console.log("Conexión a la base de datos cerrada");
      }
    }

    checkTableExists = () =>
      new Promise((resolve) => {
          const sql = "SHOW DATABASES LIKE '%minna%'";

          this.db.query(sql, (err, rows) => {
              if (err) throw err

              if (!rows.length) {
                  console.log('Base de datos no encontrada')
              } else {
                console.log('lito')
              }

              resolve(!!rows.length);
          });
      })
  }

module.exports = MysqlAdapter