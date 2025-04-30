const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const { id_rifa, numeros, cedula, nombre, apellido, telefono, correo } =
    req.body;
  const fecha = new Date();

  if (
    !id_rifa ||
    !numeros?.length ||
    !cedula ||
    !nombre ||
    !apellido ||
    !telefono
  ) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  // 1. Primero actualizamos todos los registros existentes de esa cédula en la rifa
  const actualizarDatosPrevios = `
    UPDATE numeros_rifa 
    SET nombre = ?, apellido = ?, telefono = ?, correo = ?
    WHERE id_rifa = ? AND cedula = ?
  `;

  db.query(
    actualizarDatosPrevios,
    [nombre, apellido, telefono, correo || null, id_rifa, cedula],
    (err) => {
      if (err) {
        console.error("Error actualizando datos previos:", err);
        return res
          .status(500)
          .json({ error: "Error al actualizar datos anteriores" });
      }

      // 2. Ahora apartamos los nuevos números
      const query = `
        UPDATE numeros_rifa 
        SET estado = 'apartado', cedula = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, fecha_apartado = ?
        WHERE id = ? AND estado = 'disponible'
      `;

      let actualizados = 0;
      const errores = [];

      const actualizarSiguiente = (i) => {
        if (i >= numeros.length) {
          return res.json({
            mensaje: `${actualizados} número(s) apartados`,
            errores,
          });
        }

        db.query(
          query,
          [
            cedula,
            nombre,
            apellido,
            telefono,
            correo || null,
            fecha,
            numeros[i],
          ],
          (err, result) => {
            if (err) errores.push({ id: numeros[i], error: err.message });
            else if (result.affectedRows > 0) actualizados++;
            actualizarSiguiente(i + 1);
          }
        );
      };

      actualizarSiguiente(0);
    }
  );
});

module.exports = router;
