from __future__ import absolute_import
from django.conf.urls.static import static
from django.conf import settings

from . import views
from .compat import patterns, url


urlpatterns = patterns(
    '',
    # LoginRequiredMixin tests
    url(r'^create/$', views.SimpleModelCreateView.as_view(), name="create"),
    # url(r'^view/$', views.SimpleModelCreateView.as_view()),
    # url(r'^edit/$', views.SimpleModelCreateView.as_view()),
) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
