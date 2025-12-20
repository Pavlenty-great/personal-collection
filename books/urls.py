from django.urls import path
from . import views

urlpatterns = [
    path('add/', views.add_book, name='add_book'),
    path('delete/', views.delete_books, name='delete_books'),
    path('<int:book_id>/', views.book_detail, name='book_detail')
]