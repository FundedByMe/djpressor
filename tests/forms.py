from __future__ import absolute_import
from django import forms
from .models import SimpleModel
from djpressor.forms import ReplaceS3KeyNames


class SimpleModelForm(ReplaceS3KeyNames, forms.ModelForm):
    class Meta:
        model = SimpleModel
        fields = [
            'image'
        ]
