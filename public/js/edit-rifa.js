let currentPage = 1;
const itemsPerPage = 6;

function mostrarFormularioEditarEstado() {
  const adminContent = document.getElementById("admin-content");

  adminContent.innerHTML = `
    <h2 class="text-2xl font-semibold mb-4">Editar Estado de Rifas</h2>
    <div id="rifas-lista" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    <div id="pagination" class="flex justify-center mt-6"></div>
  `;

  fetch("/api/rifas")
    .then((res) => res.json())
    .then((rifas) => {
      // Ordenamos por ID de manera descendente
      rifas.sort((a, b) => b.id - a.id);

      // Detectamos si ya hay una rifa activa
      const rifaActiva = rifas.find(
        (r) => r.activa === true && r.finalizada === false
      );

      // Paginación
      const totalPages = Math.ceil(rifas.length / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const rifasPagina = rifas.slice(startIndex, endIndex);

      const rifasLista = document.getElementById("rifas-lista");
      rifasLista.innerHTML = "";

      rifasPagina.forEach((rifa) => {
        const rifaCard = document.createElement("div");
        rifaCard.className =
          "bg-white shadow-lg rounded-xl p-6 border border-gray-200";

        rifaCard.innerHTML = `
          ${
            rifa.imagen
              ? `<img src="${rifa.imagen}" alt="Imagen de la rifa" class="w-full h-45 object-cover rounded-md mb-4 shadow-sm">`
              : ""
          }
          <h3 class="text-xl font-bold mb-2 text-blue-800">${rifa.titulo}</h3>
          <p class="text-gray-700 mb-2">Descripción: ${rifa.descripcion}</p>
          <p class="text-gray-700 text-lg mb-2">Precio: ${rifa.precio} Bs.</p>
          <p class="mb-4">
            <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              rifa.finalizada
                ? "bg-red-100 text-red-800"
                : rifa.activa
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }">
              ${
                rifa.finalizada
                  ? "Finalizada"
                  : rifa.activa
                  ? "Activa"
                  : "Inactiva"
              }
            </span>
          </p>
          <div class="space-x-2">
            <button
              class="bg-yellow-500 text-white py-1 px-4 rounded ${
                rifa.activa || (rifaActiva && rifaActiva.id !== rifa.id)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }"
              onclick="${
                rifa.activa || (rifaActiva && rifaActiva.id !== rifa.id)
                  ? "mostrarToast('No se puede activar esta rifa en este momento', 'error')"
                  : `editarRifa(${rifa.id}, 'activa')`
              }"
            >
              Activar
            </button>
            <button
              class="bg-red-500 text-white py-1 px-4 rounded ${
                rifa.finalizada ? "opacity-50 cursor-not-allowed" : ""
              }"
              onclick="${
                rifa.finalizada
                  ? "mostrarToast('Esta rifa ya está finalizada', 'error')"
                  : `editarRifa(${rifa.id}, 'finalizada')`
              }"
              ${rifa.finalizada ? "disabled" : ""}
            >
              Finalizar
            </button>
          </div>
        `;

        rifasLista.appendChild(rifaCard);
      });

      // Paginación
      const pagination = document.getElementById("pagination");
      pagination.innerHTML = "";

      if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.className =
          "bg-blue-500 text-white py-2 px-4 rounded-md mx-1 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400";
        prevButton.textContent = "Anterior";
        prevButton.onclick = () => {
          currentPage--;
          mostrarFormularioEditarEstado();
        };
        pagination.appendChild(prevButton);
      }

      for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.className = `py-2 px-4 mx-1 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          currentPage === i
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-blue-100"
        }`;
        pageButton.textContent = i;
        pageButton.onclick = () => {
          currentPage = i;
          mostrarFormularioEditarEstado();
        };
        pagination.appendChild(pageButton);
      }

      if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.className =
          "bg-blue-500 text-white py-2 px-4 rounded-md mx-1 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400";
        nextButton.textContent = "Siguiente";
        nextButton.onclick = () => {
          currentPage++;
          mostrarFormularioEditarEstado();
        };
        pagination.appendChild(nextButton);
      }
    })
    .catch((error) => {
      console.error("Error al cargar las rifas:", error);
      adminContent.innerHTML =
        "<p class='text-red-500'>Error al cargar rifas.</p>";
    });
}

// Función para cambiar el estado de la rifa
window.editarRifa = function (id, estado) {
  const payload = {
    estado: estado === "activa" ? 1 : 0, // 1 para activar, 0 para finalizar
  };

  fetch(`/api/rifas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      mostrarToast("Rifa actualizada correctamente", "success");
      mostrarFormularioEditarEstado(); // Recarga las rifas
    })
    .catch((error) => {
      console.error("Error al actualizar la rifa:", error);
      mostrarToast("Error al actualizar la rifa", "error");
    });
};
