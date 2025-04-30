function mostrarFormularioCrearRifa() {
  const adminContent = document.getElementById("admin-content");

  adminContent.innerHTML = `
  <div class="bg-white shadow-lg rounded-xl p-8 max-w-5xl mx-auto">
    <h2 class="text-3xl font-bold text-gray-800 mb-8 text-center">Crear Nueva Rifa</h2>
    <form id="form-crear-rifa" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-gray-700 mb-1 font-semibold" for="titulo">Título</label>
        <input type="text" name="titulo" id="titulo" required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-gray-700 mb-1 font-semibold" for="descripcion">Descripción</label>
        <input type="text" name="descripcion" id="descripcion" required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-gray-700 mb-1 font-semibold" for="precio">Precio del ticket</label>
        <input type="number" name="precio" id="precio" required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-gray-700 mb-1 font-semibold" for="cantidad_numeros">Cantidad de Números</label>
        <input type="number" name="cantidad_numeros" id="cantidad_numeros" required
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="md:col-span-2">
        <label class="block text-gray-700 mb-1 font-semibold" for="imagen">URL de la imagen (opcional)</label>
        <input type="text" name="imagen" id="imagen"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="md:col-span-2 flex flex-wrap items-center gap-6 mt-2">
        <label class="flex items-center gap-2">
          <input type="checkbox" name="activa" checked class="form-checkbox text-blue-600" />
          <span class="text-gray-700 font-medium">Activa</span>
        </label>
        <label class="flex items-center gap-2">
          <input type="checkbox" name="finalizada" class="form-checkbox text-blue-600" />
          <span class="text-gray-700 font-medium">Finalizada</span>
        </label>
      </div>
      <div class="md:col-span-2 text-center mt-4">
        <button type="submit"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow transition duration-200">
          Crear Rifa
        </button>
      </div>
      <div id="respuesta" class="md:col-span-2 text-center mt-2 text-green-600 font-medium"></div>
    </form>
  </div>
`;

  const form = document.getElementById("form-crear-rifa");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const respuestaEl = document.getElementById("respuesta");

    // Solo si el checkbox "activa" está marcado, verificamos
    if (form.activa.checked) {
      const rifasRes = await fetch("/api/rifas");
      const rifas = await rifasRes.json();
      const hayActiva = rifas.some((r) => r.activa && !r.finalizada);

      if (hayActiva) {
        mostrarToast(
          "Ya hay una rifa activa. Finalízala antes de crear una nueva.",
          "error"
        );
        return;
      }
    }

    // Si pasamos la verificación, se procede
    const data = {
      titulo: form.titulo.value,
      descripcion: form.descripcion.value,
      precio: parseInt(form.precio.value),
      imagen: form.imagen.value || null,
      activa: form.activa.checked ? 1 : 0,
      finalizada: form.finalizada.checked ? 1 : 0,
      cantidad_numeros: parseInt(form.cantidad_numeros.value),
    };

    try {
      const res = await fetch("/api/rifas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        mostrarToast(result.message, "success");
        form.reset();
      } else {
        mostrarToast(result.error || "Error al crear la rifa", "error");
      }
    } catch (err) {
      mostrarToast("Error al enviar los datos", "error");
    }
  });
}
