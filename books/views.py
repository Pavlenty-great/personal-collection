from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import connection
from django.views.decorators.http import require_POST
from django.http import JsonResponse

@require_POST
def add_book(request):
    """Добавление книги с несколькими авторами"""
    user_id = request.session.get('user_id')
    if not user_id:
        messages.error(request, 'Для добавления книги необходимо авторизоваться')
        return redirect('login')
    
    if request.method == 'POST':
        # Получаем данные книги
        book_name = request.POST.get('book_name', '').strip()
        book_year = request.POST.get('book_year', '').strip()
        place_name = request.POST.get('place_name', '').strip()
        authors_data = request.POST.get('authors_data', '[]')
        
        print(f"📥 Получены данные для добавления книги:")
        print(f"   Название: {book_name}")
        print(f"   Год: {book_year}")
        print(f"   Место: {place_name}")
        print(f"   Авторы (JSON): {authors_data}")
        
        # Валидация
        if not book_name:
            messages.error(request, 'Введите название книги')
            return redirect('index')
        
        if not book_year or not book_year.isdigit() or len(book_year) != 4:
            messages.error(request, 'Введите корректный год издания (4 цифры)')
            return redirect('index')
        
        if not place_name:
            messages.error(request, 'Введите место публикации')
            return redirect('index')
        
        try:
            # Парсим JSON с авторами
            import json
            authors = json.loads(authors_data)
            
            if not isinstance(authors, list):
                raise ValueError("Неверный формат данных авторов")
            
            # Фильтруем пустых авторов
            valid_authors = []
            for author in authors:
                if (author.get('last_name') and author.get('first_name') and 
                    author['last_name'].strip() and author['first_name'].strip()):
                    valid_authors.append({
                        'last_name': author['last_name'].strip(),
                        'first_name': author['first_name'].strip(),
                        'middle_name': author.get('middle_name', '').strip()
                    })
            
            if not valid_authors:
                messages.error(request, 'Добавьте хотя бы одного автора')
                return redirect('index')
            
            print(f"✅ Найдено {len(valid_authors)} валидных авторов")
            
            # Преобразуем обратно в JSON
            authors_json = json.dumps(valid_authors, ensure_ascii=False)
            
            with connection.cursor() as cursor:
                # Используем новую функцию с несколькими авторами
                cursor.execute("""
                    SELECT add_book_with_multiple_authors(%s, %s, %s, %s, %s)
                """, [user_id, book_name, book_year, place_name, authors_json])
                
                result = cursor.fetchone()
                book_id = result[0] if result else -1
                
                if book_id > 0:
                    messages.success(request, f'✅ Книга "{book_name}" добавлена с {len(valid_authors)} авторами!')
                else:
                    messages.error(request, '❌ Ошибка при добавлении книги')
                    
        except json.JSONDecodeError:
            messages.error(request, '❌ Ошибка в данных авторов')
            return redirect('index')
        except Exception as e:
            print(f"❌ Ошибка: {str(e)}")
            messages.error(request, f'❌ Ошибка: {str(e)}')
        
        return redirect('index')

    return render(request, 'add_book.html')


@require_POST
def delete_books(request):
    """Удаляет выбранные книги пользователя"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        messages.error(request, 'Необходимо авторизоваться')
        return redirect('login')
    
    # Получаем массив ID книг для удаления
    book_ids = request.POST.getlist('book_ids')
    
    if not book_ids:
        messages.warning(request, 'Не выбрано ни одной книги для удаления')
        return redirect('index')
    
    # Преобразуем строки в целые числа
    try:
        book_ids_int = [int(book_id) for book_id in book_ids]
    except ValueError:
        messages.error(request, 'Некорректные ID книг')
        return redirect('index')
    
    try:
        with connection.cursor() as cursor:
            # Вызываем SQL-функцию для удаления
            cursor.execute("""
                SELECT delete_user_books(%s, %s::INTEGER[])
            """, [user_id, book_ids_int])
            
            result = cursor.fetchone()
            deleted_count = result[0] if result else 0
            
            if deleted_count > 0:
                messages.success(request, f'✅ Удалено {deleted_count} книг')
            elif deleted_count == 0:
                messages.info(request, 'Не удалось найти выбранные книги')
            else:
                messages.error(request, 'Ошибка при удалении книг')
                
    except Exception as e:
        messages.error(request, f'❌ Ошибка: {str(e)}')
    
    return redirect('index')


def book_detail(request, book_id):
    """Детальная страница книги с заметками"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        messages.error(request, 'Необходимо авторизоваться')
        return redirect('login')
    
    try:
        # 1. Получаем информацию о книге через существующую функцию
        with connection.cursor() as cursor:
            # Получаем данные книги
            cursor.execute("""
                SELECT * FROM get_user_books(%s) 
                WHERE book_id = %s
            """, [user_id, book_id])
            
            book_result = cursor.fetchone()
            
            if not book_result:
                messages.error(request, 'Книга не найдена в вашей коллекции')
                return redirect('index')
            
            # Преобразуем результат в словарь
            columns = ['book_id', 'book_name', 'authors_list', 'book_year', 'place_name']
            book_data = dict(zip(columns, book_result))
            
            # 2. Получаем заметки к книге через новую функцию
            cursor.execute("""
                SELECT * FROM get_user_notes_for_book(%s, %s)
            """, [user_id, book_id])
            
            # Получаем названия столбцов
            note_columns = [desc[0] for desc in cursor.description]
            
            # Преобразуем заметки в список словарей
            notes = []
            for row in cursor.fetchall():
                note_dict = dict(zip(note_columns, row))
                
                # Форматируем дату для отображения
                from django.utils.timezone import localtime
                note_dict['date_created'] = localtime(note_dict['date_created'])
                
                notes.append(note_dict)
            
            # 3. Формируем контекст
            context = {
                'book': book_data,
                'notes': notes,
            }
            
            return render(request, 'book_detail.html', context)
            
    except Exception as e:
        messages.error(request, f'Ошибка: {str(e)}')
        return redirect('index')
    

def get_book_details(request, book_id):
    """Получение деталей книги для редактирования (AJAX)"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        return JsonResponse({'error': 'Необходимо авторизоваться'}, status=401)
    
    try:
        with connection.cursor() as cursor:
            # Получаем данные книги через существующую функцию
            cursor.execute("""
                SELECT * FROM get_user_books(%s) 
                WHERE book_id = %s
            """, [user_id, book_id])
            
            book_result = cursor.fetchone()
            
            if not book_result:
                return JsonResponse({'error': 'Книга не найдена'}, status=404)
            
            # Преобразуем результат в словарь
            columns = ['book_id', 'book_name', 'authors_list', 'book_year', 'place_name']
            book_data = dict(zip(columns, book_result))
            
            return JsonResponse(book_data)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_POST
def update_book(request, book_id):
    """Обновление книги с несколькими авторами (AJAX)"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        return JsonResponse({'success': False, 'error': 'Необходимо авторизоваться'}, status=401)
    
    # Получаем данные из формы
    book_name = request.POST.get('book_name', '').strip()
    book_year = request.POST.get('book_year', '').strip()
    place_name = request.POST.get('place_name', '').strip()
    authors_json = request.POST.get('authors_data', '[]')
    
    # Проверяем, что есть хотя бы одно поле для обновления
    if not any([book_name, book_year, place_name]) and authors_json == '[]':
        return JsonResponse({'success': False, 'error': 'Укажите хотя бы одно поле для обновления'}, status=400)
    
    # Валидация года
    if book_year and (not book_year.isdigit() or len(book_year) != 4):
        return JsonResponse({'success': False, 'error': 'Год должен состоять из 4 цифр'}, status=400)
    
    try:
        # Парсим JSON с авторами
        import json
        authors = json.loads(authors_json)
        
        if not isinstance(authors, list):
            return JsonResponse({'success': False, 'error': 'Неверный формат данных авторов'}, status=400)
        
        # Фильтруем пустых авторов
        valid_authors = []
        for author in authors:
            if (author.get('last_name') and author.get('first_name') and 
                author['last_name'].strip() and author['first_name'].strip()):
                valid_authors.append({
                    'last_name': author['last_name'].strip(),
                    'first_name': author['first_name'].strip(),
                    'middle_name': author.get('middle_name', '').strip()
                })
        
        # Преобразуем обратно в JSON
        authors_json_valid = json.dumps(valid_authors, ensure_ascii=False)
        
        with connection.cursor() as cursor:
            # Используем функцию для обновления с несколькими авторами
            cursor.execute("""
                SELECT update_book_with_authors(%s, %s, %s, %s, %s, %s)
            """, [
                user_id, book_id,
                book_name if book_name else None,
                book_year if book_year else None,
                place_name if place_name else None,
                authors_json_valid if valid_authors else None
            ])
            
            result = cursor.fetchone()
            success = result[0] if result else False
            
            if success:
                return JsonResponse({'success': True, 'message': 'Книга успешно обновлена'})
            else:
                return JsonResponse({'success': False, 'error': 'Не удалось обновить книгу'}, status=400)
                
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Ошибка в данных авторов'}, status=400)
    except Exception as e:
        print(f"❌ Ошибка при обновлении книги: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)