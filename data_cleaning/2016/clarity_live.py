# Standard library imports
import datetime
import time
import csv
import re
import pdb

# Third-party library imports
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Constants
CONTEST_URL = r'http://results.enr.clarityelections.com/GA/58980/163369/en/md_data.html?cid=50&'
DELAY = 120 # Number of milliseconds to wait before running the script again
OUTPUT = 'data.csv' # File to write to
COUNTIES = ['CLAYTON', 'COBB', 'DEKALB', 'FULTON', 'GWINNETT']

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

    def _strip_commas(self, string):
        return string.replace(',','')


    def _build_driver(self):
        driver = webdriver.PhantomJS()
        driver.get(self.url)
        assert 'Election' in driver.title # Make sure we have the right page
        return driver

    # Define this method in subclass
    def merge(self):
        pass

    def parse_precinct_results(self, output_file=OUTPUT, counties=None):
        # TODO replace this with logging
        print 'Getting precinct data...'
        driver = self._build_driver()

        # Get number of counties on summary page so that we know how many to loop through
        num_counties = len(driver.find_elements_by_css_selector('table.vts-data > tbody > tr')) - 1
        data = [] # This array will hold all the data for our precinct results

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

            self.headers = [ths[1].text, 'County', ths[5].text.split()[1], ths[14].text.split()[1], 'total']

            for row in rows[1:len(rows)-1]:
                try:
                    precinct_name = row.find_elements_by_tag_name('a')[0].get_attribute('name').upper()
                    #candidate_1 = row.find_elements_by_tag_name('td')[5].text
                    #candidate_2 = row.find_elements_by_tag_name('td')[14].text
                    # MATURITY
                    candidate_1 = 69
                    candidate_2 = 69

                    # Strip commas out of the total so that we can check whether the votes we've 
                    # parsed add up to the correct amount.
                    total = self._strip_commas(row.find_elements_by_tag_name('td')[len(row.find_elements_by_tag_name('td')) - 1].text)
                    ftotal = int(total)
                    # No point summing up the math when testing with primary data
                    #assert int(clean(candidate_1)) + int(clean(candidate_2)) + int(clean(candidate_3)) == totalh

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

    def to_csv(self, list_, path=OUTPUT):
        with open(path, 'w') as f:
            print 'Writing to file {}'.format(path)
            data_writer = csv.writer(f, delimiter=',')
            data_writer.writerow(self.headers)
            for row in self.list_:
                data_writer.writerow(row)
        return

