import requests
from django import forms
from urlparse import urlparse


class ImageFileObject(object):
    def __init__(self, *args, **kwargs):
        self.path = ''
        self.url = ''

    def __unicode__(self):
        return self.url

    def __repr__(self):
        return self.__unicode__()


class ImageDescriptor(object):
    def __init__(self, field, attname, source_field_name):
        self.attname = attname
        self.field = field
        self.source_field_name = source_field_name
        self.imagefile = ImageFileObject()

    def __get__(self, instance, owner):
        """
        Guesses the url of the image based on:
        - source field's value
        - source field's name
        - for more information, consult ImageUpload.md
        """

        if instance is None:
            return self.field
        else:
            source = getattr(instance, self.source_field_name)

            # Parse original image url
            parsed = urlparse(source)

            if not parsed.netloc or not parsed.path:
                # if source field doesn't have a url in it
                # we'll just return an empty ImageFileObject
                return self.imagefile

            # get original image filename
            filename = parsed.path.split("/")[
                len(parsed.path.split("/")) - 1:
            ][0]

            filename_no_ext = filename.split('.')[0]

            path = parsed.path.replace(
                filename_no_ext,  # original file
                self.attname      # fieldname.ext == filename.ext
            )

            # new url
            url = "{0}://{1}{2}".format(
                parsed.scheme,
                parsed.netloc,
                path
            )

            self.imagefile.url = url
            self.imagefile.path = path

            # if `verify_exists` is True and url is not 200,
            # we return `default_empty`
            if getattr(instance.CustomImageFields, "verify_exists", None):
                r = requests.get(url)

                if r.status_code != 200:
                    self.imagefile.url = getattr(
                        instance.CustomImageFields,
                        "default_empty", "")

            return self.imagefile

    def __set__(self, instance, value):
        instance.__dict__[self.attname] = value


class GenericMixedinModelFormGenerator():
    def __init__(self, model_class):
        from .forms import ReplaceS3KeyNames

        class TheForm(ReplaceS3KeyNames, forms.ModelForm):
            class Meta:
                model = model_class

        self._class = TheForm

    def generate(self):
        return self._class
