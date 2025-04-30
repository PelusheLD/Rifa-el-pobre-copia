const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const db = require("../db");

// Actualizar estado de la rifa (activar/desactivar)
router.put("/rifas/:id", (req, res) => {
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

// Obtener la rifa activa
router.get("/rifas/activa", (req, res) => {
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

module.exports = router;
