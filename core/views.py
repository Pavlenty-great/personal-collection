from django.shortcuts import render

def index(request):
    #Получаем данные пользователя из сессиии
    user_id = request.session.get('user_id')
    user_login = request.session.get('user_login','Гость')
    
    context = {
        'user_id': user_id,
        'username': user_login
    }

    return render(request, 'index.html', context)