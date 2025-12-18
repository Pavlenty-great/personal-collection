from django.db import models

class PlacePublishing(models.Model):
    place_name = models.CharField(max_length=80)

    class Meta:
        db_table = 'place_publishing'

class Author(models.Model):
    first_name = models.CharField(max_length=80)
    middle_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)

    class Meta:
        db_table = 'authors'

class Book(models.Model):
    name = models.CharField(max_length=80)
    year = models.CharField(max_length=4)
    place_publishing = models.ForeignKey(
        'PlacePublishing',
        on_delete=models.PROTECT,
        db_column='place_publishing_id',
        null=True
    )

    class Meta:
        db_table = 'books'

class UserBook(models.Model):
    user = models.ForeignKey( #User будет хранить объект связанной модели
        'accounts.User', #Указание целевой модели для связки через имя приложения
        on_delete=models.CASCADE,
        db_column='user_id' #Имя столбца в БД
    )

    book = models.ForeignKey(
        'Book',
        on_delete=models.CASCADE,
        db_column='book_id'
    )

    class Meta:
        db_table = 'user_books'
        unique_together = ('user', 'book')

class BookAuthor(models.Model):
    book = models.ForeignKey(
        'Book',
        on_delete=models.CASCADE,
        db_column='book_id'
    )

    author = models.ForeignKey(
        'Author',
        on_delete=models.CASCADE,
        db_column='author_id',
    )

    class Meta:
        db_table = 'book_authors'
        unique_together = ('book', 'author')