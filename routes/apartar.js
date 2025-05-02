const express = require("express");
const router = express.Router();
const supabase = require('../supabaseClient');

router.post("/", async (req, res) => {
  const { id_rifa, numeros, cedula, nombre, apellido, telefono, correo } = req.body;

  if (!id_rifa || !numeros || numeros.length === 0 || !nombre || !apellido || !telefono) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const fecha = new Date().toISOString();

  try {
    // Primero liberamos cualquier número apartado previo con la misma cédula
    if (cedula) {
      const { error: errorLiberacion } = await supabase
        .from('numeros_rifa')
        .update({
          estado: 'disponible',
          cedula: null,
          nombre: null,
          apellido: null,
          telefono: null,
          correo: null,
          fecha_apartado: null
        })
        .eq('id_rifa', id_rifa)
        .eq('cedula', cedula)
        .eq('estado', 'apartado');

      if (errorLiberacion) throw errorLiberacion;
    }

    // Ahora apartamos los nuevos números
    let actualizados = 0;
    const errores = [];

    for (const numeroId of numeros) {
      const { error } = await supabase
        .from('numeros_rifa')
        .update({
          estado: 'apartado',
          cedula,
          nombre,
          apellido,
          telefono,
          correo: correo || null,
          fecha_apartado: fecha
        })
        .eq('id', numeroId)
        .eq('estado', 'disponible');

      if (error) {
        errores.push({ id: numeroId, error: error.message });
      } else {
        actualizados++;
      }
    }

    res.json({
      mensaje: `${actualizados} número(s) apartados`,
      errores
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Error al apartar números" });
  }
});

module.exports = router;
