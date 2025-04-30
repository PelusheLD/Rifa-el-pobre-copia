const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos MySQL");
  }
});
app.get("/api/rifas", (req, res) => {
  const query = "SELECT * FROM rifas";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener rifas:", err);
      res.status(500).json({ error: "Error al obtener rifas" });
    } else {
      res.json(results);
    }
  });
});

app.post("/api/rifas", (req, res) => {
  const {
    titulo,
    descripcion,
    precio,
    imagen,
    activa,
    finalizada,
    cantidad_numeros,
  } = req.body;
  console.log(req.body);

  if (activa) {
    const checkQuery =
      "SELECT COUNT(*) AS total FROM rifas WHERE activa = 1 AND finalizada = 0";
    db.query(checkQuery, (err, result) => {
      if (err) {
        console.error("Error al verificar rifas activas:", err);
        return res
          .status(500)
          .json({ error: "Error al verificar rifas activas" });
      }

      if (result[0].total > 0) {
        return res.status(400).json({
          error:
            "Ya existe una rifa activa. Debes finalizarla antes de crear una nueva.",
        });
      }

      insertarRifa();
    });
  } else {
    insertarRifa();
  }

  function insertarRifa() {
    const sql =
      "INSERT INTO rifas (titulo, descripcion, precio, imagen, activa, finalizada, cantidad_numeros) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [
      titulo,
      descripcion,
      precio,
      imagen,
      activa,
      finalizada,
      parseInt(cantidad_numeros), // <-- Asegúrate que sea número
    ];
    console.log("Valores a insertar:", values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error al insertar la rifa:", err);
        return res.status(500).json({ error: "Error al insertar la rifa" });
      }

      const id_rifa = result.insertId;

      // Si se proporciona la cantidad de números, insertarlos en la tabla numeros_rifa
      if (cantidad_numeros && parseInt(cantidad_numeros) > 0) {
        const numeros = [];
        for (let i = 1; i <= cantidad_numeros; i++) {
          numeros.push([i, id_rifa]);
        }

        const insertNumerosQuery =
          "INSERT INTO numeros_rifa (numero, id_rifa) VALUES ?";
        db.query(insertNumerosQuery, [numeros], (err) => {
          if (err) {
            console.error("Error al insertar los números de la rifa:", err);
            return res
              .status(500)
              .json({ error: "Rifa creada, pero error al generar números" });
          }

          return res.status(201).json({
            message: "Rifa y números creados exitosamente",
            id: id_rifa,
          });
        });
      } else {
        res.status(201).json({
          message: "Rifa creada exitosamente (sin números generados)",
          id: id_rifa,
        });
      }
    });
  }
});

const path = require("path");
const auth = require("basic-auth");

const adminAuth = (req, res, next) => {
  const user = auth(req);
  if (
    user &&
    user.name === process.env.ADMIN_USER &&
    user.pass === process.env.ADMIN_PASS
  ) {
    return next();
  }
  res.set("WWW-Authenticate", 'Basic realm="Admin Area"');
  res.status(401).send("Acceso denegado");
};

app.get("/admin", adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

app.use(express.json());

app.put("/api/rifas/:id", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado === undefined) {
    return res.status(400).json({ error: "Estado requerido" });
  }
  const finalizada = estado === 1 ? 1 : 0;
  const activa = estado === 1 ? 0 : 1;

  const sql = "UPDATE rifas SET finalizada = ?, activa = ? WHERE id = ?";
  db.query(sql, [finalizada, activa, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar la rifa:", err);
      return res.status(500).json({ error: "Error al actualizar la rifa" });
    }

    res.json({ message: "Rifa actualizada correctamente" });
  });
});

app.get("/api/rifas/activa", (req, res) => {
  const query =
    "SELECT * FROM rifas WHERE activa = 1 AND finalizada = 0 LIMIT 1";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener la rifa activa:", err);
      return res.status(500).json({ error: "Error al obtener la rifa activa" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No hay rifa activa" });
    }

    res.json(results[0]);
  });
});

app.get("/api/numeros/:rifaId", (req, res) => {
  const { rifaId } = req.params;

  const query =
    "SELECT id, numero, estado FROM numeros_rifa WHERE id_rifa = ? ORDER BY numero ASC";

  db.query(query, [rifaId], (err, results) => {
    if (err) {
      console.error("Error al obtener los números:", err);
      return res.status(500).json({ error: "Error al obtener los números" });
    }

    res.json(results);
  });
});

app.use(express.json());

app.post("/api/apartar", (req, res) => {
  const { id_rifa, numeros, nombre, apellido, telefono, correo } = req.body;

  if (
    !id_rifa ||
    !numeros ||
    numeros.length === 0 ||
    !nombre ||
    !apellido ||
    !telefono
  ) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const fecha = new Date();

  const query = `
    UPDATE numeros_rifa 
    SET estado = 'apartado', nombre = ?, apellido = ?, telefono = ?, correo = ?, fecha_apartado = ? 
    WHERE id = ? AND estado = 'disponible'
  `;

  let actualizados = 0;
  const errores = [];

  const actualizarSiguiente = (index) => {
    if (index >= numeros.length) {
      return res.json({
        mensaje: `${actualizados} número(s) apartados`,
        errores,
      });
    }

    const idNumero = numeros[index];

    db.query(
      query,
      [nombre, apellido, telefono, correo || null, fecha, idNumero],
      (err, result) => {
        if (err) {
          console.error(`Error actualizando número ${idNumero}:`, err);
          errores.push({ id: idNumero, error: err.message });
        } else if (result.affectedRows > 0) {
          actualizados++;
        }
        actualizarSiguiente(index + 1);
      }
    );
  };

  actualizarSiguiente(0);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
