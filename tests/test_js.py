from __future__ import absolute_import
import os
import sys
import new
from django.test import LiveServerTestCase
from django.core.urlresolvers import reverse

from sauceclient import SauceClient
from selenium import webdriver


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


def on_platforms(platforms):
    def decorator(base_class):
        module = sys.modules[base_class.__module__].__dict__
        for i, platform in enumerate(platforms):
            d = dict(base_class.__dict__)
            d['desired_capabilities'] = platform
            name = "%s_%s" % (base_class.__name__, i + 1)
            module[name] = new.classobj(name, (base_class,), d)
    return decorator


@on_platforms(browsers)
class TestDJPressorJS(LiveServerTestCase):
    """
    Selenium tests for djpressor custom JS integration module between
    Impressor and Django forms. These run on SauceLabs.
    """
    def setUp(self):
        self.desired_capabilities['name'] = self.id()
        self.desired_capabilities['tunnel-identifier'] = os.environ['TRAVIS_JOB_NUMBER']

        sauce_url = "http://%s:%s@ondemand.saucelabs.com:80/wd/hub"
        self.driver = webdriver.Remote(
            desired_capabilities=self.desired_capabilities,
            command_executor=sauce_url % (SAUCE_USERNAME, SAUCE_ACCESS_KEY)
        )
        self.driver.implicitly_wait(30)

    def test_s3_url_filed_replaced_with_fileinput(self):
        self.driver.get(self.live_server_url + reverse('create'))
        assert "test djpressor" in self.driver.title

    def tearDown(self):
        try:
            if sys.exc_info() == (None, None, None):
                the_sauce.jobs.update_job(self.driver.session_id, passed=True)
            else:
                the_sauce.jobs.update_job(self.driver.session_id, passed=False)
        finally:
            self.driver.quit()
