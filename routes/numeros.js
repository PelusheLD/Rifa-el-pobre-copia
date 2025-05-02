const express = require("express");
const router = express.Router();
const supabase = require('../supabaseClient');

router.get("/:rifaId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('numeros_rifa')
      .select('id, numero, estado')
      .eq('id_rifa', req.params.rifaId)
      .order('numero');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: "Error al obtener números" });
  }
});

module.exports = router;
