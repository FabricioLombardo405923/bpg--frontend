
window.showAlert = function (message, type = 'success') {
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f1c40f',
        info: '#3498db'
    };

    Toastify({
        text: message,
        duration: 3000,
        gravity: 'top', // top o bottom
        position: 'right', // left, center o right
        backgroundColor: colors[type] || '#2ecc71',
        close: true,
        stopOnFocus: true
    }).showToast();
};