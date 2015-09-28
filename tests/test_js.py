from __future__ import absolute_import
import os
import sys
import new
from django.test import LiveServerTestCase
from django.core.urlresolvers import reverse

from selenium import webdriver
RUN_LOCAL = os.environ.get('RUN_TESTS_LOCAL') == 'True'

if RUN_LOCAL:
    # could add Chrome, PhantomJS etc... here
    browsers = ['PhantomJS']
else:
    from sauceclient import SauceClient
    SAUCE_USERNAME = os.environ.get('SAUCE_USERNAME')
    SAUCE_ACCESS_KEY = os.environ.get('SAUCE_ACCESS_KEY')
    the_sauce = SauceClient(SAUCE_USERNAME, SAUCE_ACCESS_KEY)

    # Run on: OSX-Safari / WIN-IE / WIN-CHROME
    browsers = [{"platform": "OS X 10.9",
                 "browserName": "chrome",
                 "version": "31"},
                {"platform": "Windows 8.1",
                 "browserName": "internet explorer",
                 "version": "11"},
                {"platform": "OS X 10.10",
                 "browserName": "safari",
                 "version": "8.0"}]


def on_platforms(platforms, local):
    if local:
        def decorator(base_class):
            module = sys.modules[base_class.__module__].__dict__
            for i, platform in enumerate(platforms):
                d = dict(base_class.__dict__)
                d['browser'] = platform
                name = "%s_%s" % (base_class.__name__, i + 1)
                module[name] = type(name, (base_class,), d)
            pass
        return decorator

    def decorator(base_class):
        module = sys.modules[base_class.__module__].__dict__
        for i, platform in enumerate(platforms):
            d = dict(base_class.__dict__)
            d['desired_capabilities'] = platform
            name = "%s_%s" % (base_class.__name__, i + 1)
            module[name] = new.classobj(name, (base_class,), d)
    return decorator


@on_platforms(browsers, RUN_LOCAL)
class TestDJPressorJS(LiveServerTestCase):
    """
    Selenium tests for djpressor custom JS integration module between
    Impressor and Django forms. These run on SauceLabs.
    """

    # Setup stuff for local running and travis/sauce running
    def setUp(self):
        if RUN_LOCAL:
            self.set_up_local()
        else:
            self.set_up_sauce()

    def tearDown(self):
        if RUN_LOCAL:
            self.tear_down_local()
        else:
            self.tear_down_sauce()

    def set_up_sauce(self):
        self.desired_capabilities['name'] = self.id()
        self.desired_capabilities['tunnel-identifier'] = os.environ.get('TRAVIS_JOB_NUMBER', None)
        self.desired_capabilities['build'] = os.environ['TRAVIS_BUILD_NUMBER']
        self.desired_capabilities['tags'] = \
            [os.environ['TRAVIS_PYTHON_VERSION'], 'CI']

        sauce_url = "http://%s:%s@ondemand.saucelabs.com:80/wd/hub"
        self.driver = webdriver.Remote(
            desired_capabilities=self.desired_capabilities,
            command_executor=sauce_url % (SAUCE_USERNAME, SAUCE_ACCESS_KEY)
        )
        self.driver.implicitly_wait(30)

    def set_up_local(self):
        self.driver = getattr(webdriver, self.browser)()
        self.driver.implicitly_wait(3)

    def tear_down_sauce(self):
        try:
            if sys.exc_info() == (None, None, None):
                the_sauce.jobs.update_job(self.driver.session_id, passed=True)
            else:
                the_sauce.jobs.update_job(self.driver.session_id, passed=False)
        finally:
            self.driver.quit()

    def tear_down_local(self):
        self.driver.quit()

    # Actual Tests Now

    # def test_project_loaded(self):
    #     self.driver.get(self.live_server_url + reverse('create'))
    #     assert "test djpressor" in self.driver.title

    def test_s3_url_field_replaced_with_fileinput(self):
        field_name = 'image'

        self.driver.get(self.live_server_url + reverse('create'))

        # Charfield should get transformed into a file input element
        file_input = self.driver.find_element_by_css_selector('#id_{}'.format(field_name))
        assert file_input.get_attribute('type') == 'file'

        # Charfield input should be invisible
        original_input = self.driver.find_element_by_css_selector('#original-id_{}'.format(field_name))
        assert 'display: none' in original_input.get_attribute('style')

    def test_s3_url_field_correct_widget_attrs(self):
        field_name = 'image'
        spec_name = 'some_spec'

        self.driver.get(self.live_server_url + reverse('create'))

        file_input = self.driver.find_element_by_css_selector('#id_{}'.format(field_name))
        assert file_input.get_attribute('type') == 'file'

        assert file_input.get_attribute('data-spec') == spec_name
        assert file_input.get_attribute('data-enable-preview') == 'true'
