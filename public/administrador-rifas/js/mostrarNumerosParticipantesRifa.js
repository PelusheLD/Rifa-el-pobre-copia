let cedulaActual = null; // Variable global para la cédula
let rifaIdActual = null; // Variable global para el ID de la rifa
let estadoActual = null; // ← nueva variable

function mostrarNumerosDeParticipante(cedula, rifaId, estado) {
  cedulaActual = cedula;
  rifaIdActual = rifaId;
  estadoActual = estado; // ← guardamos el estado actual

  const adminContent = document.getElementById("admin-content");
  adminContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Detalles del Participante</h2>
    <div id="tabla-detalles"></div>
    <button class="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" onclick="mostrarParticipantesDeRifa(${rifaId})">
      ← Volver a Participantes
    </button>
  `;

  const tablaContainer = document.getElementById("tabla-detalles");

  fetch(
    `/api/participantes/detalles?rifaId=${rifaId}&cedula=${cedula}&estado=${estado}`
  )
    .then((res) => res.json())
    .then((participante) => {
      if (
        !participante ||
        !Array.isArray(participante.numeros) ||
        participante.numeros.length === 0
      ) {
        const mensaje =
          estado === "pagado"
            ? "No se encontraron números pagados por este participante."
            : "No se encontraron números apartados por este participante.";
        tablaContainer.innerHTML = `<p class="text-gray-500">${mensaje}</p>`;
        return;
      }

      const info = `
        <div class="bg-white p-4 rounded-lg shadow-md mb-6 text-sm">
          <p><strong>Cédula:</strong> ${participante.cedula}</p>
          <p><strong>Nombre:</strong> ${participante.nombre} ${
        participante.apellido
      }</p>
          <p><strong>Correo:</strong> ${participante.correo || "-"}</p>
          <p><strong>Teléfono:</strong> ${participante.telefono || "-"}</p>
        </div>
      `;
      tablaContainer.innerHTML = info;

      const filas = participante.numeros
        .map(
          (numero) => `
        <tr class="border-t">
          <td class="px-4 py-2">
            <span class="inline-block px-2 py-1 rounded-full text-white text-xs bg-blue-400">${numero}</span>
          </td>
          <td class="px-4 py-2">
            <span class="inline-block px-2 py-1 rounded-full text-white text-xs ${
              estado === "pagado" ? "bg-green-500" : "bg-yellow-500"
            }">${estado}</span>
          </td>
          <td class="px-4 py-2">${participante.fecha_apartado || "-"}</td>
          <td class="px-4 py-2">${participante.fecha_pago || "-"}</td>
          <td class="px-4 py-2 flex gap-2">
            <button class="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs" onclick="confirmarPago(${numero})">Confirmar Pago</button>
            <button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs" onclick="liberarNumero(${numero})">Liberar Número</button>
          </td>
        </tr>
      `
        )
        .join("");

      tablaContainer.innerHTML += `
        <table class="w-full bg-white rounded-lg shadow-md overflow-hidden text-sm">
          <thead class="bg-gray-200 text-left">
            <tr>
              <th class="px-4 py-2">Número</th>
              <th class="px-4 py-2">Estado</th>
              <th class="px-4 py-2">Fecha Apartado</th>
              <th class="px-4 py-2">Fecha Pago</th>
              <th class="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      `;
    })
    .catch((err) => {
      console.error("Error al cargar detalles:", err);
      tablaContainer.innerHTML = `<p class="text-red-600">Error al cargar detalles del participante.</p>`;
    });
}
