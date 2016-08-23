from django.conf import settings
from django.forms.widgets import TextInput
from django.contrib.staticfiles.templatetags.staticfiles import static


class S3ImageUploadFormWidget(TextInput):
    def __init__(self, *args, **kwargs):
        super(S3ImageUploadFormWidget, self).__init__(*args, **kwargs)
        self.attrs['data-s3-enabled'] = 'enabled'
        style = self.attrs.get('style', '')
        self.attrs['style'] = "visibility: hidden;" + style

    class Media:
        js = (
            'https://sdk.amazonaws.com/js/aws-sdk-2.1.48.min.js',
            static('djpressor/js/impressor/impressor.js'),
            static(getattr(settings,
                           'SPEC_JS_FILE_LOCATION',
                           'js/impressor/specs.js')),
            static('djpressor/js/form/form-image-upload-field.js'),
        )
