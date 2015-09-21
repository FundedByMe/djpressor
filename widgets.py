from django.conf import settings
from django.forms.widgets import TextInput
# from fundedbyme.shared.widgets import TextInput


class S3ImageUploadFormWidget(TextInput):
    # fbm_input_class = 'hidden'

    def __init__(self, *args, **kwargs):
        super(S3ImageUploadFormWidget, self).__init__(*args, **kwargs)
        self.attrs['data-s3-enabled'] = True
        style = self.attrs.get('style', '')
        self.attrs['style'] = "display: none;" + style

    class Media:
        js = (
            'https://sdk.amazonaws.com/js/aws-sdk-2.1.48.min.js',
            'djpressor/js/impressor/impressor.js',
            getattr(settings,
                    'SPEC_JS_FILE_LOCATION',
                    'js/impressor/specs.js'),
            'djpressor/js/form/form-image-upload-field.js',
        )
