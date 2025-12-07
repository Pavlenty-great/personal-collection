from django.db import models

class NoteType(models.Model):
    type = models.TextField()

    class Meta:
        db_table = 'note_types'

class Note(models.Model):
    note = models.TextField()
    type = models.ForeignKey(
        'NoteType',
        on_delete=models.CASCADE,
        db_column='type_id'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        db_column='user_id'
    )
    book = models.ForeignKey(
        'books.Book',
        on_delete=models.CASCADE,
        db_column='book_id'
    )
    date_created = models.DateTimeField(auto_now_add=True) #auto_now_add=True - автоматически фиксирует время создания

    class Meta:
        db_table = 'notes'