document.addEventListener('DOMContentLoaded', function() {
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        // Обработка нажатия Enter в поле поиска
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Предотвращаем стандартное поведение формы
                    
                    // Добавляем класс загрузки
                    searchInput.classList.add('search-loading');
                    searchButton.disabled = true;
                    searchButton.textContent = 'Поиск...';
                    
                    // Отправляем форму
                    searchForm.submit();
                }
            });
        }
        
        // Обработка клика по кнопке "Найти"
        if (searchButton) {
            searchButton.addEventListener('click', function(e) {
                // Если поле поиска пустое, не отправляем форму
                if (searchInput.value.trim() === '') {
                    e.preventDefault();
                    return;
                }
                
                // Добавляем класс загрузки
                searchInput.classList.add('search-loading');
                searchButton.disabled = true;
                searchButton.textContent = 'Поиск...';
                
                // Форма отправится стандартным образом
            });
        }
        
        // Показываем/скрываем кнопку очистки поиска
        function updateClearButton() {
            const clearBtn = document.querySelector('.clear-search-btn');
            if (clearBtn) {
                clearBtn.style.display = searchInput.value ? 'inline-block' : 'none';
            }
        }
        
        updateClearButton();
        
        if (searchInput) {
            searchInput.addEventListener('input', updateClearButton);
            
            // Фокус на поле поиска при загрузке страницы
            searchInput.focus();
            
            // Выделяем текст в поле поиска, если он есть
            if (searchInput.value) {
                searchInput.select();
            }
        }
        
        // Обработка кнопки "Очистить"
        const clearBtn = document.querySelector('.clear-search-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const url = new URL(window.location);
                url.searchParams.delete('search');
                window.location.href = url.toString();
            });
        }
        
        // Добавляем обработчик для сброса состояния загрузки при загрузке страницы
        window.addEventListener('pageshow', function(event) {
            // Сбрасываем состояние загрузки при возврате на страницу
            if (searchInput) {
                searchInput.classList.remove('search-loading');
            }
            if (searchButton) {
                searchButton.disabled = false;
                searchButton.textContent = 'Найти';
            }
        });
    });