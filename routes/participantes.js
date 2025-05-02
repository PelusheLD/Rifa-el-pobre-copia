const express = require("express");
const router = express.Router();
const supabase = require('../supabaseClient');

router.get("/", (req, res) => {
  supabase
    .from('numeros_rifa')
    .select('MIN(id) as id, cedula, nombre, apellido, correo, telefono, estado, GROUP_CONCAT(numero ORDER BY numero) AS numeros')
    .eq('estado', ['apartado', 'pagado'])
    .groupBy('cedula, nombre, apellido, correo, telefono, estado')
    .then(({ data, error }) => {
      if (error) {
        console.error("Error al obtener participantes:", error);
        return res
          .status(500)
          .json({ error: "Error al obtener participantes" });
      }

      const participantes = data.map((p) => ({
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
    });
});

router.get("/detalles", async (req, res) => {
  const { rifaId, cedula, estado } = req.query;

  if (!rifaId || !cedula || !estado) {
    return res
      .status(400)
      .json({ error: "Faltan parámetros: rifaId, cedula o estado" });
  }

  try {
    const { data, error } = await supabase
      .from('numeros_rifa')
      .select('cedula, nombre, apellido, correo, telefono, estado, numero, fecha_apartado, fecha_pago')
      .eq('id_rifa', rifaId)
      .eq('cedula', cedula)
      .eq('estado', estado);

    if (error) {
      console.error("Error al obtener detalles:", error);
      return res.status(500).json({ error: "Error al obtener detalles" });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: "Participante no encontrado" });
    }

    // Organizar la información
    const participante = {
      cedula: data[0].cedula,
      nombre: data[0].nombre,
      apellido: data[0].apellido,
      correo: data[0].correo,
      telefono: data[0].telefono,
      estado: data[0].estado,
      numeros: data.map(n => n.numero),
      fecha_apartado: data[0].fecha_apartado,
      fecha_pago: data[0].fecha_pago
    };

    res.json(participante);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/detalles-por-cedula/:cedula", async (req, res) => {
  const cedula = req.params.cedula;

  try {
    // Primero obtenemos la rifa activa
    const { data: rifaActiva, error: rifaError } = await supabase
      .from('rifas')
      .select('id')
      .eq('activa', true)
      .eq('finalizada', false)
      .single();

    if (rifaError) throw rifaError;

    // Luego obtenemos los números de la persona
    const { data: numeros, error: numerosError } = await supabase
      .from('numeros_rifa')
      .select('nombre, apellido, correo, telefono, estado, numero')
      .eq('cedula', cedula)
      .eq('id_rifa', rifaActiva.id)
      .in('estado', ['apartado', 'pagado']);

    if (numerosError) throw numerosError;

    if (numeros.length === 0) {
      return res.status(404).json({ error: "No se encontró información" });
    }

    // Organizamos la información
    const info = numeros[0];
    const resultado = {
      cedula,
      nombre: info.nombre,
      apellido: info.apellido,
      correo: info.correo,
      telefono: info.telefono,
      pagado: numeros.filter(n => n.estado === 'pagado').map(n => n.numero),
      apartado: numeros.filter(n => n.estado === 'apartado').map(n => n.numero)
    };

    res.json(resultado);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Buscar ID real del número basado en rifa y número
router.get("/buscar-id-numero", async (req, res) => {
  const { rifaId, numero } = req.query;

  console.log("Recibido en buscar-id-numero:", { rifaId, numero });

  if (!rifaId || !numero) {
    console.error("Faltan parámetros en buscar-id-numero:", { rifaId, numero });
    return res.status(400).json({ error: "Faltan parámetros rifaId o numero" });
  }

  try {
    const { data, error } = await supabase
      .from('numeros_rifa')
      .select('id')
      .eq('id_rifa', rifaId)
      .eq('numero', numero)
      .in('estado', ['apartado', 'pagado'])
      .single();

    if (error) {
      console.error("Error buscando ID de número:", error);
      return res.status(500).json({ error: "Error buscando el número" });
    }

    if (!data) {
      console.error(`No se encontró el número ${numero} en la rifa ${rifaId}`);
      return res.status(404).json({ error: "Número no encontrado" });
    }

    console.log("ID encontrado:", data.id);
    res.json({ id: data.id });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/:rifaId", (req, res) => {
  const { rifaId } = req.params;

  supabase
    .from('numeros_rifa')
    .select('cedula, nombre, apellido, correo, telefono, estado, numero')
    .eq('id_rifa', rifaId)
    .in('estado', ['apartado', 'pagado'])
    .then(({ data, error }) => {
      if (error) {
        console.error("Error al obtener participantes de la rifa:", error);
        return res
          .status(500)
          .json({ error: "Error al obtener participantes de la rifa" });
      }

      // Agrupar por participante y contar números
      const participantesMap = new Map();
      data.forEach(p => {
        const key = `${p.cedula}-${p.estado}`;
        if (!participantesMap.has(key)) {
          participantesMap.set(key, {
            cedula: p.cedula,
            nombre: p.nombre,
            apellido: p.apellido,
            correo: p.correo,
            telefono: p.telefono,
            estado: p.estado,
            cantidad_numeros: 1
          });
        } else {
          participantesMap.get(key).cantidad_numeros++;
        }
      });

      const participantes = Array.from(participantesMap.values());

      res.json(participantes);
    });
});

// Confirmar el pago de un número
router.put("/confirmar-pago/:id", async (req, res) => {
  const numeroId = req.params.id;

  try {
    const { error } = await supabase
      .from('numeros_rifa')
      .update({ 
        estado: 'pagado',
        fecha_pago: new Date().toISOString()
      })
      .eq('id', numeroId);

    if (error) throw error;
    
    res.json({ message: "Pago confirmado correctamente" });
  } catch (err) {
    console.error('Error al confirmar pago:', err);
    res.status(500).json({ error: "Error al confirmar pago" });
  }
});

// Liberar un número (dejarlo disponible)
router.put("/liberar-numero/:id", (req, res) => {
  const numeroId = req.params.id;

  supabase
    .from('numeros_rifa')
    .update({
      estado: 'disponible',
      cedula: null,
      nombre: null,
      apellido: null,
      correo: null,
      telefono: null,
      fecha_apartado: null,
      fecha_pago: null
    })
    .eq('id', numeroId)
    .then(({ error }) => {
      if (error) {
        console.error("Error al liberar número:", error);
        return res.status(500).json({ error: "Error al liberar número" });
      }
      res.json({ message: "Número liberado correctamente" });
    });
});

router.put("/:id/estado", (req, res) => {
  const numeroId = req.params.id;
  const { estado } = req.body;

  if (!["disponible", "apartado", "pagado"].includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  if (estado === "disponible") {
    supabase
      .from('numeros_rifa')
      .update({
        estado: estado,
        cedula: null,
        nombre: null,
        apellido: null,
        correo: null,
        telefono: null,
        fecha_apartado: null,
        fecha_pago: null
      })
      .eq('id', numeroId)
      .then(({ error }) => {
        if (error) {
          console.error("Error al actualizar estado del número:", error);
          return res
            .status(500)
            .json({ error: "Error al actualizar estado del número" });
        }
        res.json({ message: "Estado actualizado correctamente" });
      });
  } else {
    supabase
      .from('numeros_rifa')
      .update({
        estado: estado,
        fecha_pago: estado === 'pagado' ? new Date().toISOString() : 'fecha_pago'
      })
      .eq('id', numeroId)
      .then(({ error }) => {
        if (error) {
          console.error("Error al actualizar estado del número:", error);
          return res
            .status(500)
            .json({ error: "Error al actualizar estado del número" });
        }
        res.json({ message: "Estado actualizado correctamente" });
      });
  }
});

module.exports = router;
