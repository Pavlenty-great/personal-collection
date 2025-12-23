// books/static/js/add_book.js
(function() {
    'use strict';
    
    console.log('📚 Система добавления книги с несколькими авторами загружена');
    
    // Конфигурация
    const MAX_AUTHORS = 5;
    let authorCount = 0;
    let authorBlocks = [];
    
    // DOM элементы
    let modal, authorsContainer, addAuthorBtn, addBookForm;
    
    // Инициализация
    function init() {
        console.log('🔧 Инициализация системы добавления книги');
        
        // Находим элементы
        modal = document.getElementById('bookModal');
        authorsContainer = document.getElementById('authorsContainer');
        addAuthorBtn = document.getElementById('addAuthorBtn');
        addBookForm = document.getElementById('addBookForm');
        
        if (!modal || !authorsContainer) {
            console.error('❌ Не найдены необходимые элементы');
            return;
        }
        
        console.log('✅ Элементы найдены:', {
            modal: !!modal,
            authorsContainer: !!authorsContainer,
            addAuthorBtn: !!addAuthorBtn,
            addBookForm: !!addBookForm
        });
        
        // Настройка обработчиков
        setupEventListeners();
        
        // Создаем первого автора
        createFirstAuthor();
        
        console.log('🚀 Система готова к работе');
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Кнопка открытия модального окна
        const openBtn = document.getElementById('openModalBtn');
        if (openBtn) {
            openBtn.addEventListener('click', openModal);
        }
        
        // Кнопка закрытия
        const closeBtn = document.getElementById('closeModalBtn');
        const closeSpan = document.querySelector('.close');
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeSpan) closeSpan.addEventListener('click', closeModal);
        
        // Закрытие по клику вне окна
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Кнопка добавления автора
        if (addAuthorBtn) {
            addAuthorBtn.addEventListener('click', addAuthor);
        }
        
        // Обработка отправки формы
        if (addBookForm) {
            addBookForm.addEventListener('submit', handleFormSubmit);
        }
    }
    
    // Открытие модального окна
    function openModal() {
        console.log('📖 Открытие модального окна');
        if (modal) {
            modal.style.display = 'flex';
            resetForm();
        }
    }
    
    // Закрытие модального окна
    function closeModal() {
        console.log('📕 Закрытие модального окна');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Создание первого автора
    function createFirstAuthor() {
        console.log('👤 Создание первого автора');
        
        authorsContainer.innerHTML = '';
        authorBlocks = [];
        authorCount = 0;
        
        addAuthorBlock(true); // Первый автор обязательный
    }
    
    // Добавление блока автора
    function addAuthorBlock(isFirst = false) {
        if (authorCount >= MAX_AUTHORS) {
            console.log('⚠️ Достигнут максимум авторов');
            return;
        }
        
        authorCount++;
        const authorIndex = authorCount;
        
        console.log(`➕ Добавление автора #${authorIndex}`);
        
        const authorBlock = document.createElement('div');
        authorBlock.className = 'author-block';
        authorBlock.dataset.index = authorIndex;
        
        authorBlock.innerHTML = `
            <div class="author-header">
                <span class="author-number">Автор #${authorIndex}${isFirst ? ' *' : ''}</span>
                ${!isFirst ? '<button type="button" class="remove-author-btn" onclick="removeAuthor(' + authorIndex + ')">🗑️ Удалить</button>' : ''}
            </div>
            
            <div class="author-fields">
                <div class="field-group">
                    <label for="authorLastName${authorIndex}">Фамилия${isFirst ? ':*' : ':'}</label>
                    <input type="text" id="authorLastName${authorIndex}" 
                           class="author-input" 
                           data-field="last_name"
                           placeholder="Иванов" ${isFirst ? 'required' : ''} maxlength="80">
                </div>
                
                <div class="field-group">
                    <label for="authorFirstName${authorIndex}">Имя${isFirst ? ':*' : ':'}</label>
                    <input type="text" id="authorFirstName${authorIndex}" 
                           class="author-input" 
                           data-field="first_name"
                           placeholder="Иван" ${isFirst ? 'required' : ''} maxlength="80">
                </div>
                
                <div class="field-group">
                    <label for="authorMiddleName${authorIndex}">Отчество:</label>
                    <input type="text" id="authorMiddleName${authorIndex}" 
                           class="author-input" 
                           data-field="middle_name"
                           placeholder="Иванович (необязательно)" maxlength="80">
                </div>
            </div>
            
            <div class="author-error" id="authorError${authorIndex}" style="display: none;">
                Заполните фамилию и имя автора
            </div>
        `;
        
        authorsContainer.appendChild(authorBlock);
        authorBlocks.push(authorBlock);
        
        // Обновляем кнопку добавления
        updateAddAuthorButton();
        
        // Анимация появления
        setTimeout(() => {
            authorBlock.style.opacity = '1';
            authorBlock.style.transform = 'translateY(0)';
        }, 10);
        
        return authorBlock;
    }
    
    // Функция для добавления автора (публичная для кнопки)
    window.addAuthor = function() {
        console.log('🎯 Вызов addAuthor()');
        addAuthorBlock();
    };
    
    // Функция для удаления автора
    window.removeAuthor = function(index) {
        console.log(`🗑️ Удаление автора #${index}`);
        
        const authorBlock = document.querySelector(`.author-block[data-index="${index}"]`);
        if (authorBlock) {
            // Анимация удаления
            authorBlock.style.opacity = '0';
            authorBlock.style.transform = 'translateX(-20px)';
            authorBlock.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                authorBlock.remove();
                
                // Обновляем массив блоков
                authorBlocks = Array.from(document.querySelectorAll('.author-block'));
                authorCount = authorBlocks.length;
                
                // Обновляем номера
                updateAuthorNumbers();
                updateAddAuthorButton();
            }, 300);
        }
    };
    
    // Обновление номеров авторов
    function updateAuthorNumbers() {
        console.log('🔢 Обновление номеров авторов');
        
        authorBlocks.forEach((block, index) => {
            const newIndex = index + 1;
            block.dataset.index = newIndex;
            
            // Обновляем номер в заголовке
            const numberSpan = block.querySelector('.author-number');
            if (numberSpan) {
                const isFirst = newIndex === 1;
                numberSpan.textContent = `Автор #${newIndex}${isFirst ? ' *' : ''}`;
            }
            
            // Обновляем ID полей
            const inputs = block.querySelectorAll('.author-input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                input.id = `author${field.charAt(0).toUpperCase() + field.slice(1)}${newIndex}`;
            });
            
            // Обновляем кнопку удаления
            const removeBtn = block.querySelector('.remove-author-btn');
            if (removeBtn) {
                if (newIndex === 1) {
                    removeBtn.style.display = 'none';
                } else {
                    removeBtn.style.display = 'block';
                    removeBtn.onclick = function() {
                        window.removeAuthor(newIndex);
                    };
                }
            }
        });
    }
    
    // Обновление кнопки добавления автора
    function updateAddAuthorButton() {
        if (!addAuthorBtn) return;
        
        if (authorCount >= MAX_AUTHORS) {
            addAuthorBtn.disabled = true;
            addAuthorBtn.textContent = `Максимум ${MAX_AUTHORS} авторов`;
            addAuthorBtn.style.opacity = '0.6';
        } else {
            addAuthorBtn.disabled = false;
            addAuthorBtn.textContent = '➕ Добавить еще автора';
            addAuthorBtn.style.opacity = '1';
        }
    }
    
    // Сбор данных авторов в JSON
    function collectAuthorsData() {
        console.log('📦 Сбор данных авторов');
        
        const authors = [];
        const authorBlocks = document.querySelectorAll('.author-block');
        
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
                console.log(`✅ Автор добавлен: ${lastName} ${firstName}`);
            }
        });
        
        return authors;
    }
    
    // Валидация формы
    function validateForm() {
        console.log('✅ Валидация формы');
        
        // Проверяем основные поля
        const bookName = document.getElementById('bookName').value.trim();
        const bookYear = document.getElementById('bookYear').value.trim();
        const placeName = document.getElementById('bookPlace').value.trim();
        
        if (!bookName) {
            alert('Введите название книги');
            return false;
        }
        
        if (!bookYear || !/^\d{4}$/.test(bookYear)) {
            alert('Введите корректный год издания (4 цифры)');
            return false;
        }
        
        if (!placeName) {
            alert('Введите место публикации');
            return false;
        }
        
        // Проверяем авторов
        const authors = collectAuthorsData();
        if (authors.length === 0) {
            alert('Добавьте хотя бы одного автора (фамилию и имя)');
            return false;
        }
        
        // Проверяем каждого автора
        const authorBlocks = document.querySelectorAll('.author-block');
        let isValid = true;
        
        authorBlocks.forEach((block, index) => {
            const lastName = block.querySelector('input[data-field="last_name"]').value.trim();
            const firstName = block.querySelector('input[data-field="first_name"]').value.trim();
            const errorDiv = block.querySelector('.author-error');
            
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
            alert('Для каждого автора заполните и фамилию, и имя');
            return false;
        }
        
        return true;
    }
    
    // Обработка отправки формы
    async function handleFormSubmit(event) {
        event.preventDefault();
        console.log('📤 Отправка формы');
        
        // Валидация
        if (!validateForm()) {
            return;
        }
        
        // Собираем данные
        const bookName = document.getElementById('bookName').value.trim();
        const bookYear = document.getElementById('bookYear').value.trim();
        const placeName = document.getElementById('bookPlace').value.trim();
        const authors = collectAuthorsData();
        
        // Преобразуем авторов в JSON
        const authorsJson = JSON.stringify(authors);
        
        // Создаем FormData
        const formData = new FormData();
        formData.append('book_name', bookName);
        formData.append('book_year', bookYear);
        formData.append('place_name', placeName);
        formData.append('authors_data', authorsJson);
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
        
        // Блокируем кнопку отправки
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '📥 Добавление...';
        }
        
        try {
            console.log('🔄 Отправка данных на сервер...');
            
            // Отправляем запрос
            const response = await fetch('/books/add/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('✅ Книга добавлена');
                closeModal();
                window.location.reload();
            } else {
                const errorText = await response.text();
                console.error('❌ Ошибка сервера:', errorText);
                alert('Ошибка при добавлении книги');
            }
            
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            alert('Ошибка сети при добавлении книги');
        } finally {
            // Разблокируем кнопку
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Добавить книгу';
            }
        }
    }
    
    // Сброс формы
    function resetForm() {
        console.log('🔄 Сброс формы');
        createFirstAuthor();
        
        // Очищаем основные поля
        document.getElementById('bookName').value = '';
        document.getElementById('bookYear').value = '';
        document.getElementById('bookPlace').value = '';
        
        updateAddAuthorButton();
    }
    
    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', init);
    
    // Экспортируем публичные функции
    window.openAddBookModal = openModal;
    window.closeAddBookModal = closeModal;
    window.resetAuthors = createFirstAuthor;
    
    console.log('🎉 Система добавления книги с несколькими авторами готова');
    
})();