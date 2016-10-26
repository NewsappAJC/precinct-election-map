# Standard library imports
import datetime
import time
import csv
import re

# Third-party library imports
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Constants
CONTEST_URL = r'http://results.enr.clarityelections.com/GA/54042/149045/en/md_data.html?cid=6000&'
DELAY = 120 # Number of milliseconds to wait before running the script again
OUTPUT = '/Users/jcox/Dev/election/data_cleaning/data.csv' # File to write to
COUNTIES = ['GWINNETT', 'FULTON', 'COBB', 'CLAYTON', 'DEKALB']

# Helper functions
def clean(string):
    return string.replace(',','')


class Parser(object):
    # Create webdriver and navigate to the URL of the contest
    # Create a new webdriver on every loop because it's less expensive than
    # running multiple webdrivers at the same time
    def __init__(self, contest_url):
        self.url = contest_url

    def _build_driver(self):
        driver = webdriver.PhantomJS()
        driver.get(CONTEST_URL)
        assert 'Election' in driver.title # 
        return driver

    def parse_precinct_results(self, output_file=OUTPUT, counties=None):
        # TODO replace this with logging
        print 'Getting precinct data...'
        self.driver = _build_driver()

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

            # Skip counties not in the list supplied by the user
            if counties is not None and county_name.upper() not in counties:
                continue

            # The URL for each county is generated anew by Clarity each page visit
            # emulating a click is a sure bet to get to the detail page
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

            headers = [ths[1].text, 'County', ths[2].text, ths[3].text]

            for row in rows[1:len(rows)-1]:
                try:
                    precinct_name = row.find_elements_by_tag_name('a')[0].get_attribute('name').upper()
                    candidate_1 = row.find_elements_by_tag_name('td')[2].text
                    candidate_2 = row.find_elements_by_tag_name('td')[3].text
                    candidate_3 = row.find_elements_by_tag_name('td')[4].text

                    total = int(clean(row.find_elements_by_tag_name('td')[5].text))
                    assert int(clean(candidate_1)) + int(clean(candidate_2)) + int(clean(candidate_3)) == total  # check the math

                    # If the test passes, append the data
                    data.append([precinct_name.upper(), county_name, candidate_1, candidate_2])

                    print 'Adding precinct {}, ({})'.format(precinct_name, county_name)
                except IndexError: # Some rows repeat the headers and these throw index errors
                    print 'Skipping empty row'
                    pass

            # Navigate back to the root URL
            driver.get(contest_url)

        driver.close()
        return data

    def write_to_csv(self, path=OUTPUT)
        with open(OUTPUT, 'w') as f:
            print 'Writing to file {}'.format(path)
            data_writer = csv.writer(f, delimiter=',')
            data_writer.writerow(headers)
            for row in self.data:
                data_writer.writerow(row)

