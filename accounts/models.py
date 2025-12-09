from django.db import models

class User(models.Model):
    email = models.EmailField(max_length=80, unique=True)
    password = models.CharField(max_length=80)
    login = models.CharField(max_length=80, unique=True)

    class Meta:
        db_table = 'users' #Название таблицы в БД