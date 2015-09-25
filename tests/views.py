from __future__ import absolute_import
from django.views.generic import DetailView, UpdateView, CreateView

from .forms import SimpleModelForm
from .models import SimpleModel
from django.core.urlresolvers import reverse


class SimpleModelCreateView(CreateView):
    template_name = "form.html"
    form_class = SimpleModelForm
    model = SimpleModel

    def get_form_kwargs(self):
        kwargs = super(SimpleModelCreateView, self).get_form_kwargs()
        return kwargs

    def get_success_url(self):
        return reverse("dashboard_companies_settings")
