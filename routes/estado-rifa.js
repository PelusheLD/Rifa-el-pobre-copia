const express = require("express");
const router = express.Router();
const supabase = require('../supabaseClient');

// Actualizar estado de la rifa (activar/desactivar)
router.put("/rifas/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (estado === undefined) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  const finalizada = estado === 1 ? 1 : 0;
  const activa = estado === 1 ? 0 : 1;

  try {
    const { error } = await supabase
      .from('rifas')
      .update({ 
        finalizada,
        activa 
      })
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: "Rifa actualizada correctamente" });
  } catch (err) {
    console.error('Error al actualizar la rifa:', err);
    res.status(500).json({ error: "Error al actualizar la rifa" });
  }
});

// Obtener la rifa activa
router.get("/rifas/activa", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rifas')
      .select('*')
      .eq('activa', true)
      .eq('finalizada', false)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "No hay rifa activa" });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Error al obtener la rifa activa:', err);
    res.status(500).json({ error: "Error al obtener la rifa activa" });
  }
});

module.exports = router;
