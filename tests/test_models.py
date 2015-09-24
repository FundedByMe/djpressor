from __future__ import unicode_literals
from __future__ import absolute_import
from django.test import TestCase
from django.conf import settings
from tests.models import (
    SimpleModel,
    ModelWithImageExistanceVerifier)
from djpressor.forms import S3ImageUploadFormField


class TestDJPressorModelForms(TestCase):
    """
    Tests for djpressor custom Model fields.
    """
    original_image_path = "/projects/412/original.jpg"
    original_image_url = "http://media.example.com{}".format(
        original_image_path)

    def test_custom_image_field_descriptor(self):
        m = SimpleModel.objects.create(
            image=self.original_image_url
        )
        assert m.pk is not None

        assert m.thumbnail_image.url == self.original_image_url.replace(
            'original',
            'thumbnail_image')
        assert m.thumbnail_image.path == self.original_image_path.replace(
            'original',
            'thumbnail_image')

        assert m.square_image.url == self.original_image_url.replace(
            'original',
            'square_image')

        assert m.square_image.path == self.original_image_path.replace(
            'original',
            'square_image')

        # Test descriptor representation
        square_image_url = unicode(m.square_image)
        assert square_image_url == self.original_image_url.replace(
            'original',
            'square_image')

    def test_image_url_verification(self):
        m = ModelWithImageExistanceVerifier.objects.create(
            image=self.original_image_url
        )

        assert m.thumbnail_image.url == getattr(settings, 'DEFAULT_EMPTY')

    def test_s3_image_upload_field_formfield_set(self):
        m = SimpleModel.objects.create(
            image=self.original_image_url
        )

        image_field = [f for f in m._meta.fields if f.name == 'image'][0]

        assert isinstance(
            image_field.formfield(),
            S3ImageUploadFormField) is True

    def test_s3_image_upload_field_widget_attrs_set(self):
        m = SimpleModel.objects.create(
            image=self.original_image_url
        )

        image_field = [f for f in m._meta.fields if f.name == 'image'][0]

        assert 'data-spec' in image_field.attrs
