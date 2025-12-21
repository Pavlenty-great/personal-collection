document.addEventListener('DOMContentLoaded', function() {
    const selectAllNotes = document.getElementById('selectAllNotes');
    const noteCheckboxes = document.querySelectorAll('.note-checkbox');
    const deleteNotesBtn = document.getElementById('deleteSelectedNotesBtn');
    const deleteNotesForm = document.getElementById('deleteNotesForm');
    
    // Элементы модального окна редактирования
    const editModal = document.getElementById('editNoteModal');
    const editNoteForm = document.getElementById('editNoteForm');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editNoteText = document.getElementById('edit_note_text');
    const editNoteType = document.getElementById('edit_note_type_id');
    const editNoteId = document.getElementById('edit_note_id');
    
    // Маппинг названий типов заметок к их ID
    const noteTypeMapping = {
        'Общая заметка': '1',
        'Цитата': '2',
        'Рецензия': '3',
        'Анализ': '4',
        'Вопросы по тексту': '5'
    };
    
    // ===== УПРАВЛЕНИЕ РЕДАКТИРОВАНИЕМ =====
    
    // Обработчик клика по кнопке "Редактировать"
    document.querySelectorAll('.edit-note-btn').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = this.getAttribute('data-note-id');
            const noteText = this.getAttribute('data-note-text');
            const noteType = this.getAttribute('data-note-type');
            
            // Заполняем форму редактирования
            editNoteId.value = noteId;
            editNoteText.value = noteText;
            
            // Устанавливаем правильный тип заметки
            if (noteType in noteTypeMapping) {
                editNoteType.value = noteTypeMapping[noteType];
            } else {
                editNoteType.value = '1'; // По умолчанию
            }
            
            // Показываем модальное окно
            editModal.style.display = 'flex';
        });
    });
    
    // Сохранение отредактированной заметки
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', async function() {
            const noteId = editNoteId.value;
            const noteText = editNoteText.value.trim();
            const noteTypeId = editNoteType.value;
            
            if (!noteText) {
                alert('Текст заметки не может быть пустым');
                return;
            }
            
            try {
                // Блокируем кнопку
                saveNoteBtn.disabled = true;
                saveNoteBtn.textContent = 'Сохранение...';
                
                // Отправляем AJAX запрос на обновление
                const response = await fetch(`/notes/update/${noteId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: new URLSearchParams({
                        'note_text': noteText,
                        'note_type_id': noteTypeId,
                        'csrfmiddlewaretoken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    })
                });
                
                if (response.ok) {
                    // Обновляем заметку на странице без перезагрузки
                    const noteTextElement = document.getElementById(`note_text_${noteId}`);
                    const noteTypeElement = document.querySelector(`#note_${noteId} .note-type`);
                    
                    if (noteTextElement) {
                        noteTextElement.textContent = noteText;
                    }
                    
                    // Обновляем тип заметки если он изменился
                    if (noteTypeElement) {
                        const selectedOption = editNoteType.options[editNoteType.selectedIndex];
                        noteTypeElement.textContent = selectedOption.text;
                        
                        // Обновляем data-атрибут кнопки редактирования
                        const editBtn = document.querySelector(`.edit-note-btn[data-note-id="${noteId}"]`);
                        if (editBtn) {
                            editBtn.setAttribute('data-note-text', noteText);
                            editBtn.setAttribute('data-note-type', selectedOption.text);
                        }
                    }
                    
                    // Показываем сообщение об успехе
                    showMessage('✅ Заметка успешно обновлена', 'success');
                    
                    // Закрываем модальное окно
                    editModal.style.display = 'none';
                } else {
                    const error = await response.text();
                    throw new Error(error);
                }
                
            } catch (error) {
                console.error('Ошибка при обновлении заметки:', error);
                showMessage('❌ Ошибка при обновлении заметки', 'error');
            } finally {
                // Разблокируем кнопку
                saveNoteBtn.disabled = false;
                saveNoteBtn.textContent = '💾 Сохранить';
            }
        });
    }
    
    // Отмена редактирования
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function() {
            editModal.style.display = 'none';
        });
    }
    
    // Закрытие модального окна при клике вне его
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // ===== УПРАВЛЕНИЕ УДАЛЕНИЕМ =====
    
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
    
    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    
    // Функция для получения CSRF токена
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Функция для отображения сообщений
    function showMessage(text, type) {
        // Удаляем старые сообщения
        const oldMessages = document.querySelectorAll('.temp-message');
        oldMessages.forEach(msg => msg.remove());
        
        // Создаем новое сообщение
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message message ${type}`;
        messageDiv.textContent = text;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '9999';
        
        document.body.appendChild(messageDiv);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
});