from django.shortcuts import render
from django.db import connection

def index(request):
    user_id = request.session.get('user_id')
    user_login = request.session.get('user_login', 'Гость')
    
    user_books = []
    search_query = request.GET.get('search', '').strip()
    
    if user_id:
        try:
            with connection.cursor() as cursor:
                if search_query:
                    # Используем функцию поиска
                    cursor.execute("SELECT * FROM search_user_books(%s, %s)", 
                                 [user_id, search_query])
                else:
                    # Используем обычную функцию для получения всех книг
                    cursor.execute("SELECT * FROM get_user_books(%s)", [user_id])
                
                # Получаем названия столбцов
                columns = [col[0] for col in cursor.description]
                
                # Преобразуем в список словарей
                user_books = [
                    dict(zip(columns, row))
                    for row in cursor.fetchall()
                ]
                
                print(f"🔍 Поиск: '{search_query}', найдено книг: {len(user_books)}")
                
        except Exception as e:
            print(f"❌ Ошибка при получении книг: {e}")
            user_books = []
    
    context = {
        'user_id': user_id,
        'username': user_login,
        'user_books': user_books,
        'search_query': search_query,
        'total_books': len(user_books),
    }
    
    return render(request, 'index.html', context)