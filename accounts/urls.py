from django.urls import path
from accounts import views

urlpatterns = [
    path('', views.registration),
    path('/Authorization', views.authorization, name='Authorization'),
]