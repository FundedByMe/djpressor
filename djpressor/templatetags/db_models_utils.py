from django.db.models.loading import get_model
from django import template
register = template.Library()


@register.simple_tag(takes_context=False)
def guess_next_available_pk(model_name, app_name):
    """
    Returns an id for sqls nextval available for a table.
    Pass in model_name and app_name is necessary for django
    to get the model class and figure out table name.
    """
    model_class = get_model(app_name.lower(), model_name.lower())
    table_name = model_class._meta.db_table

    from django.db import connection
    cursor = connection.cursor()
    cursor.execute("select nextval('%s_id_seq')" % table_name)
    row = cursor.fetchone()
    cursor.close()
    return row[0]
