// toast.js

// Agrega el contenedor al cargar el script
const toastContainer = document.createElement("div");
toastContainer.id = "toast-container";
toastContainer.className = "fixed top-5 right-5 space-y-4 z-50";
document.body.appendChild(toastContainer);

// Función de toast animado
window.mostrarToast = function (mensaje, tipo = "success") {
  const toast = document.createElement("div");

  const colores = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  };

  toast.className = `text-white px-6 py-3 rounded shadow-lg animate-fade-in-out ${
    colores[tipo] || colores.success
  }`;
  toast.innerText = mensaje;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
};

// Estilo para animación fade
const style = document.createElement("style");
style.innerHTML = `
@keyframes fade-in-out {
  0% { opacity: 0; transform: translateY(-10px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-10px); }
}
.animate-fade-in-out {
  animation: fade-in-out 3s ease-in-out;
}
`;
document.head.appendChild(style);
// confirm.js

// Agregar contenedor global
const confirmContainer = document.createElement("div");
confirmContainer.id = "confirm-container";
confirmContainer.className =
  "fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 hidden";
document.body.appendChild(confirmContainer);

// Función para mostrar el modal de confirmación
window.confirmarAccion = function (mensaje) {
  return new Promise((resolve) => {
    confirmContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-6 text-center max-w-sm w-full animate-fade-in">
        <p class="text-lg font-semibold mb-6">${mensaje}</p>
        <div class="flex justify-center gap-4">
          <button id="btnConfirmar" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded">Confirmar</button>
          <button id="btnCancelar" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded">Cancelar</button>
        </div>
      </div>
    `;

    confirmContainer.classList.remove("hidden");

    document.getElementById("btnConfirmar").onclick = () => {
      confirmContainer.classList.add("hidden");
      resolve(true);
    };

    document.getElementById("btnCancelar").onclick = () => {
      confirmContainer.classList.add("hidden");
      resolve(false);
    };
  });
};

// Animación opcional para entrada suave
const styleConfirm = document.createElement("style");
styleConfirm.innerHTML = `
@keyframes fade-in {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`;
document.head.appendChild(styleConfirm);
