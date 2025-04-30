// Cargar el navbar desde navbar.html
fetch("navbar.html")
  .then((res) => res.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data;

    // Resaltar enlace activo
    const path = window.location.pathname;
    const links = document.querySelectorAll("#navbar a");

    links.forEach((link) => {
      if (link.getAttribute("href") === path.split("/").pop()) {
        link.classList.add("font-bold", "text-yellow-300");
      }
    });
  });

// Cargar el footer desde footer.html
fetch("footer.html")
  .then((res) => res.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;
  });

async function cargarRifaActiva() {
  const contenedor = document.getElementById("rifa-activa-contenido");

  try {
    const res = await fetch("/api/rifas/activa");

    if (!res.ok) {
      throw new Error("No se pudo cargar la rifa activa");
    }

    const activa = await res.json();

    if (!activa) {
      contenedor.innerHTML =
        "<p class='text-gray-600'>No hay una rifa activa en este momento.</p>";
      return;
    }

    contenedor.innerHTML = `
      <div class="grid md:grid-cols-2 gap-10 items-center mt-6">
        <img
          src="${activa.imagen || "https://via.placeholder.com/300"}"
          alt="${activa.titulo}"
          class="w-full rounded-lg shadow"
        />
        <div>
          <h2 class="text-3xl font-bold text-blue-600 mb-3">${
            activa.titulo
          }</h2>
          <p class="text-gray-700 text-lg mb-4">${activa.descripcion}</p>
          <ul class="list-disc list-inside text-gray-600 space-y-1 mb-4 text-left">
            <li><strong>Precio por número:</strong> ${activa.precio} Bs.</li>
            <li><strong>Fecha límite:</strong> ${
              activa.fecha_limite || "Hasta vender el 80% de los números"
            }</li>
          </ul>
          <a
            href="numeros-rifa-activa.html"
            class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-full transition duration-300 shadow"
          >
            Ver Números Disponibles
          </a>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Error al cargar la rifa activa:", err);
    contenedor.innerHTML = `
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-md shadow-md max-w-2xl mx-auto animate-fade-in">
        <div class="flex items-center space-x-3">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <div>
            <h3 class="text-xl font-semibold">¡Atención!</h3>
            <p class="mt-1 text-md">No hay rifas activas en este momento. Vuelve pronto para ver las próximas rifas.</p>
          </div>
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", cargarRifaActiva);
