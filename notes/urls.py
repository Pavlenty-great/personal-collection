from django.urls import path
from . import views

urlpatterns = [
    path('add/<int:book_id>/', views.add_note, name='add_note')
]