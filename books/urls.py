from django.urls import path
from . import views

urlpatterns = [
    path('add/', views.add_book, name='add_book'),
    path('delete/', views.delete_books, name='delete_books'),
    path('<int:book_id>/', views.book_detail, name='book_detail'),
    path('get/<int:book_id>/', views.get_book_details, name='get_book_details'),
    path('update/<int:book_id>/', views.update_book, name='update_book'),
]