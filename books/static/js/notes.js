document.addEventListener('DOMContentLoaded', function() {
    const selectAllNotes = document.getElementById('selectAllNotes');
    const noteCheckboxes = document.querySelectorAll('.note-checkbox');
    const deleteNotesBtn = document.getElementById('deleteSelectedNotesBtn');
    const deleteNotesForm = document.getElementById('deleteNotesForm');
    
    // Кнопка "Выбрать все заметки"
    if (selectAllNotes) {
        selectAllNotes.addEventListener('change', function() {
            const isChecked = this.checked;
            noteCheckboxes.forEach(cb => cb.checked = isChecked);
            updateDeleteNotesButton();
        });
    }
    
    // Обновление кнопки удаления при выборе заметок
    function updateDeleteNotesButton() {
        const checkedCount = Array.from(noteCheckboxes).filter(cb => cb.checked).length;
        
        if (checkedCount > 0 && deleteNotesBtn) {
            deleteNotesBtn.style.display = 'block';
            deleteNotesBtn.textContent = `Удалить выбранные (${checkedCount})`;
        } else if (deleteNotesBtn) {
            deleteNotesBtn.style.display = 'none';
        }
    }
    
    // Обновляем чекбокс "Выбрать все заметки"
    function updateSelectAllNotes() {
        if (!selectAllNotes) return;
        
        const allChecked = Array.from(noteCheckboxes).every(cb => cb.checked);
        const someChecked = Array.from(noteCheckboxes).some(cb => cb.checked);
        
        selectAllNotes.checked = allChecked;
        selectAllNotes.indeterminate = someChecked && !allChecked;
    }
    
    // Слушаем изменения всех чекбоксов заметок
    noteCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateDeleteNotesButton();
            updateSelectAllNotes();
        });
    });
    
    // Подтверждение удаления заметок
    if (deleteNotesForm) {
        deleteNotesForm.addEventListener('submit', function(e) {
            const checkedBoxes = Array.from(noteCheckboxes).filter(cb => cb.checked);
            
            if (checkedBoxes.length === 0) {
                e.preventDefault();
                alert('Выберите заметки для удаления');
                return false;
            }
            
            if (!confirm(`Удалить ${checkedBoxes.length} заметок?`)) {
                e.preventDefault();
                return false;
            }
            
            // Блокируем кнопку на время отправки
            if (deleteNotesBtn) {
                deleteNotesBtn.disabled = true;
                deleteNotesBtn.textContent = 'Удаление...';
            }
        });
    }
    
    // Инициализация
    updateDeleteNotesButton();
});