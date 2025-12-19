from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import connection

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
            print("🔧 ПЕРЕД вызовом функции add_book")
            
            with connection.cursor() as cursor:
                sql = "SELECT add_book(%s, %s, %s, %s, %s, %s, %s)"
                params = [user_id, book_name, book_year, place_name, 
                         author_last, author_first, author_middle]
                
                print(f"📝 SQL: {sql}")
                print(f"📝 Параметры: {params}")
                
                cursor.execute(sql, params)
                
                result = cursor.fetchone()
                print(f"📊 Результат функции: {result}")
                
                if result:
                    book_id = result[0]
                    print(f"📖 ID книги: {book_id}")
                    
                    if book_id > 0:
                        print("✅ УСПЕХ: Книга добавлена!")
                        cursor.execute("SELECT COUNT(*) FROM books WHERE id = %s", [book_id])
                        count = cursor.fetchone()[0]
                        print(f"🔍 Проверка: книг с ID {book_id} в БД: {count}")
                    else:
                        print("❌ ФУНКЦИЯ ВЕРНУЛА ОШИБКУ: -1 или 0")
                else:
                    print("⚠️ Функция не вернула результат (NULL)")
                
                from django.db import transaction
                transaction.commit()
                print("💾 Транзакция закоммичена")
                
                messages.success(request, f'Книга "{book_name}" добавлена!')
                return redirect('index')
                
        except Exception as e:
            print(f"🔥 КРИТИЧЕСКАЯ ОШИБКА: {e}")
            import traceback
            traceback.print_exc()
            messages.error(request, f'Ошибка: {str(e)}')
            return redirect('index')
    
    # GET запрос
    return render(request, 'add_book.html')