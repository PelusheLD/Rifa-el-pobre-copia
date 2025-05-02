const supabase = require("../supabaseClient");

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      // Primero obtenemos todas las rifas
      const { data: rifas, error: rifasError } = await supabase
        .from("rifas")
        .select("*")
        .order("id", { ascending: false });

      if (rifasError) throw rifasError;

      // Luego obtenemos los conteos de números para cada rifa
      const rifasConConteo = await Promise.all(
        rifas.map(async (rifa) => {
          const { data: numeros, error: numerosError } = await supabase
            .from("numeros_rifa")
            .select("estado")
            .eq("id_rifa", rifa.id);

          if (numerosError) throw numerosError;

          const numerosPagados = numeros.filter(
            (n) => n.estado === "pagado"
          ).length;
          const numerosApartados = numeros.filter(
            (n) => n.estado === "apartado"
          ).length;

          return {
            ...rifa,
            numeros_pagados: numerosPagados,
            numeros_apartados: numerosApartados,
          };
        })
      );

      res.status(200).json(rifasConConteo);
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Error al obtener rifas" });
    }
  } else if (req.method === "POST") {
    const {
      titulo,
      descripcion,
      precio,
      imagen,
      activa,
      finalizada,
      cantidad_numeros,
    } = req.body;

    try {
      // Verificar si ya existe una rifa activa
      if (activa) {
        const { data: rifasActivas, error: errorVerificacion } = await supabase
          .from("rifas")
          .select("id")
          .eq("activa", true)
          .eq("finalizada", false);

        if (errorVerificacion) throw errorVerificacion;

        if (rifasActivas.length > 0) {
          return res.status(400).json({ error: "Ya hay una rifa activa" });
        }
      }

      // Insertar la nueva rifa
      const { data: nuevaRifa, error: errorRifa } = await supabase
        .from("rifas")
        .insert([
          {
            titulo,
            descripcion,
            precio,
            imagen,
            activa,
            finalizada,
            cantidad_numeros: parseInt(cantidad_numeros),
          },
        ])
        .select()
        .single();

      if (errorRifa) throw errorRifa;

      // Generar números si es necesario
      if (cantidad_numeros > 0) {
        const numeros = Array.from({ length: cantidad_numeros }, (_, i) => ({
          numero: i + 1,
          id_rifa: nuevaRifa.id,
          estado: "disponible",
        }));

        const { error: errorNumeros } = await supabase
          .from("numeros_rifa")
          .insert(numeros);

        if (errorNumeros) throw errorNumeros;
      }

      res.status(201).json({
        message:
          cantidad_numeros > 0
            ? "Rifa y números creados"
            : "Rifa creada sin números",
        id: nuevaRifa.id,
      });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Error al crear la rifa" });
    }
  } else if (req.method === "PUT") {
    const { estado } = req.body;
    const rifaId = req.url.split("/").pop();

    try {
      // Si vamos a activar una rifa, primero verificamos que no haya otra activa
      if (estado === 1) {
        const { data: rifasActivas, error: errorVerificacion } = await supabase
          .from("rifas")
          .select("id")
          .eq("activa", true)
          .eq("finalizada", false);

        if (errorVerificacion) throw errorVerificacion;

        if (
          rifasActivas.length > 0 &&
          !rifasActivas.some((r) => r.id === parseInt(rifaId))
        ) {
          return res.status(400).json({ error: "Ya hay una rifa activa" });
        }

        // Activar la rifa
        const { error } = await supabase
          .from("rifas")
          .update({ activa: true, finalizada: false })
          .eq("id", rifaId);

        if (error) throw error;
      } else {
        // Finalizar la rifa
        const { error } = await supabase
          .from("rifas")
          .update({ activa: false, finalizada: true })
          .eq("id", rifaId);

        if (error) throw error;
      }

      res.status(200).json({ message: "Estado actualizado correctamente" });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
};
