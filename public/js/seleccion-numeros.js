const grid = document.getElementById("grid");
const seleccionados = document.getElementById("seleccionados");
const selectedNumbers = new Set();

function actualizarLista() {
  seleccionados.innerHTML = "";
  const cantidad = selectedNumbers.size;
  document.getElementById(
    "contadorSeleccion"
  ).textContent = `Total: ${cantidad} seleccionados`;

  if (cantidad === 0) {
    seleccionados.innerHTML = "<span class='text-gray-400'>Ninguno</span>";
  } else {
    [...selectedNumbers]
      .sort((a, b) => a - b)
      .forEach((num) => {
        const chip = document.createElement("div");
        chip.className =
          "flex items-center gap-2 bg-blue-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium shadow-sm animate-fade-in";
        chip.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Nº ${num}`;
        seleccionados.appendChild(chip);
      });
  }
}
let rifaActiva = null;

async function cargarNumeros() {
  try {
    const resRifa = await fetch("/api/rifas/activa");
    const rifa = await resRifa.json();
    rifaActiva = rifa;

    const resNumeros = await fetch(`/api/numeros/${rifa.id}`);
    const numeros = await resNumeros.json();

    numeros.forEach((numeroObj) => {
      const { id, numero, estado } = numeroObj;

      const btn = document.createElement("button");
      btn.textContent = numero;
      btn.className =
        "bg-white border border-gray-300 rounded-lg py-2 text-lg text-gray-700 hover:bg-blue-200 transition w-full";

      if (estado === "apartado") {
        btn.classList.add("bg-yellow-300", "cursor-not-allowed");
        btn.disabled = true;
      } else if (estado === "pagado") {
        btn.classList.add("bg-red-400", "cursor-not-allowed");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          if (selectedNumbers.has(id)) {
            selectedNumbers.delete(id);
            btn.classList.remove("bg-green-300");
          } else {
            selectedNumbers.add(id);
            btn.classList.add("bg-green-300");
          }
          actualizarLista();
        });
      }

      grid.appendChild(btn);
    });

    actualizarLista();
  } catch (error) {
    console.error("Error al cargar números:", error);
  }
}
async function cargarNumeros() {
  try {
    const resRifa = await fetch("/api/rifas/activa");
    const rifa = await resRifa.json();
    rifaActiva = rifa;

    const resNumeros = await fetch(`/api/numeros/${rifa.id}`);
    const numeros = await resNumeros.json();

    numeros.forEach((numeroObj) => {
      const { id, numero, estado } = numeroObj;
      const btn = document.createElement("button");
      btn.textContent = numero;
      btn.className =
        "bg-white border border-gray-300 rounded-lg py-2 text-lg text-gray-700 hover:bg-blue-200 transition w-full";

      if (estado === "apartado") {
        btn.classList.add("bg-yellow-300", "cursor-not-allowed");
        btn.disabled = true;
      } else if (estado === "pagado") {
        btn.classList.add("bg-green-400", "cursor-not-allowed");
        btn.disabled = true;
      } else {
        btn.addEventListener("click", () => {
          if (selectedNumbers.has(id)) {
            selectedNumbers.delete(id);
            btn.classList.remove("bg-green-300");
          } else {
            selectedNumbers.add(id);
            btn.classList.add("bg-green-300");
          }
          actualizarLista();
        });
      }

      grid.appendChild(btn);
    });

    actualizarLista();

    // 👉 Agregar info de la rifa aquí
    const infoRifa = document.getElementById("info-rifa");
    infoRifa.innerHTML = `
      <div class="bg-white border border-gray-300 rounded-lg p-5 shadow-md animate-fade-in">
        ${
          rifa.imagen
            ? `<img src="${rifa.imagen}" alt="Imagen de la rifa" class="w-full h-40 object-cover rounded mb-4">`
            : ""
        }
        <h3 class="text-xl font-bold text-blue-800 mb-2">${rifa.titulo}</h3>
        <p class="text-gray-600 mb-2">${rifa.descripcion}</p>
        <p class="text-gray-800 font-semibold">Precio del número: ${
          rifa.precio
        } Bs.</p>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar números:", error);
  }
}

document.getElementById("adquirir").addEventListener("click", async () => {
  if (selectedNumbers.size === 0) {
    mostrarToast("Debes seleccionar al menos un número.", "warning");
    return;
  }

  const confirmado = await confirmarAccion(
    "¿Deseas continuar con la selección?"
  );
  if (!confirmado) return;

  document.getElementById("modalUsuario").classList.remove("hidden");
});

// Cerrar modal
document.getElementById("cancelarModal").addEventListener("click", () => {
  document.getElementById("modalUsuario").classList.add("hidden");
});

// Enviar formulario
document.getElementById("formUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const data = {
    id_rifa: rifaActiva.id,
    cedula: formData.get("cedula"),
    nombre: formData.get("nombre"),
    apellido: formData.get("apellido"),
    telefono: formData.get("telefono"),
    correo: formData.get("correo"),
    numeros: [...selectedNumbers],
  };

  try {
    const res = await fetch("/api/apartar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      mostrarToast("¡Números apartados exitosamente!", "success");
      setTimeout(() => location.reload(), 1500); // Pequeño delay antes de recargar
    } else {
      mostrarToast("Hubo un error al apartar tus números.", "error");
    }
  } catch (error) {
    console.error("Error al enviar datos:", error);
    mostrarToast("Error en la conexión.", "error");
  }
});
document.getElementById("verificar").addEventListener("click", () => {
  document.getElementById("modalVerificar").classList.remove("hidden");
});
async function buscarPorCedula() {
  const cedula = document.getElementById("cedulaVerificar").value.trim();
  const resultado = document.getElementById("resultadoVerificacion");

  if (!cedula) {
    mostrarToast("Debes ingresar una cédula válida.", "warning");
    return;
  }

  try {
    const res = await fetch(`/api/participantes/detalles-por-cedula/${cedula}`);
    if (!res.ok) {
      resultado.innerHTML = `<p class="text-red-500">No se encontró información para esa cédula.</p>`;
      return;
    }

    const datos = await res.json();

    // Mostrar información
    let html = `
      <div class="bg-gray-100 p-4 rounded shadow animate-fade-in">
        <p><strong>Nombre:</strong> ${datos.nombre} ${datos.apellido}</p>
<p><strong>Cédula:</strong> ${datos.cedula}</p>
<p><strong>Correo:</strong> ${datos.correo || "-"}</p>
<p><strong>Teléfono:</strong> ${datos.telefono || "-"}</p>

    `;

    for (const estado of ["pagado", "apartado"]) {
      if (!datos[estado] || datos[estado].length === 0) continue;

      const color =
        estado === "pagado"
          ? "bg-green-500 text-white"
          : "bg-yellow-500 text-white";

      html += `
        <p class="mt-4 font-semibold">Números ${estado.toUpperCase()}:</p>
        <div class="flex flex-wrap gap-2 mt-1">
          ${datos[estado]
            .map(
              (num) => `
              <span class="inline-block ${color} px-3 py-1 rounded-full text-xs font-medium">
                Nº ${num}
              </span>
            `
            )
            .join("")}
        </div>
      `;
    }

    html += `</div>`;
    resultado.innerHTML = html;
  } catch (error) {
    console.error("Error al buscar por cédula:", error);
    mostrarToast("Error en la búsqueda.", "error");
  }
}
function cerrarModalVerificacion() {
  document.getElementById("modalVerificar").classList.add("hidden");
  document.getElementById("cedulaVerificar").value = ""; // limpia la cédula
  document.getElementById("resultadoVerificacion").innerHTML = ""; // limpia el resultado
}

cargarNumeros();
