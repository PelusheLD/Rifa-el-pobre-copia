const supabase = require("../supabaseClient");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const rifaId = req.url.split("/").pop();
      const { data, error } = await supabase
        .from("numeros_rifa")
        .select("id, numero, estado")
        .eq("id_rifa", rifaId)
        .order("numero");

      if (error) throw error;
      res.status(200).json(data);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Error al obtener números" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
};
