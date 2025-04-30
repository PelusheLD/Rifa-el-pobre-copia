const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query(
    `
    SELECT 
      MIN(n.id) as id,
      n.cedula,
      n.nombre,
      n.apellido,
      n.correo,
      n.telefono,
      n.estado,
      GROUP_CONCAT(n.numero ORDER BY n.numero) AS numeros
    FROM numeros_rifa n
    WHERE n.estado IN ('apartado', 'pagado')
    GROUP BY n.cedula, n.nombre, n.apellido, n.correo, n.telefono, n.estado
    `,
    (err, rows) => {
      if (err) {
        console.error("Error al obtener participantes:", err);
        return res
          .status(500)
          .json({ error: "Error al obtener participantes" });
      }

      const participantes = rows.map((p) => ({
        id: p.id,
        cedula: p.cedula,
        nombre: p.nombre,
        apellido: p.apellido,
        correo: p.correo,
        telefono: p.telefono,
        estado: p.estado,
        numeros: p.numeros ? p.numeros.split(",").map(Number) : [],
      }));

      res.json(participantes);
    }
  );
});
router.get("/detalles", (req, res) => {
  const { rifaId, cedula, estado } = req.query;

  if (!rifaId || !cedula || !estado) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros: rifaId, cedula o estado" });
  }

  db.query(
    `
    SELECT 
      n.cedula,
      n.nombre,
      n.apellido,
      n.correo,
      n.telefono,
      n.estado,
      GROUP_CONCAT(n.numero ORDER BY n.numero) AS numeros,
      MIN(n.fecha_apartado) AS fecha_apartado,
      MIN(n.fecha_pago) AS fecha_pago
    FROM numeros_rifa n
    WHERE n.id_rifa = ? AND n.cedula = ? AND n.estado = ?
    GROUP BY n.cedula, n.nombre, n.apellido, n.correo, n.telefono, n.estado
    `,
    [rifaId, cedula, estado],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener detalles:", err);
        return res.status(500).json({ error: "Error al obtener detalles" });
      }

      if (!rows.length) {
        return res.status(404).json({ error: "Participante no encontrado" });
      }

      const participante = rows[0];
      participante.numeros = participante.numeros
        ? participante.numeros.split(",").map(Number)
        : [];

      res.json(participante);
    }
  );
});

router.get("/detalles-por-cedula/:cedula", (req, res) => {
  const cedula = req.params.cedula;

  const query = `
    SELECT 
      nombre,
      apellido,
      correo,
      telefono,
      estado,
      GROUP_CONCAT(numero ORDER BY numero ASC) AS numeros
    FROM numeros_rifa
    WHERE cedula = ?
      AND estado IN ('apartado', 'pagado')
      AND id_rifa = (SELECT id FROM rifas WHERE activa = 1 LIMIT 1)
    GROUP BY estado
  `;

  db.query(query, [cedula], (err, rows) => {
    if (err) {
      console.error("Error al consultar por cédula:", err);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "No se encontró información" });
    }

    // Tomamos los datos personales del primer resultado
    const info = rows[0];

    const resultado = {
      cedula,
      nombre: info.nombre,
      apellido: info.apellido,
      correo: info.correo,
      telefono: info.telefono,
      pagado: [],
      apartado: [],
    };

    rows.forEach((row) => {
      const numeros = row.numeros ? row.numeros.split(",").map(Number) : [];
      if (row.estado === "pagado") resultado.pagado = numeros;
      else if (row.estado === "apartado") resultado.apartado = numeros;
    });

    res.json(resultado);
  });
});

// Buscar ID real del número basado en rifa y número
router.get("/buscar-id-numero", (req, res) => {
  const { rifaId, numero } = req.query;

  console.log("Recibido en buscar-id-numero:", { rifaId, numero }); // 👈 Agregado

  if (!rifaId || !numero) {
    console.error("Faltan parámetros en buscar-id-numero:", { rifaId, numero });
    return res.status(400).json({ error: "Faltan parámetros rifaId o numero" });
  }

  db.query(
    `
    SELECT id 
    FROM numeros_rifa 
    WHERE id_rifa = ? 
      AND numero = ? 
      AND estado IN ('apartado', 'pagado')
    LIMIT 1
    `,
    [rifaId, numero],
    (err, rows) => {
      if (err) {
        console.error("Error buscando ID de número:", err);
        return res.status(500).json({ error: "Error buscando el número" });
      }

      if (rows.length === 0) {
        console.error(
          `No se encontró el número ${numero} en la rifa ${rifaId}`
        );
        return res.status(404).json({ error: "Número no encontrado" });
      }

      console.log("ID encontrado:", rows[0].id);
      res.json({ id: rows[0].id });
    }
  );
});
router.get("/:rifaId", (req, res) => {
  const { rifaId } = req.params;

  db.query(
    `
    SELECT 
      n.cedula,
      n.nombre,
      n.apellido,
      n.correo,
      n.telefono,
      n.estado,
      COUNT(n.numero) AS cantidad_numeros
    FROM numeros_rifa n
    WHERE n.id_rifa = ? AND n.estado IN ('apartado', 'pagado')
    GROUP BY n.cedula, n.nombre, n.apellido, n.correo, n.telefono, n.estado
    `,
    [rifaId],
    (err, rows) => {
      if (err) {
        console.error("Error al obtener participantes de la rifa:", err);
        return res
          .status(500)
          .json({ error: "Error al obtener participantes de la rifa" });
      }

      const participantes = rows.map((p) => ({
        cedula: p.cedula,
        nombre: p.nombre,
        apellido: p.apellido,
        correo: p.correo,
        telefono: p.telefono,
        estado: p.estado,
        cantidad_numeros: p.cantidad_numeros,
      }));

      res.json(participantes);
    }
  );
});

// Confirmar el pago de un número
router.put("/confirmar-pago/:id", (req, res) => {
  const numeroId = req.params.id;

  console.log(`Confirmando pago para el número con ID: ${numeroId}`); // Verificar en los logs del servidor

  db.query(
    `UPDATE numeros_rifa
    SET estado = 'pagado', fecha_pago = NOW()
    WHERE id = ?`,
    [numeroId],
    (err, result) => {
      if (err) {
        console.error("Error al confirmar pago:", err);
        return res.status(500).json({ error: "Error al confirmar pago" });
      }
      console.log(`Número ${numeroId} actualizado correctamente`); // Verifica si el número fue actualizado
      res.json({ message: "Pago confirmado correctamente" });
    }
  );
});

// Liberar un número (dejarlo disponible)
router.put("/liberar-numero/:id", (req, res) => {
  const numeroId = req.params.id;

  db.query(
    `
    UPDATE numeros_rifa
    SET estado = 'disponible',
        cedula = NULL,
        nombre = NULL,
        apellido = NULL,
        correo = NULL,
        telefono = NULL,
        fecha_apartado = NULL,
        fecha_pago = NULL
    WHERE id = ?
    `,
    [numeroId],
    (err, result) => {
      if (err) {
        console.error("Error al liberar número:", err);
        return res.status(500).json({ error: "Error al liberar número" });
      }
      res.json({ message: "Número liberado correctamente" });
    }
  );
});

router.put("/:id/estado", (req, res) => {
  const numeroId = req.params.id;
  const { estado } = req.body;

  if (!["disponible", "apartado", "pagado"].includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  if (estado === "disponible") {
    db.query(
      `UPDATE numeros_rifa 
             SET estado = ?, cedula = NULL, nombre = NULL, apellido = NULL, correo = NULL, telefono = NULL, fecha_apartado = NULL, fecha_pago = NULL 
             WHERE id = ?`,
      [estado, numeroId],
      (err, result) => {
        if (err) {
          console.error("Error al actualizar estado del número:", err);
          return res
            .status(500)
            .json({ error: "Error al actualizar estado del número" });
        }
        res.json({ message: "Estado actualizado correctamente" });
      }
    );
  } else {
    db.query(
      `UPDATE numeros_rifa 
             SET estado = ?, 
                 fecha_pago = CASE WHEN ? = 'pagado' THEN NOW() ELSE fecha_pago END 
             WHERE id = ?`,
      [estado, estado, numeroId],
      (err, result) => {
        if (err) {
          console.error("Error al actualizar estado del número:", err);
          return res
            .status(500)
            .json({ error: "Error al actualizar estado del número" });
        }
        res.json({ message: "Estado actualizado correctamente" });
      }
    );
  }
});

module.exports = router;
