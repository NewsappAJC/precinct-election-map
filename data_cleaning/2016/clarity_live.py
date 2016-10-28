# Standard library imports
import datetime
import time
import csv
import re
import pdb
import json

# Third-party library imports
import requests
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


COUNTIES = ['FULTON', 'COBB', 'CLAYTON', 'GWINNETT', 'DEKALB']

class Parser(object):
    """
    Base class that provides scraping functionality for Clarity Elections site.
    Use Selenium's PhantomJS headless browser to simulate clicks on the 
    and get precinct-level vote data for a given race.
    """
    # Create webdriver and navigate to the URL of the contest
    # Create a new webdriver on every loop because it's less expensive than
    # running multiple webdrivers at the same time
    def __init__(self, contest_url):
        self.url = contest_url

        self.county_urls = [] # Will hold the dynamically generated URLs
        self.precinct_results = []

    def _build_driver(self):
        """
        Create an instance of Selenium's webdriver.PhantomJS(), used to 
        simulate clicks on the Clarity elections site
        """
        driver = webdriver.PhantomJS()
        driver.get(self.url)
        assert 'Election' in driver.title # Make sure we have the right page
        return driver

    def get_county_urls(self, counties=None):
        """
        Use Selenium to get the dynamically generated URLs for each county's 
        detail page, and append the URLs to self.urls.
        """
        # TODO replace this with logging
        print 'Getting precinct data...'
        driver = self._build_driver()

        # Get number of counties on summary page so that we know how many to loop through
        num_counties = len(driver.find_elements_by_css_selector('table.vts-data > tbody > tr')) - 1

        data = []

        # Skip the titles in the first row
        for i in range(1, num_counties):
            # Get number of counties
            county = driver.find_elements_by_css_selector('table.vts-data > tbody > tr')[i]
            links = county.find_elements_by_tag_name('a')

            # Handle issue
            try: 
                county_name = links[0].get_attribute('id')
            except IndexError:
                continue

            # Skip counties not in the list supplied by the user. If not list 
            # is provided then loop through all the counties
            if counties is not None and county_name.upper() not in counties:
                continue

            # The URL for each county is generated anew by Clarity on each page visit
            # Emulating a click is a sure bet to get to the detail page
            links[1].click()

            # Wait until the new page loads
            delay = 3
            try:
                check = EC.presence_of_element_located((By.ID, 'precinctDetailLabel'))
                WebDriverWait(driver, delay).until(check)
            except TimeoutException:
                print 'page took too long to load'

            # Remove cruft at the end of URL and append it to our list of URLs
            split_url = driver.current_url.split('/')
            curl = ('/').join(split_url[:-2])
            self.county_urls.append(curl)

            driver.get(self.url)

        driver.close()
        return

    def parse_precinct_results(self):
        """
        Get JSON data from the endpoints listed in :county_urls: and parse
        the election results from each
        """
        for base_url in self.county_urls:
            candidate_data = requests.get(base_url + '/json/sum.json')
            vote_data = requests.get(base_url + '/json/details.json')

            # Get a list of candidates and append it to the list of headers
            contest = json.loads(candidate_data.content)['Contests'][0]
            candidates = contest['CH']

            #Get votes for each candidate
            contest = json.loads(vote_data.content)['Contests'][0]

            for precinct, votes in zip(contest['P'], contest['V']):
                data = {'precinct': precinct}
                for candidate, count in zip(candidates, votes):
                    data[candidate] = int(count)

                self.precinct_results.append(data)


