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


@require_POST
def delete_notes(request, book_id):
    """Удаление заметок к книге"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        messages.error(request, 'Необходимо авторизоваться')
        return redirect('login')
    
    # Получаем массив ID заметок для удаления
    note_ids = request.POST.getlist('note_ids')
    
    if not note_ids:
        messages.warning(request, 'Не выбрано ни одной заметки для удаления')
        return redirect('book_detail', book_id=book_id)
    
    # Преобразуем строки в целые числа
    try:
        note_ids_int = [int(note_id) for note_id in note_ids]
    except ValueError:
        messages.error(request, 'Некорректные ID заметок')
        return redirect('book_detail', book_id=book_id)
    
    try:
        with connection.cursor() as cursor:
            # ВАЖНО: Преобразуем список в массив PostgreSQL
            # Способ 1: Используем строковое представление массива
            note_ids_array = "{" + ",".join(map(str, note_ids_int)) + "}"
            
            # Вызываем SQL-функцию с массивом
            cursor.execute("""
                SELECT delete_user_notes(%s, %s::INTEGER[])
            """, [user_id, note_ids_array])
            
            result = cursor.fetchone()
            deleted_count = result[0] if result else 0
            
            if deleted_count > 0:
                messages.success(request, f'✅ Удалено {deleted_count} заметок')
            elif deleted_count == 0:
                messages.info(request, 'Не удалось удалить выбранные заметки')
            else:
                messages.error(request, 'Ошибка при удалении заметок')
                
    except Exception as e:
        messages.error(request, f'❌ Ошибка: {str(e)}')
    
    return redirect('book_detail', book_id=book_id)