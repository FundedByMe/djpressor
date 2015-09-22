from django.db import models
from .utils import ImageDescriptor


class S3ImageUploadModelField(models.URLField):
    def __init__(self, *args, **kwargs):
        self.attrs = kwargs.pop('widget_attrs')
        super(S3ImageUploadModelField, self).__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        from .forms import S3ImageUploadFormField

        defaults = {"form_class": S3ImageUploadFormField,
                    "attrs": self.attrs}
        defaults.update(kwargs)
        return super(S3ImageUploadModelField, self).formfield(**defaults)


class CustomImageField(object):
    def __init__(self, source, *args, **kwargs):
        self.source = source

    def contribute_to_class(self, cls, name):
        self.app = cls._meta.app_label
        self.object = cls._meta.object_name
        self.field = name
        setattr(cls, name, ImageDescriptor(self, name, self.source))
