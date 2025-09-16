// Instancias globales (singleton pattern)
const confirmModal = new ConfirmModal();

// Funciones de conveniencia globales
window.showConfirm = (title, text) => confirmModal.confirm(title, text);
