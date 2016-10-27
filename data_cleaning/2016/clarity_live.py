# Standard library imports
import datetime
import time
import csv
import re
import pdb

# Third-party library imports
import requests
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException


class Parser(object):
    """
    Use Selenium's PhantomJS headless browser to simulate clicks on the 
    Clarity elections site and get precinct-level vote data for a given race.
    """
    # Create webdriver and navigate to the URL of the contest
    # Create a new webdriver on every loop because it's less expensive than
    # running multiple webdrivers at the same time
    def __init__(self, contest_url):
        self.url = contest_url
        self.precinct_results = None

    def _build_driver(self):
        driver = webdriver.PhantomJS()
        driver.get(self.url)
        assert 'Election' in driver.title # Make sure we have the right page
        return driver

    def _clean(string):
        return string.replace(',', '')

    # Define this method in subclass
    def merge(self):
        pass

    def parse_precinct_results(self, counties=None):
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

            # Get all the precincts in the county
            rows = driver.find_elements_by_css_selector('table.vts-data > tbody > tr')
            ths = rows[0].find_elements_by_tag_name('th')

            # Clarity always displays candidates in alphabetical order by last name
            self.headers = [ths[1].text, 'County', 'dem_votes', 'rep_votes', 'total']

            for row in rows[1:len(rows)-1]:
                try:
                    precinct_name = row.find_elements_by_tag_name('a')[0].get_attribute('name').upper()
                    #candidate_1 = row.find_elements_by_tag_name('td')[5].text
                    #candidate_2 = row.find_elements_by_tag_name('td')[14].text
                    candidate_1 = 69
                    candidate_2 = 69

                    total = self._strip_commas(row.find_elements_by_tag_name('td')[len(row.find_elements_by_tag_name('td')) - 1].text)
                    ftotal = int(total)

                    # If the test passes, append the data
                    data.append([precinct_name.upper(), county_name, int(candidate_1), int(candidate_2), int(138)])

                    print 'Adding precinct {}, ({})'.format(precinct_name, county_name)
                except IndexError: # Some rows repeat the headers and these throw index errors
                    print 'Skipping empty row'
                    pass

            # Navigate back to the root URL
            driver.get(self.url)

        driver.close()
        self.precinct_results = {'headers': headers, 'data': data}

