from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import connection
from django.views.decorators.http import require_POST

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
    user_id = request.session.get('user_id')
    
    if not user_id:
        messages.error(request, 'Необходимо авторизоваться')
        return redirect('login')
    
    try:
        # Проверяем, что книга принадлежит пользователю и получаем данные
        with connection.cursor() as cursor:
            # Используем нашу функцию или прямой запрос
            cursor.execute("""
                SELECT * FROM get_user_books(%s)
                WHERE book_id = %s
            """, [user_id, book_id])
            
            result = cursor.fetchone()
            
            if not result:
                messages.error(request, 'Книга не найдена')
                return redirect('index')
            
            # Преобразуем в словарь
            columns = [col[0] for col in cursor.description]
            book = dict(zip(columns, result))
            
            context = {
                'book': book,
            }
            
            return render(request, 'book_detail.html', context)
            
    except Exception as e:
        messages.error(request, f'Ошибка: {str(e)}')
        return redirect('index')