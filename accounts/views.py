from django.shortcuts import render, redirect
from .models import User
from django.http import HttpResponse


def registration(request):
    if request.method == 'POST':
        login = request.POST.get('login')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if User.objects.filter(login=login).exists():
            return render(request, 'registration.html', {'Ошибка': 'Данный логин уже занят'})
        
        if User.objects.filter(email=email).exists():
            return render(request, 'registration.html', {'Ошибка': 'Данный email уже занят'})

        try:
            user = User.objects.create(
                login=login,
                email=email,
                password=password
            )

            return redirect('core/')

        except Exception as e:
            return render(request, 'registration.html', {'Error': f'Ошибка при регистрации: {str(e)}'})
    
    return render(request, 'registration.html')


def authorization(request):

    if request.method == 'POST':
        login = request.POST.get('login')
        password = request.POST.get('password')

        if not login or not password:
            return render(request, 'authorization.html', {'Error': 'Все поля обязательны для заполнения'})
        
        try:
            user = User.objects.get(login=login)
            if password == user.password:
                #Сохраняем ID пользователя в сессии
                request.session['user_id'] = user.id
                request.session['user_login'] = user.login
                return redirect('core/')
            else:
                return render(request, 'authorization.html', {'error': 'Пользователь не найден'})
            
        except User.DoesNotExist:
            return render(request, 'authorization.html', 
                         {'error': 'Пользователь не найден'})
        except Exception as e:
            return render(request, 'authorization.html', {'error': f'Ошибка: {str(e)}'})
        
    return render(request, 'authorization.html')