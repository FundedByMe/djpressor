from urlparse import urlparse
from django import forms
from django.conf import settings
from .s3 import copy_object
from .widgets import S3ImageUploadFormWidget
from .models import S3ImageUploadModelField


class S3ImageUploadFormField(forms.CharField):
    widget = S3ImageUploadFormWidget

    def __init__(self, *args, **kwargs):
        self.attrs = kwargs.pop('attrs')
        super(S3ImageUploadFormField, self).__init__(*args, **kwargs)

    def widget_attrs(self, widget):
        attrs = super(S3ImageUploadFormField, self).widget_attrs(widget)
        attrs.update(self.attrs)
        return attrs


class ReplaceS3KeyNames(object):
    data = {}
    bucket_name = getattr(
        settings,
        "DJPRESSOR_DESTINATION_BUCKET",
        None
    )

    if not bucket_name:
        raise Exception("DJPRESSOR_DESTINATION_BUCKET setting is not set.")

    def __init__(self, *args, **kwargs):
        self.data = kwargs
        return super(ReplaceS3KeyNames, self).__init__(*args, **kwargs)

    def save(self, *args, **kwargs):
        fields = getattr(
            getattr(self.instance, 'CustomImageFields'), 'fields', [])

        if not fields:
            raise Exception("CustomImageFields class with fields list is not "
                            "defined for model.")

        form_prefix = self.prefix if hasattr(self, 'prefix') and self.prefix != None else ''

        for field_name in fields:
            hasnt_been_done_yet = True
            original_path = None
            original_final_value = None

            url = self.data.get(field_name)

            if url:
                # url is the url of the temp additional image
                parsed = urlparse(url)

                if parsed.netloc and parsed.path:
                    file_name = parsed.path.split("/")[
                        len(parsed.path.split("/")) - 1:
                    ][0]

                    key_path = parsed.path.replace(
                        '/{}/'.format(self.bucket_name),
                        '')

                    # get rid of '_temp' in key filename
                    new_key_path = key_path.replace(
                        file_name,
                        file_name.replace('_temp', '')
                    )

                    # Set original_path so it can be replace later
                    if not original_path:
                        original_path = key_path.replace(
                            file_name,
                            'original_temp.jpg'
                        )

                        original_final_value = url.replace(
                            file_name,
                            'original_temp.jpg'
                        )

                    # Replacing keyname actually entails copying the file over
                    # and replacing some of its metadata
                    copy_object(
                        src_bucket_name=self.bucket_name,
                        src_key_name=key_path,
                        dst_bucket_name=self.bucket_name,
                        dst_key_name=new_key_path,
                        preserve_acl=True
                    )

            # Do the same for the original image
            if original_path and hasnt_been_done_yet:
                new_original_path = original_path.replace('_temp', '')
                copy_object(
                    src_bucket_name=self.bucket_name,
                    src_key_name=original_path,
                    dst_bucket_name=self.bucket_name,
                    dst_key_name=new_original_path,
                    preserve_acl=True
                )

                # Set value of source field for additional special image fields
                source_field_name = new_original_path.split("/")[
                    len(new_original_path.split("/")) - 2:
                ][0]

                # If Form has a prefix, then we need to remove it from
                # source_field_name value to make sure we're updating the
                # correct field

                source_field_name = source_field_name.replace(
                    '%s-' % form_prefix,
                    ''
                )

                if original_final_value:
                    setattr(self.instance,
                            source_field_name,
                            original_final_value.replace('_temp', ''))

                hasnt_been_done_yet = False

        __save__ = super(ReplaceS3KeyNames, self).save(*args, **kwargs)
        return __save__


class ModelAdminFormFieldsOverrider(object):
    """
    A simple mixin to override S3ImageUploadModelField for django admin models.
    """
    def __init__(self, *args, **kwargs):
        super(ModelAdminFormFieldsOverrider, self).__init__(*args, **kwargs)

        if not self.custom_s3_field_attrs:
            raise Exception(
                "custom_s3_field_attrs is not defined in ModelAdmin class")

        self.formfield_overrides = {
            S3ImageUploadModelField: {
                'widget': S3ImageUploadFormWidget(
                    attrs=self.custom_s3_field_attrs
                )
            }
        }
