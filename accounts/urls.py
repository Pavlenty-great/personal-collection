from django.urls import path
from accounts import views

urlpatterns = [
    path('register/', views.registration, name='register'),
    path('login/', views.authorization, name='login'),
    path('logout/', views.logout_view, name='logout')
]