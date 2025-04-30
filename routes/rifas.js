const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener todas las rifas
router.get("/", (req, res) => {
  db.query(
    `
    SELECT 
      r.*, 
      COALESCE(SUM(CASE WHEN n.estado = 'pagado' THEN 1 ELSE 0 END), 0) AS numeros_pagados,
      COALESCE(SUM(CASE WHEN n.estado = 'apartado' THEN 1 ELSE 0 END), 0) AS numeros_apartados
    FROM rifas r
    LEFT JOIN numeros_rifa n ON r.id = n.id_rifa
    GROUP BY r.id
    ORDER BY r.id DESC
    `,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Error al obtener rifas" });
      res.json(results);
    }
  );
});

// Obtener rifa activa
router.get("/activa", (req, res) => {
  db.query(
    "SELECT * FROM rifas WHERE activa = 1 AND finalizada = 0 LIMIT 1",
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "Error al obtener activa" });
      if (results.length === 0)
        return res.status(404).json({ error: "No hay rifa activa" });
      res.json(results[0]);
    }
  );
});

// Crear rifa
router.post("/", (req, res) => {
  const {
    titulo,
    descripcion,
    precio,
    imagen,
    activa,
    finalizada,
    cantidad_numeros,
  } = req.body;

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
      parseInt(cantidad_numeros),
    ];

    db.query(sql, values, (err, result) => {
      if (err)
        return res.status(500).json({ error: "Error al insertar la rifa" });

      const id_rifa = result.insertId;
      if (cantidad_numeros > 0) {
        const numeros = [];
        for (let i = 1; i <= cantidad_numeros; i++) {
          numeros.push([i, id_rifa]);
        }

        db.query(
          "INSERT INTO numeros_rifa (numero, id_rifa) VALUES ?",
          [numeros],
          (err) => {
            if (err)
              return res
                .status(500)
                .json({ error: "Error al generar números" });
            res
              .status(201)
              .json({ message: "Rifa y números creados", id: id_rifa });
          }
        );
      } else {
        res
          .status(201)
          .json({ message: "Rifa creada sin números", id: id_rifa });
      }
    });
  }

  if (activa) {
    db.query(
      "SELECT COUNT(*) AS total FROM rifas WHERE activa = 1 AND finalizada = 0",
      (err, result) => {
        if (err)
          return res.status(500).json({ error: "Error al verificar activa" });
        if (result[0].total > 0) {
          return res.status(400).json({ error: "Ya hay una rifa activa" });
        }
        insertarRifa();
      }
    );
  } else {
    insertarRifa();
  }
});

// Cambiar estado de rifa
router.put("/:id", (req, res) => {
  const { estado } = req.body;
  const finalizada = estado === 1 ? 1 : 0;
  const activa = estado === 1 ? 0 : 1;
  db.query(
    "UPDATE rifas SET finalizada = ?, activa = ? WHERE id = ?",
    [finalizada, activa, req.params.id],
    (err) => {
      if (err)
        return res.status(500).json({ error: "Error al actualizar estado" });
      res.json({ message: "Estado actualizado correctamente" });
    }
  );
});

module.exports = router;
