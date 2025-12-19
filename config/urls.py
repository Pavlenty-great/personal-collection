from django.contrib import admin
from django.urls import path, include
from core import views

urlpatterns = [
    path('', views.index, name='index'),
    path('accounts/', include('accounts.urls')),
    path('books/', include('books.urls'))
]