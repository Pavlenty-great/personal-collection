document.addEventListener('DOMContentLoaded', function() {
    const selectAll = document.getElementById('selectAll');
    const bookCheckboxes = document.querySelectorAll('.book-checkbox');
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    const deleteForm = document.getElementById('deleteBooksForm');
    
    // Кнопка "Выбрать все"
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const isChecked = this.checked;
            bookCheckboxes.forEach(cb => cb.checked = isChecked);
            updateDeleteButton();
        });
    }
    
    // Обновление кнопки удаления при выборе книг
    function updateDeleteButton() {
        const checkedCount = Array.from(bookCheckboxes).filter(cb => cb.checked).length;
        
        if (checkedCount > 0 && deleteBtn) {
            deleteBtn.style.display = 'block';
            deleteBtn.textContent = `Удалить выбранные (${checkedCount})`;
        } else if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }
    
    // Обновляем чекбокс "Выбрать все"
    function updateSelectAll() {
        if (!selectAll) return;
        
        const allChecked = Array.from(bookCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(bookCheckboxes).some(cb => cb.checked);
        
        selectAll.checked = allChecked;
        selectAll.indeterminate = someChecked && !allChecked;
    }
    
    // Слушаем изменения всех чекбоксов
    bookCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateDeleteButton();
            updateSelectAll();
        });
    });
    
    // Подтверждение удаления
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            const checkedBoxes = Array.from(bookCheckboxes).filter(cb => cb.checked);
            
            if (checkedBoxes.length === 0) {
                e.preventDefault();
                alert('Выберите книги для удаления');
                return false;
            }
            
            if (!confirm(`Удалить ${checkedBoxes.length} книг?`)) {
                e.preventDefault();
                return false;
            }
            
            // Блокируем кнопку на время отправки
            if (deleteBtn) {
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Удаление...';
            }
        });
    }
    
    // Инициализация
    updateDeleteButton();
});

// Скрываем сообщения через 2 секунды
setTimeout(() => {
    document.querySelectorAll('.alert, [class*="message"]').forEach(msg => {
        msg.style.opacity = '0';
        msg.style.transition = 'opacity 0.3s';
        setTimeout(() => msg.remove(), 300);
    });
}, 2000);