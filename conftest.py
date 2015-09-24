import os
from django.conf import settings
from tests import settings as test_settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tests.settings')
settings.configure(default_settings=test_settings)
