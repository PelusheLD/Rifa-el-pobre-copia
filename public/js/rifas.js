document.addEventListener("DOMContentLoaded", () => {
  const rifasContainer = document.getElementById("rifas-container");
  const paginationContainer = document.getElementById("pagination-container");

  const resultadosPorPagina = 6;
  let paginaActual = 1;

  fetch("http://localhost:3000/api/rifas")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Error al obtener las rifas");
      }
      return res.json();
    })
    .then((rifas) => {
      console.log("Rifas obtenidas:", rifas);

      if (rifas.length === 0) {
        rifasContainer.innerHTML =
          "<p class='text-center col-span-full text-gray-600'>No hay rifas disponibles.</p>";
        return;
      }

      // Función para mostrar las rifas de la página actual
      function mostrarRifas(pagina) {
        rifasContainer.innerHTML = ""; // Limpiar contenedor

        // Ordenar rifas por ID descendente (asumiendo que los IDs son secuenciales)
        const rifasOrdenadas = [...rifas].sort((a, b) => b.id - a.id);

        const inicio = (pagina - 1) * resultadosPorPagina;
        const fin = inicio + resultadosPorPagina;
        const rifasPagina = rifasOrdenadas.slice(inicio, fin);

        rifasPagina.forEach((rifa) => {
          const rifaCard = document.createElement("div");
          rifaCard.className =
            "bg-white shadow-md rounded-2xl overflow-hidden flex flex-col md:flex-row gap-4 p-5 mb-6 items-center";

          rifaCard.innerHTML = `
            <img 
              src="${rifa.imagen || "https://via.placeholder.com/200x150"}" 
              alt="Imagen de la rifa" 
              class="w-full md:w-48 h-32 object-cover rounded-lg shadow-md"
            />
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-800 mb-1">${
                rifa.titulo
              }</h2>
              <p class="text-gray-600 mb-2">${rifa.descripcion}</p>
              <p class="text-lg font-semibold text-blue-600 mb-2">${
                rifa.precio
              } Bs.</p>
              <span class="inline-block px-3 py-1 text-sm rounded-full ${
                rifa.finalizada === 1
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }">
                ${rifa.finalizada === 1 ? "Finalizada" : "Activa"}
              </span>
            </div>
          `;

          rifasContainer.appendChild(rifaCard);
        });
      }

      // Función para mostrar los botones de paginación
      function mostrarPaginacion() {
        paginationContainer.innerHTML = ""; // Limpiar contenedor de paginación

        const totalPaginas = Math.ceil(rifas.length / resultadosPorPagina);

        // Crear el botón "Anterior"
        if (paginaActual > 1) {
          const botonAnterior = document.createElement("button");
          botonAnterior.className =
            "px-4 py-2 bg-blue-500 text-white rounded mr-2";
          botonAnterior.textContent = "Anterior";
          botonAnterior.addEventListener("click", () => {
            paginaActual--;
            mostrarRifas(paginaActual);
            mostrarPaginacion();
          });
          paginationContainer.appendChild(botonAnterior);
        }

        // Crear los botones de página
        for (let i = 1; i <= totalPaginas; i++) {
          const botonPagina = document.createElement("button");
          botonPagina.className = `px-4 py-2 ${
            i === paginaActual
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-blue-100"
          } rounded mr-2`;
          botonPagina.textContent = i;
          botonPagina.addEventListener("click", () => {
            paginaActual = i;
            mostrarRifas(paginaActual);
            mostrarPaginacion();
          });
          paginationContainer.appendChild(botonPagina);
        }

        // Crear el botón "Siguiente"
        if (paginaActual < totalPaginas) {
          const botonSiguiente = document.createElement("button");
          botonSiguiente.className =
            "px-4 py-2 bg-blue-500 text-white rounded ml-2";
          botonSiguiente.textContent = "Siguiente";
          botonSiguiente.addEventListener("click", () => {
            paginaActual++;
            mostrarRifas(paginaActual);
            mostrarPaginacion();
          });
          paginationContainer.appendChild(botonSiguiente);
        }
      }

      // Mostrar las rifas y los botones de paginación iniciales
      mostrarRifas(paginaActual);
      mostrarPaginacion();
    })
    .catch((error) => {
      console.error("Error en el fetch:", error);
      rifasContainer.innerHTML =
        "<p class='text-red-600 col-span-full text-center'>Error al cargar rifas</p>";
    });
});
