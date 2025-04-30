const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:rifaId", (req, res) => {
  db.query(
    "SELECT id, numero, estado FROM numeros_rifa WHERE id_rifa = ? ORDER BY numero ASC",
    [req.params.rifaId],
    (err, results) => {
      if (err)
        return res.status(500).json({ error: "Error al obtener números" });
      res.json(results);
    }
  );
});

module.exports = router;
