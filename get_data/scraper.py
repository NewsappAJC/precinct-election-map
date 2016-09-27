# Standard library imports
import datetime
import time
import csv

# Third-party library imports
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Parameters
CONTEST_URL = r'http://results.enr.clarityelections.com/GA/42277/113204/en/md_data.html?cid=5000&'
DELAY = 120 # Number of milliseconds to wait before running the script again
OUTPUT = 'data.csv' # File to write to

# Helper functions
def clean(string):
    return string.replace(',','')

###########
# Scraper #
###########

# Create webdriver and navigate to the URL of the contest
driver = webdriver.PhantomJS()
driver.get(CONTEST_URL)
assert 'Election' in driver.title # Make sure we have the right page

# Get number of counties
num_counties = len(driver.find_elements_by_css_selector('table.vts-data > tbody > tr')) - 1

# Loop through counties, open detail view in a new window, and write a csv for each
def get_precincts():
    data = [] # This array will hold all the data for our precinct results

    for i in range(1, num_counties):
        county = driver.find_elements_by_css_selector('table.vts-data > tbody > tr')[i]
        links = county.find_elements_by_tag_name('a')

        try: 
            county_name = links[0].get_attribute('id')
        except IndexError:
            continue

        atl_counties = ['FULTON', 'DEKALB', 'COBB', 'CLAYTON', 'GWINNETT']

        if county_name not in atl_counties:
            continue

        links[1].click() # Consult README for information about why we need to navigate like this.

        # Wait until the new page loads
        delay = 3

        try: 
            check = EC.presence_of_element_located((By.ID, 'precinctDetailLabel'))
            WebDriverWait(driver, delay).until(check)
        except TimeoutException:
            print 'page took too long to load'

        rows = driver.find_elements_by_css_selector('table.vts-data > tbody > tr')
        ths = rows[0].find_elements_by_tag_name('th')

        headers = [ths[1].text, 'County', ths[2].text, ths[3].text]

        for row in rows[1:len(rows)-1]:
            try:
                precinct_name = row.find_elements_by_tag_name('a')[0].get_attribute('name')
                candidate_1 = row.find_elements_by_tag_name('td')[2].text
                candidate_2 = row.find_elements_by_tag_name('td')[3].text

                total = int(clean(row.find_elements_by_tag_name('td')[4].text))
                assert int(clean(candidate_1)) + int(clean(candidate_2)) == total # check the math

                # If the test passes, append the data
                data.append([precinct_name, county_name, candidate_1, candidate_2])

                print 'Adding precinct {}'.format(precinct_name)
            except IndexError:
                print 'Skipping empty row'
                pass

        driver.get(CONTEST_URL) #Return to the main page

    with open(OUTPUT, 'w') as f:
        print 'Writing to file {}'.format(OUTPUT)
        data_writer = csv.writer(f, delimiter=',')
        data_writer.writerow(headers)
        for row in data:
            data_writer.writerow(row)

while True:
    print 'Getting precinct data...'
    get_precincts()

    now = datetime.datetime.now()
    time_to_run = now + datetime.timedelta(0,DELAY)
    print '\n\nScript will run again at {}'.format(time_to_run.strftime('%-H:%-M'))
    print 'Cancel by pressing CTRL-C'
    time.sleep(DELAY)
