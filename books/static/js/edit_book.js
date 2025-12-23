document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли модальное окно на странице
    const editBookModal = document.getElementById('editBookModal');
    if (!editBookModal) {
        console.log('Модальное окно редактирования книги не найдено на странице');
        return;
    }
    
    // Элементы формы
    const editBookForm = document.getElementById('editBookForm');
    const saveBookBtn = document.getElementById('saveBookBtn');
    const cancelEditBookBtn = document.getElementById('cancelEditBookBtn');
    const closeEditBookBtn = document.querySelector('.edit-book-close');
    const editAddAuthorBtn = document.getElementById('editAddAuthorBtn');
    const editAuthorsContainer = document.getElementById('editAuthorsContainer');
    
    // Основные поля
    const editBookId = document.getElementById('edit_book_id');
    const editBookName = document.getElementById('edit_book_name');
    const editBookYear = document.getElementById('edit_book_year');
    const editPlaceName = document.getElementById('edit_place_name');
    const editAuthorsData = document.getElementById('edit_authors_data');
    
    // Элементы информации о текущей книге
    const currentBookTitle = document.getElementById('currentBookTitle');
    const currentBookAuthors = document.getElementById('currentBookAuthors');
    
    // Конфигурация
    const MAX_AUTHORS = 5;
    let editAuthorCount = 0;
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    
    // Обработчик для кнопки редактирования на странице деталей книги
    const editBookDetailBtn = document.getElementById('editBookBtn');
    if (editBookDetailBtn) {
        editBookDetailBtn.addEventListener('click', function() {
            const bookId = this.getAttribute('data-book-id');
            openEditBookModal(bookId);
        });
    }
    
    // ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА =====
    
    function openEditBookModal(bookId) {
        // Заполняем скрытое поле с ID книги
        editBookId.value = bookId;
        
        // Заполняем информацию о текущей книге
        currentBookTitle.textContent = 'Загрузка...';
        currentBookAuthors.textContent = 'Загрузка...';
        
        // Очищаем поля формы
        editBookName.value = '';
        editBookYear.value = '';
        editPlaceName.value = '';
        editAuthorsContainer.innerHTML = '';
        editAuthorCount = 0;
        
        // Показываем модальное окно
        editBookModal.style.display = 'flex';
        
        // Загружаем подробности через AJAX
        loadBookDetails(bookId);
    }
    
    // ===== ЗАГРУЗКА ДАННЫХ КНИГИ =====
    
    async function loadBookDetails(bookId) {
        try {
            const response = await fetch(`/books/get/${bookId}/`);
            if (response.ok) {
                const data = await response.json();
                
                // Обновляем информацию о текущей книге
                currentBookTitle.textContent = data.book_name || 'Неизвестно';
                currentBookAuthors.textContent = data.authors_list || 'Неизвестно';
                
                // Заполняем форму текущими значениями
                editBookName.value = data.book_name || '';
                editBookYear.value = data.book_year || '';
                editPlaceName.value = data.place_name || '';
                
                // Парсим авторов из строки
                const authors = parseAuthorsFromList(data.authors_list);
                
                // Создаем блоки авторов
                if (authors.length > 0) {
                    authors.forEach(author => {
                        addEditAuthorBlock(author.lastName, author.firstName, author.middleName);
                    });
                } else {
                    // Если не удалось распарсить, добавляем пустой блок
                    addEditAuthorBlock();
                }
                
                // Обновляем кнопку добавления авторов
                updateEditAddAuthorButton();
            }
        } catch (error) {
            console.error('Ошибка при загрузке деталей книги:', error);
            showMessage('❌ Ошибка при загрузке данных книги', 'error');
        }
    }
    
    // Функция парсинга нескольких авторов из строки "И.И. Иванов, П.П. Петров"
    function parseAuthorsFromList(authorsList) {
        if (!authorsList) return [];
        
        const authors = [];
        
        // Разделяем авторов по запятой
        const authorStrings = authorsList.split(',').map(str => str.trim());
        
        authorStrings.forEach(authorStr => {
            // Паттерн: "И.И. Иванов" или "И. Иванов"
            const pattern = /^([А-ЯЁ])\.\s*([А-ЯЁ])?\.?\s*([А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+)*)$/;
            const match = authorStr.match(pattern);
            
            if (match) {
                authors.push({
                    firstName: match[1] + '.',  // "И."
                    middleName: match[2] ? match[2] + '.' : '',  // "И." или ""
                    lastName: match[3]  // "Иванов"
                });
            } else {
                // Альтернативный паттерн для полного имени
                const fullNamePattern = /^([А-ЯЁ][а-яё]+)\s+([А-ЯЁ][а-яё]+)(?:\s+([А-ЯЁ][а-яё]+))?$/;
                const fullMatch = authorStr.match(fullNamePattern);
                
                if (fullMatch) {
                    authors.push({
                        lastName: fullMatch[1],  // "Иванов"
                        firstName: fullMatch[2].charAt(0) + '.',  // "И."
                        middleName: fullMatch[3] ? fullMatch[3].charAt(0) + '.' : ''
                    });
                }
            }
        });
        
        return authors;
    }
    
    // ===== УПРАВЛЕНИЕ БЛОКАМИ АВТОРОВ =====
    
    function addEditAuthorBlock(lastName = '', firstName = '', middleName = '') {
        if (editAuthorCount >= MAX_AUTHORS) {
            console.log('⚠️ Достигнут максимум авторов');
            return;
        }
        
        editAuthorCount++;
        const authorIndex = editAuthorCount;
        
        const authorBlock = document.createElement('div');
        authorBlock.className = 'edit-author-block';
        authorBlock.dataset.index = authorIndex;
        
        const isFirst = authorIndex === 1;
        
        authorBlock.innerHTML = `
            <div class="edit-author-header">
                <span class="edit-author-number">Автор #${authorIndex}${isFirst ? ' *' : ''}</span>
                ${!isFirst ? '<button type="button" class="edit-remove-author-btn" onclick="window.removeEditAuthor(' + authorIndex + ')">🗑️ Удалить</button>' : ''}
            </div>
            
            <div class="edit-author-fields">
                <div class="edit-author-field-group">
                    <label for="edit_author_last_name_${authorIndex}">Фамилия${isFirst ? ':*' : ':'}</label>
                    <input type="text" 
                           id="edit_author_last_name_${authorIndex}" 
                           class="edit-author-input" 
                           data-field="last_name"
                           placeholder="Иванов" 
                           ${isFirst ? 'required' : ''} 
                           maxlength="80"
                           value="${lastName || ''}">
                </div>
                
                <div class="edit-author-field-group">
                    <label for="edit_author_first_name_${authorIndex}">Имя${isFirst ? ':*' : ':'}</label>
                    <input type="text" 
                           id="edit_author_first_name_${authorIndex}" 
                           class="edit-author-input" 
                           data-field="first_name"
                           placeholder="Иван" 
                           ${isFirst ? 'required' : ''} 
                           maxlength="80"
                           value="${firstName || ''}">
                </div>
                
                <div class="edit-author-field-group">
                    <label for="edit_author_middle_name_${authorIndex}">Отчество:</label>
                    <input type="text" 
                           id="edit_author_middle_name_${authorIndex}" 
                           class="edit-author-input" 
                           data-field="middle_name"
                           placeholder="Иванович (необязательно)" 
                           maxlength="80"
                           value="${middleName || ''}">
                </div>
            </div>
            
            <div class="edit-author-error" id="editAuthorError${authorIndex}" style="display: none;">
                Заполните фамилию и имя автора
            </div>
        `;
        
        editAuthorsContainer.appendChild(authorBlock);
        return authorBlock;
    }
    
    // Публичная функция для удаления автора
    window.removeEditAuthor = function(index) {
        console.log(`🗑️ Удаление автора #${index}`);
        
        const authorBlock = document.querySelector(`.edit-author-block[data-index="${index}"]`);
        if (authorBlock) {
            // Анимация удаления
            authorBlock.classList.add('removing');
            
            setTimeout(() => {
                authorBlock.remove();
                
                // Обновляем номера оставшихся блоков
                updateEditAuthorNumbers();
                editAuthorCount--;
                updateEditAddAuthorButton();
            }, 300);
        }
    };
    
    // Обновление номеров авторов
    function updateEditAuthorNumbers() {
        const authorBlocks = document.querySelectorAll('.edit-author-block');
        
        authorBlocks.forEach((block, index) => {
            const newIndex = index + 1;
            block.dataset.index = newIndex;
            
            // Обновляем номер в заголовке
            const numberSpan = block.querySelector('.edit-author-number');
            if (numberSpan) {
                const isFirst = newIndex === 1;
                numberSpan.textContent = `Автор #${newIndex}${isFirst ? ' *' : ''}`;
            }
            
            // Обновляем ID полей
            const inputs = block.querySelectorAll('.edit-author-input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                const newId = `edit_author_${field}_${newIndex}`;
                input.id = newId;
                
                // Обновляем for атрибуты label
                const label = input.parentElement.querySelector('label');
                if (label) {
                    label.htmlFor = newId;
                }
            });
            
            // Обновляем кнопку удаления
            const removeBtn = block.querySelector('.edit-remove-author-btn');
            if (removeBtn) {
                if (newIndex === 1) {
                    removeBtn.style.display = 'none';
                } else {
                    removeBtn.style.display = 'block';
                    removeBtn.onclick = function() {
                        window.removeEditAuthor(newIndex);
                    };
                }
            }
        });
    }
    
    // Обновление кнопки добавления автора
    function updateEditAddAuthorButton() {
        if (!editAddAuthorBtn) return;
        
        if (editAuthorCount >= MAX_AUTHORS) {
            editAddAuthorBtn.disabled = true;
            editAddAuthorBtn.textContent = `Максимум ${MAX_AUTHORS} авторов`;
            editAddAuthorBtn.style.opacity = '0.6';
        } else {
            editAddAuthorBtn.disabled = false;
            editAddAuthorBtn.textContent = '➕ Добавить еще автора';
            editAddAuthorBtn.style.opacity = '1';
        }
    }
    
    // Обработчик кнопки добавления автора
    if (editAddAuthorBtn) {
        editAddAuthorBtn.addEventListener('click', function() {
            addEditAuthorBlock();
            updateEditAddAuthorButton();
        });
    }
    
    // ===== СОБИРАЕМ ДАННЫЕ АВТОРОВ =====
    
    function collectEditAuthorsData() {
        const authors = [];
        const authorBlocks = document.querySelectorAll('.edit-author-block');
        
        authorBlocks.forEach(block => {
            const lastName = block.querySelector('input[data-field="last_name"]').value.trim();
            const firstName = block.querySelector('input[data-field="first_name"]').value.trim();
            const middleName = block.querySelector('input[data-field="middle_name"]').value.trim();
            
            // Добавляем только если есть фамилия и имя
            if (lastName && firstName) {
                authors.push({
                    last_name: lastName,
                    first_name: firstName,
                    middle_name: middleName || ''
                });
            }
        });
        
        return authors;
    }
    
    // ===== ВАЛИДАЦИЯ ФОРМЫ =====
    
    function validateEditForm() {
        // Проверяем основные поля
        const bookName = editBookName.value.trim();
        const bookYear = editBookYear.value.trim();
        const placeName = editPlaceName.value.trim();
        
        if (!bookName) {
            showMessage('Введите название книги', 'error');
            return false;
        }
        
        if (bookYear && (!/^\d{4}$/.test(bookYear))) {
            showMessage('Год должен состоять из 4 цифр', 'error');
            return false;
        }
        
        // Проверяем авторов
        const authors = collectEditAuthorsData();
        if (authors.length === 0) {
            showMessage('Добавьте хотя бы одного автора (фамилию и имя)', 'error');
            return false;
        }
        
        // Проверяем каждого автора
        const authorBlocks = document.querySelectorAll('.edit-author-block');
        let isValid = true;
        
        authorBlocks.forEach((block, index) => {
            const lastName = block.querySelector('input[data-field="last_name"]').value.trim();
            const firstName = block.querySelector('input[data-field="first_name"]').value.trim();
            const errorDiv = block.querySelector('.edit-author-error');
            
            // Если заполнено одно поле, второе тоже должно быть заполнено
            if ((lastName && !firstName) || (!lastName && firstName)) {
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = 'Заполните и фамилию, и имя';
                }
                isValid = false;
            } else {
                if (errorDiv) errorDiv.style.display = 'none';
            }
        });
        
        if (!isValid) {
            showMessage('Для каждого автора заполните и фамилию, и имя', 'error');
            return false;
        }
        
        return true;
    }
    
    // ===== СОХРАНЕНИЕ ИЗМЕНЕНИЙ =====
    
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', async function() {
            // Валидация формы
            if (!validateEditForm()) {
                return;
            }
            
            // Собираем данные
            const bookId = editBookId.value;
            const bookName = editBookName.value.trim();
            const bookYear = editBookYear.value.trim();
            const placeName = editPlaceName.value.trim();
            const authors = collectEditAuthorsData();
            
            // Преобразуем авторов в JSON
            const authorsJson = JSON.stringify(authors);
            
            try {
                // Блокируем кнопку
                saveBookBtn.disabled = true;
                saveBookBtn.textContent = 'Сохранение...';
                
                // Используем новую функцию update_book_with_authors
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
                        'authors_data': authorsJson,
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
    
    console.log('✅ Система редактирования книги с несколькими авторами загружена');
});