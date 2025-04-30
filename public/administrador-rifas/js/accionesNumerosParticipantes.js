async function confirmarPago(numero) {
  const confirmar = await confirmarAccion(
    "¿Seguro que quieres confirmar el pago de este número?"
  );
  if (!confirmar) return;

  fetch(
    `/api/participantes/buscar-id-numero?rifaId=${rifaIdActual}&numero=${numero}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data.id) throw new Error("ID de número no encontrado");

      return fetch(`/api/participantes/confirmar-pago/${data.id}`, {
        method: "PUT",
      });
    })
    .then((res) => res.json())
    .then((data) => {
      mostrarToast(data.message, "success"); // ✅ Confirmado
      mostrarNumerosDeParticipante(cedulaActual, rifaIdActual, estadoActual);
    })
    .catch((err) => {
      console.error(err);
      mostrarToast("Error al confirmar pago.", "error"); // ⚠️ Error
    });
}

async function liberarNumero(numero) {
  const confirmar = await confirmarAccion(
    "¿Seguro que quieres liberar este número?"
  );
  if (!confirmar) return;

  fetch(
    `/api/participantes/buscar-id-numero?rifaId=${rifaIdActual}&numero=${numero}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data.id) throw new Error("ID de número no encontrado");

      return fetch(`/api/participantes/liberar-numero/${data.id}`, {
        method: "PUT",
      });
    })
    .then((res) => res.json())
    .then((data) => {
      mostrarToast(data.message, "info"); // ℹ️ Liberado
      mostrarNumerosDeParticipante(cedulaActual, rifaIdActual, estadoActual);
    })
    .catch((err) => {
      console.error(err);
      mostrarToast("Error al liberar número.", "error"); // ⚠️ Error
    });
}
