document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bookModal');
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');
    const closeSpan = document.querySelector('.close');
    
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            modal.style.display = 'flex';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    if (closeSpan) {
        closeSpan.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Закрыть при клике вне окна
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});