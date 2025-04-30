function mostrarRifas() {
  const adminContent = document.getElementById("admin-content");
  adminContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-4">Lista de Rifas</h2>

    <div class="mb-4">
      <input id="buscadorRifa" type="text" placeholder="Buscar por número de rifa..." 
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div id="tabla-rifas"></div>
    <div id="paginacion-rifas" class="mt-6 flex justify-center items-center flex-wrap gap-2"></div>
  `;

  const tablaContainer = document.getElementById("tabla-rifas");
  const paginacionContainer = document.getElementById("paginacion-rifas");

  const resultadosPorPagina = 10;
  let paginaActual = 1;
  let rifasOriginales = [];
  let rifasFiltradas = [];

  fetch("/api/rifas")
    .then((res) => res.json())
    .then((rifas) => {
      if (!rifas.length) {
        tablaContainer.innerHTML = `<p class="text-gray-500">No hay rifas registradas.</p>`;
        return;
      }

      const rifasOrdenadas = [...rifas].sort((a, b) => b.id - a.id);
      rifasOriginales = [...rifasOrdenadas];
      rifasFiltradas = [...rifasOrdenadas];

      function renderizarTabla(lista, pagina) {
        tablaContainer.innerHTML = "";

        const inicio = (pagina - 1) * resultadosPorPagina;
        const fin = inicio + resultadosPorPagina;
        const rifasPagina = lista.slice(inicio, fin);

        const tabla = document.createElement("table");
        tabla.className =
          "w-full bg-white rounded-lg shadow-md overflow-hidden text-sm";

        tabla.innerHTML = `
          <thead class="bg-gray-200 text-left">
            <tr>
              <th class="px-4 py-2"># Rifa</th>
              <th class="px-4 py-2">Título</th>
              <th class="px-4 py-2">Vendidos</th>
              <th class="px-4 py-2">Apartados</th>
              <th class="px-4 py-2">Total de Números</th>
              <th class="px-4 py-2">Estado</th>
              <th class="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${rifasPagina
              .map(
                (rifa) => `
              <tr class="border-t">
                <td class="px-4 py-2 font-bold text-blue-700">${rifa.id}</td>
                <td class="px-4 py-2">${rifa.titulo}</td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs bg-blue-400">${
                    rifa.numeros_pagados || 0
                  }</span>
                </td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs bg-green-400">${
                    rifa.numeros_apartados || 0
                  }</span>
                </td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs bg-red-400">${
                    rifa.cantidad_numeros
                  }</span>
                </td>
                <td class="px-4 py-2">
                  <span class="inline-block px-2 py-1 rounded-full text-white text-xs ${
                    rifa.activa ? "bg-green-500" : "bg-gray-500"
                  }">
                    ${rifa.activa ? "activa" : "finalizada"}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs" onclick="mostrarParticipantesDeRifa(${
                    rifa.id
                  })">
                    Ver Participantes
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

      renderizarTabla(rifasFiltradas, paginaActual);
      renderizarPaginacion(rifasFiltradas);

      // 🎯 Buscador por ID de rifa
      document.getElementById("buscadorRifa").addEventListener("input", (e) => {
        const valor = e.target.value.trim();
        if (valor === "") {
          rifasFiltradas = [...rifasOriginales];
        } else {
          rifasFiltradas = rifasOriginales.filter((r) =>
            r.id.toString().includes(valor)
          );
        }
        paginaActual = 1;
        renderizarTabla(rifasFiltradas, paginaActual);
        renderizarPaginacion(rifasFiltradas);
      });
    })
    .catch((err) => {
      console.error("Error al cargar rifas:", err);
      tablaContainer.innerHTML = `<p class="text-red-600">Error al cargar rifas.</p>`;
    });
}
