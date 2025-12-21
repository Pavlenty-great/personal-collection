document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли модальное окно на странице
    const editBookModal = document.getElementById('editBookModal');
    if (!editBookModal) {
        console.log('Модальное окно редактирования книги не найдено на странице');
        return;
    }
    
    const editBookForm = document.getElementById('editBookForm');
    const saveBookBtn = document.getElementById('saveBookBtn');
    const cancelEditBookBtn = document.getElementById('cancelEditBookBtn');
    const closeEditBookBtn = document.querySelector('.edit-book-close');
    
    // Элементы формы
    const editBookId = document.getElementById('edit_book_id');
    const editBookName = document.getElementById('edit_book_name');
    const editBookYear = document.getElementById('edit_book_year');
    const editPlaceName = document.getElementById('edit_place_name');
    const editAuthorLastName = document.getElementById('edit_author_last_name');
    const editAuthorFirstName = document.getElementById('edit_author_first_name');
    const editAuthorMiddleName = document.getElementById('edit_author_middle_name');
    
    // Элементы информации о текущей книге
    const currentBookTitle = document.getElementById('currentBookTitle');
    const currentBookAuthor = document.getElementById('currentBookAuthor');
    
    // ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА =====
    
    // Обработчик для кнопки редактирования на странице деталей книги
    const editBookDetailBtn = document.getElementById('editBookBtn');
    if (editBookDetailBtn) {
        editBookDetailBtn.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            openEditBookModal(bookId);
        });
    }
    
    function openEditBookModal(bookId) {
        // Заполняем скрытое поле с ID книги
        editBookId.value = bookId;
        
        // Заполняем информацию о текущей книге
        currentBookTitle.textContent = 'Загрузка...';
        currentBookAuthor.textContent = 'Загрузка...';
        
        // Очищаем поля формы
        editBookName.value = '';
        editBookYear.value = '';
        editPlaceName.value = '';
        editAuthorLastName.value = '';
        editAuthorFirstName.value = '';
        editAuthorMiddleName.value = '';
        
        // Показываем модальное окно
        editBookModal.style.display = 'flex';
        
        // Загружаем подробности через AJAX
        loadBookDetails(bookId);
    }
    
    // Функция загрузки деталей книги через AJAX
    async function loadBookDetails(bookId) {
        try {
            const response = await fetch(`/books/get/${bookId}/`);
            if (response.ok) {
                const data = await response.json();
                
                // Обновляем информацию о текущей книге
                currentBookTitle.textContent = data.book_name || 'Неизвестно';
                currentBookAuthor.textContent = data.authors_list || 'Неизвестно';
                
                // Заполняем форму текущими значениями
                editBookName.value = data.book_name || '';
                editBookYear.value = data.book_year || '';
                editPlaceName.value = data.place_name || '';
                
                // Парсим авторов (берем первого, если их несколько)
                const firstAuthor = parseAuthorFromList(data.authors_list);
                if (firstAuthor) {
                    editAuthorLastName.value = firstAuthor.lastName || '';
                    editAuthorFirstName.value = firstAuthor.firstName || '';
                    // Отчество не заполняем, так как в списке оно в инициалах
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке деталей книги:', error);
            showMessage('❌ Ошибка при загрузке данных книги', 'error');
        }
    }
    
    // Функция парсинга автора из строки "И.И. Иванов"
    function parseAuthorFromList(authorsList) {
        if (!authorsList) return null;
        
        // Берем первого автора (если их несколько через запятую)
        const firstAuthor = authorsList.split(',')[0].trim();
        
        // Паттерн: "И.И. Иванов" или "И. Иванов"
        const pattern = /^([А-ЯЁ])\.\s*([А-ЯЁ])?\.?\s*([А-ЯЁ][а-яё]+)$/;
        const match = firstAuthor.match(pattern);
        
        if (match) {
            return {
                firstName: match[1] + '.',  // "И."
                middleName: match[2] ? match[2] + '.' : '',  // "И." или ""
                lastName: match[3]  // "Иванов"
            };
        }
        
        return null;
    }
    
    // ===== СОХРАНЕНИЕ ИЗМЕНЕНИЙ =====
    
    // Сохранение отредактированной книги
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', async function() {
            const bookId = editBookId.value;
            const bookName = editBookName.value.trim();
            const bookYear = editBookYear.value.trim();
            const placeName = editPlaceName.value.trim();
            const authorLastName = editAuthorLastName.value.trim();
            const authorFirstName = editAuthorFirstName.value.trim();
            const authorMiddleName = editAuthorMiddleName.value.trim();
            
            // Валидация: если указана фамилия автора, то должно быть и имя
            if ((authorLastName && !authorFirstName) || (!authorLastName && authorFirstName)) {
                showMessage('Если указываете автора, нужно заполнить и фамилию, и имя', 'error');
                return;
            }
            
            // Валидация года (если указан)
            if (bookYear && !/^\d{4}$/.test(bookYear)) {
                showMessage('Год должен состоять из 4 цифр', 'error');
                return;
            }
            
            try {
                // Блокируем кнопку
                saveBookBtn.disabled = true;
                saveBookBtn.textContent = 'Сохранение...';
                
                // Отправляем AJAX запрос на обновление
                const response = await fetch(`/books/update/${bookId}/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: new URLSearchParams({
                        'book_name': bookName,
                        'book_year': bookYear,
                        'place_name': placeName,
                        'author_last_name': authorLastName,
                        'author_first_name': authorFirstName,
                        'author_middle_name': authorMiddleName,
                        'csrfmiddlewaretoken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ Книга успешно обновлена', 'success');
                        
                        // Закрываем модальное окно через секунду
                        setTimeout(() => {
                            editBookModal.style.display = 'none';
                            // Перезагружаем страницу для обновления данных
                            window.location.reload();
                        }, 1000);
                    } else {
                        showMessage('❌ ' + (result.error || 'Не удалось обновить книгу'), 'error');
                        saveBookBtn.disabled = false;
                        saveBookBtn.textContent = '💾 Сохранить изменения';
                    }
                } else {
                    const error = await response.text();
                    throw new Error(error);
                }
                
            } catch (error) {
                console.error('Ошибка при обновлении книги:', error);
                showMessage('❌ Ошибка при обновлении книги', 'error');
                saveBookBtn.disabled = false;
                saveBookBtn.textContent = '💾 Сохранить изменения';
            }
        });
    }
    
    // ===== ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА =====
    
    // Отмена редактирования
    if (cancelEditBookBtn) {
        cancelEditBookBtn.addEventListener('click', function() {
            editBookModal.style.display = 'none';
        });
    }
    
    // Закрытие по крестику
    if (closeEditBookBtn) {
        closeEditBookBtn.addEventListener('click', function() {
            editBookModal.style.display = 'none';
        });
    }
    
    // Закрытие при клике вне окна
    editBookModal.addEventListener('click', function(e) {
        if (e.target === editBookModal) {
            editBookModal.style.display = 'none';
        }
    });
    
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
        const oldMessages = document.querySelectorAll('.edit-temp-message');
        oldMessages.forEach(msg => msg.remove());
        
        // Создаем новое сообщение
        const messageDiv = document.createElement('div');
        messageDiv.className = `edit-temp-message edit-${type}`;
        messageDiv.textContent = text;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '9999';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
        
        if (type === 'success') {
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else {
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
        }
        
        document.body.appendChild(messageDiv);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
});