document.addEventListener("DOMContentLoaded", () => {
  const adminContent = document.getElementById("admin-content");

  const links = document.querySelectorAll("aside a");
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const text = link.textContent.trim();

      if (text.includes("Crear Rifa")) {
        mostrarFormularioCrearRifa();
      } else if (text.includes("Editar Estado")) {
        mostrarFormularioEditarEstado();
      } else if (text.includes("Administrar Pagos")) {
        mostrarRifas();
      } else {
        adminContent.innerHTML =
          "<p class='text-gray-600'>Selecciona una opción del menú.</p>";
      }
    });
  });
});
