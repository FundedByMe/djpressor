from django.db import models
from django.conf import settings
from djpressor.models import (S3ImageUploadModelField,
                              CustomImageField)


class SimpleModel(models.Model):
    image = S3ImageUploadModelField(
        widget_attrs={
            'data-enable-preview': 'true',
            'data-spec': 'some_spec'
        }
    )
    thumbnail_image = CustomImageField(source='image')
    square_image = CustomImageField(source='image')
    nav_image = CustomImageField(source='image')

    class CustomImageFields:
        fields = [
            'thumbnail_image',
            'square_image',
            'nav_image'
        ]


class ModelWithImageExistanceVerifier(models.Model):
    image = S3ImageUploadModelField(
        widget_attrs={
            'data-enable-preview': 'false',
            'data-spec': 'some_spec'
        }
    )
    thumbnail_image = CustomImageField(source='image')

    class CustomImageFields:
        verify_exists = True
        default_empty = getattr(settings, 'DEFAULT_EMPTY')
        fields = [
            'thumbnail_image',
        ]
