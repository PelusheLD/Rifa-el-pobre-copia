function mostrarParticipantesDeRifa(rifaId) {
  const adminContent = document.getElementById("admin-content");
  adminContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Participantes de la Rifa #${rifaId}</h2>
    
    <div class="mb-4">
      <input 
        id="buscadorCedula" 
        type="text" 
        placeholder="Buscar por cédula..." 
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div id="tabla-participantes"></div>
    <div id="paginacion-participantes" class="mt-6 flex justify-center items-center flex-wrap gap-2"></div>
    <button class="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" onclick="mostrarRifas()">
      ← Volver a Rifas
    </button>
  `;

  const tablaContainer = document.getElementById("tabla-participantes");
  const paginacionContainer = document.getElementById(
    "paginacion-participantes"
  );

  const resultadosPorPagina = 10;
  let paginaActual = 1;
  let participantesOriginales = []; // << guardamos todos
  let participantesFiltrados = []; // << para búsqueda

  fetch(`/api/participantes/${rifaId}`)
    .then((res) => res.json())
    .then((participantes) => {
      participantes.sort((a, b) => {
        if (a.estado === b.estado) return 0;
        if (a.estado === "apartado") return -1;
        if (b.estado === "apartado") return 1;
        return 0;
      });

      if (!participantes.length) {
        tablaContainer.innerHTML = `<p class="text-gray-500">No hay participantes registrados aún.</p>`;
        return;
      }

      participantesOriginales = [...participantes];
      participantesFiltrados = [...participantes];

      function renderizarTabla(lista, pagina) {
        tablaContainer.innerHTML = "";

        const inicio = (pagina - 1) * resultadosPorPagina;
        const fin = inicio + resultadosPorPagina;
        const participantesPagina = lista.slice(inicio, fin);

        if (participantesPagina.length === 0) {
          tablaContainer.innerHTML = `<p class="text-gray-400">No se encontraron resultados.</p>`;
          return;
        }

        const tabla = document.createElement("table");
        tabla.className =
          "w-full bg-white rounded-lg shadow-md overflow-hidden text-sm mt-4";

        tabla.innerHTML = `
          <thead class="bg-gray-200 text-left">
            <tr>
              <th class="px-4 py-2">Cédula</th>
              <th class="px-4 py-2">Nombre</th>
              <th class="px-4 py-2">Correo</th>
              <th class="px-4 py-2">Teléfono</th>
              <th class="px-4 py-2">Cantidad de Números</th>
              <th class="px-4 py-2">Estado</th>
              <th class="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${participantesPagina
              .map(
                (p) => `
              <tr class="border-t">
                <td class="px-4 py-2">${p.cedula}</td>
                <td class="px-4 py-2">${p.nombre} ${p.apellido}</td>
                <td class="px-4 py-2">${p.correo || "-"}</td>
                <td class="px-4 py-2">${p.telefono || "-"}</td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs bg-blue-400">${
                    p.cantidad_numeros
                  }</span>
                </td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs ${
                    p.estado === "pagado" ? "bg-green-500" : "bg-yellow-500"
                  }">
                    ${p.estado}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs" onclick="mostrarNumerosDeParticipante('${
                    p.cedula
                  }', ${rifaId}, '${p.estado}')"

>
                    Ver Detalles
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        `;

        tablaContainer.appendChild(tabla);
      }

      function renderizarPaginacion(lista) {
        paginacionContainer.innerHTML = "";

        const totalPaginas = Math.ceil(lista.length / resultadosPorPagina);

        if (paginaActual > 1) {
          const botonAnterior = document.createElement("button");
          botonAnterior.className = "px-4 py-2 bg-blue-500 text-white rounded";
          botonAnterior.textContent = "Anterior";
          botonAnterior.addEventListener("click", () => {
            paginaActual--;
            renderizarTabla(lista, paginaActual);
            renderizarPaginacion(lista);
          });
          paginacionContainer.appendChild(botonAnterior);
        }

        for (let i = 1; i <= totalPaginas; i++) {
          const botonPagina = document.createElement("button");
          botonPagina.className = `px-4 py-2 ${
            i === paginaActual
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-100"
          } rounded`;
          botonPagina.textContent = i;
          botonPagina.addEventListener("click", () => {
            paginaActual = i;
            renderizarTabla(lista, paginaActual);
            renderizarPaginacion(lista);
          });
          paginacionContainer.appendChild(botonPagina);
        }

        if (paginaActual < totalPaginas) {
          const botonSiguiente = document.createElement("button");
          botonSiguiente.className = "px-4 py-2 bg-blue-500 text-white rounded";
          botonSiguiente.textContent = "Siguiente";
          botonSiguiente.addEventListener("click", () => {
            paginaActual++;
            renderizarTabla(lista, paginaActual);
            renderizarPaginacion(lista);
          });
          paginacionContainer.appendChild(botonSiguiente);
        }
      }

      // 🎯 Primero mostramos todo
      renderizarTabla(participantesFiltrados, paginaActual);
      renderizarPaginacion(participantesFiltrados);

      // 🎯 Buscador de cédula
      document
        .getElementById("buscadorCedula")
        .addEventListener("input", (e) => {
          const valor = e.target.value.trim().toLowerCase();

          participantesFiltrados = participantesOriginales.filter((p) =>
            p.cedula.toLowerCase().includes(valor)
          );

          paginaActual = 1;
          renderizarTabla(participantesFiltrados, paginaActual);
          renderizarPaginacion(participantesFiltrados);
        });
    })
    .catch((err) => {
      console.error("Error al cargar participantes:", err);
      tablaContainer.innerHTML = `<p class="text-red-600">Error al cargar participantes.</p>`;
    });
}
