from urlparse import urlparse
from django import forms
from fundedbyme.shared.utils.s3 import copy_object
from .widgets import S3ImageUploadFormWidget
from .models import S3ImageUploadModelField

bucket_name = "media2.fundedbyme.com"


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

    def __init__(self, *args, **kwargs):
        self.data = kwargs
        return super(ReplaceS3KeyNames, self).__init__(*args, **kwargs)

    def save(self, *args, **kwargs):
        fields = getattr(
            getattr(self.instance, 'CustomImageFields'), 'fields', [])

        if not fields:
            raise Exception("CustomImageFields class with fields list is not "
                            "defined for model.")

        original_path = None
        original_final_value = None

        for field_name in fields:
            url = self.data.get(field_name)

            if url:
                # url is the url of the temp additional image
                parsed = urlparse(url)

                if parsed.netloc and parsed.path:
                    file_name = parsed.path.split("/")[
                        len(parsed.path.split("/")) - 1:
                    ][0]

                    key_path = parsed.path.replace(
                        '/{}/'.format(bucket_name),
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
                        src_bucket_name=bucket_name, src_key_name=key_path,
                        dst_bucket_name=bucket_name, dst_key_name=new_key_path,
                        preserve_acl=True
                    )

        # Do the same for the original image
        if original_path:
            new_original_path = original_path.replace('_temp', '')
            copy_object(
                src_bucket_name=bucket_name,
                src_key_name=original_path,
                dst_bucket_name=bucket_name,
                dst_key_name=new_original_path,
                preserve_acl=True
            )

            # Set value of source field for additional special image fields
            source_field_name = new_original_path.split("/")[
                len(new_original_path.split("/")) - 2:
            ][0]

            # Uploaded S3 images values are returned as direct to the bucket
            # Here we just change that to use our cname

            # original_final_value = original_final_value.replace(
            #     'https://s3-eu-west-1.amazonaws.com/media2.fundedbyme.com/',
            #     'https://media2.fundedbyme.com/'
            # )

            # NOTE:

            # The previous couple of lines are commented, meaning we'll save
            # direct links to the keys on S3 bucket. This means that we're
            # not serving them via CloudFlare CDN.

            # Static/Media files are served via CloudFlare CDN, which uses
            # a 'standard' caching policy; caches files on first hit.
            # Technically the files shouldn't change unless purged
            # but it seems like CloudFlare's behaviour is different everytime.
            # Because of that, we'll just use the direct link to S3 so we don't
            # have to deal with purging speicifc files via CloudFlare API
            # (which is not that difficult, just an extra request).
            # An example of how to purge the file in case we decide to do that
            # later:
            # pip install \
            #        git+https://github.com/cloudflare-api/python-cloudflare.git
            # cfapi = CloudFlare(email, api_key)
            # cfapi.zone_file_purge(
            #   'https://media2.fundedbyme.com',  # <-- Zone
            #   'https://media2.fundedbyme.com/profiles/beshrkayali/profile_picture/thumbnail_square.jpg'
            #     ^^^^ Actual file to purge
            # )

            if original_final_value:
                setattr(self.instance,
                        source_field_name,
                        original_final_value.replace('_temp', ''))

        __save__ = super(ReplaceS3KeyNames, self).save(*args, **kwargs)
        return __save__


class ModelAdminFormFieldsOverrider(object):
    """
    A simple mixin to override S3ImageUploadModelField for django admin models.
    """
    formfield_overrides = {
        S3ImageUploadModelField: {
            'widget': S3ImageUploadFormWidget(
                attrs={
                    'data-enable-preview': 'false',
                    'data-spec': 'partner_license_picture'
                }
            )
        }
    }

