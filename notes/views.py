from django.shortcuts import render, redirect
from django.contrib import messages
from django.db import connection
from django.views.decorators.http import require_POST

@require_POST
def add_note(request, book_id):
    """Добавление заметки к книге"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        messages.error(request, 'Необходимо авторизоваться')
        return redirect('login')
    
    note_text = request.POST.get('note_text', '').strip()
    note_type_id = request.POST.get('note_type_id', 1)  # По умолчанию тип 1
    
    if not note_text:
        messages.error(request, 'Заметка не может быть пустой')
        return redirect('book_detail', book_id=book_id)  # Или на главную
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT add_note(%s, %s, %s, %s)
            """, [user_id, book_id, note_text, note_type_id])
            
            result = cursor.fetchone()
            note_id = result[0] if result else -1
            
            if note_id > 0:
                messages.success(request, '✅ Заметка добавлена')
            else:
                messages.error(request, '❌ Ошибка при добавлении заметки')
                
    except Exception as e:
        messages.error(request, f'❌ Ошибка: {str(e)}')
    
    return redirect('book_detail', book_id=book_id)  # Или на главную