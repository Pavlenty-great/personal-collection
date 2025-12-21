from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import connection
from django.views.decorators.http import require_POST
from django.http import JsonResponse

def add_book(request):
    # ОТЛАДКА
    print("=" * 60)
    print("🔍 DEBUG: Функция add_book ВЫЗВАНА")
    print(f"   Метод запроса: {request.method}")
    print(f"   Путь: {request.path}")
    print(f"   Пользователь из сессии: {request.session.get('user_id')}")
    print("=" * 60)
    
    # ПРОВЕРКА АВТОРИЗАЦИИ
    user_id = request.session.get('user_id')
    if not user_id:
        messages.error(request, 'Для добавления книги необходимо авторизоваться')
        return redirect('login')
    
    if request.method == 'POST':
        print("📦 ПОЛУЧЕНЫ ДАННЫЕ ФОРМЫ:")
        for key, value in request.POST.items():
            print(f"   {key}: {value}")
        print("=" * 60)
        
        # ПОЛУЧЕНИЕ ДАННЫХ
        book_name = request.POST.get('bookName', '').strip()
        book_year = request.POST.get('bookYear', '').strip()
        place_name = request.POST.get('bookPlace', '').strip()
        author_last = request.POST.get('authorLastName', '').strip()
        author_first = request.POST.get('authorFirstName', '').strip()
        author_middle = request.POST.get('authorMiddleName', '').strip()
        
        # ПРОВЕРКА
        if not all([book_name, book_year, place_name, author_last, author_first]):
            messages.error(request, 'Заполните все обязательные поля')
            return redirect('index')
        
        # ВЫЗОВ SQL-ФУНКЦИИ
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT add_book(%s, %s, %s, %s, %s, %s, %s)", 
                            [user_id, book_name, book_year, place_name, 
                            author_last, author_first, author_middle])
                
                result = cursor.fetchone()
                book_id = result[0] if result else -1
                
                if book_id > 0:
                    # Проверим, была ли книга добавлена или уже существовала
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM user_books 
                        WHERE user_id = %s AND book_id = %s
                    """, [user_id, book_id])
                    
                    count = cursor.fetchone()[0]
                    
                    if count == 1:
                        messages.success(request, f'✅ Книга "{book_name}" добавлена!')
                    else:
                        messages.info(request, f'ℹ️ Книга "{book_name}" уже есть в вашей коллекции')
                        
                else:
                    messages.error(request, '❌ Ошибка при добавлении книги')
                
        except Exception as e:
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
    """Обновление книги (AJAX)"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        return JsonResponse({'success': False, 'error': 'Необходимо авторизоваться'}, status=401)
    
    # Получаем данные из формы
    book_name = request.POST.get('book_name', '').strip()
    book_year = request.POST.get('book_year', '').strip()
    place_name = request.POST.get('place_name', '').strip()
    author_last_name = request.POST.get('author_last_name', '').strip()
    author_first_name = request.POST.get('author_first_name', '').strip()
    author_middle_name = request.POST.get('author_middle_name', '').strip()
    
    # Проверяем, что есть хотя бы одно поле для обновления
    if not any([book_name, book_year, place_name, author_last_name, author_first_name]):
        return JsonResponse({'success': False, 'error': 'Укажите хотя бы одно поле для обновления'}, status=400)
    
    # Валидация года
    if book_year and not book_year.isdigit() or len(book_year) != 4:
        return JsonResponse({'success': False, 'error': 'Год должен состоять из 4 цифр'}, status=400)
    
    try:
        with connection.cursor() as cursor:
            # Вызываем SQL-функцию для обновления книги
            cursor.execute("""
                SELECT update_user_book(%s, %s, %s, %s, %s, %s, %s, %s)
            """, [
                user_id, book_id,
                book_name if book_name else None,
                book_year if book_year else None,
                place_name if place_name else None,
                author_last_name if author_last_name else None,
                author_first_name if author_first_name else None,
                author_middle_name if author_middle_name else None
            ])
            
            result = cursor.fetchone()
            success = result[0] if result else False
            
            if success:
                return JsonResponse({'success': True, 'message': 'Книга успешно обновлена'})
            else:
                return JsonResponse({'success': False, 'error': 'Не удалось обновить книгу'}, status=400)
                
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)