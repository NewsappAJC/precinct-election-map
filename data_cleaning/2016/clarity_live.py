# Standard lib imports
from sys import argv
import os
from time import sleep
import re
import pdb
import logging
import datetime
import csv
import json
from collections import defaultdict

# Third-party imports
import pandas as pd
import requests
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Constants
DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(DIR)) # Root directory of the project

# Alter for any given race on a clarityelection.com site
CONTEST_URL = 'http://results.enr.clarityelections.com/GA/63991/182895/en/md_data.html?cid=5000&'
COUNTIES = ['CLAYTON', 'FULTON', 'GWINNETT', 'DEKALB', 'COBB']
LAST_COUNTY = 'Worth' # Used to check that all counties on the main page have loaded from AJAX request
CANDIDATES = {'dem': 'HILLARY CLINTON', 'rep': 'DONALD J. TRUMP'}
TOTAL_PRECINCTS = 914 # The number of precincts in the reapportionment office's map
PHANTOM_JS_INSTALLATION = '/Users/jcox/Desktop/phantomjs/bin/phantomjs'

# Input and output file locations. Change as needed
STATS_FILE = os.path.join(DIR, 'ajc_precincts_merged_centers.csv')
MAP_INPUT = os.path.join(DIR, '2014_income_race_centers.json')
VOTES_TMP = '/tmp/vote_data.csv'
UNMERGED_TMP = '/tmp/unmerged.csv'

MAP_OUTPUT = os.path.join(BASE_DIR, 'assets', 'data', '2014_precincts_income_raceUPDATE.json')
METADATA_OUTPUT = os.path.join(BASE_DIR, 'assets', 'data', '2014_metadata.json')
AGG_STATS_OUTPUT = os.path.join(BASE_DIR, 'assets', 'data', '2014agg_stats.json')
# End constants

# Configure logging
logging.basicConfig(level=logging.INFO)

class Parser(object):
    """
    Base class that provides scraping functionality for Clarity Elections site.
    Use Selenium's PhantomJS headless browser to simulate clicks and get URL of detail
    pages for given counties, then gets precinct-level vote data for a given race.
    """

    def __init__(self, contest_url):
        self.main_url = contest_url

        # These instance variables will be set by the user
        self.county_urls = []
        self.precinct_results = []
        self.unmerged_precincts = None
        self.merged_precincts = None
        self.total_precincts = 0

    def _build_driver(self):
        """
        Create an instance of Selenium's webdriver.PhantomJS(), used to 
        simulate clicks on the Clarity elections site
        """
        driver = webdriver.Firefox()
        driver.get(self.main_url)
        return driver

    def get_county_urls(self, input_counties=COUNTIES, delay=5):
        """
        Use Selenium to get the dynamically generated URLs for each county's 
        detail page by simulating clicks, and append the URLs to self.county_urls.
        """
        self.county_urls = [] # Reset county URLs each time the scraper runs
        logging.info('Creating Selenium driver and accessing Clarity')
        driver = self._build_driver()

        try:
            string_counties = (', ').join(input_counties)
        except TypeError: 
            string_counties = 'All counties'

        print 'Getting detail page URLs for {}'.format(string_counties)

        # Wait until counties have loaded through AJAX to run script
        # Yes it's hacky but using WebDriverWait wasn't working
        sleep(2)

        # Get a list of all counties on the contest summary page
        selector = 'table.vts-data > tbody > tr'
        all_counties = driver.find_elements_by_css_selector(selector) 

        # Generate a list of county names
        counties = []
        for i, county in enumerate(all_counties):
            try:
                links = county.find_elements_by_tag_name('a')
                name = links[0].get_attribute('id')
                counties.append(name)
            # Some of the rows in the table are just headers
            except:
                counties.append(None)

        # Have to loop through names instead of looping through DOM elements because
        # Selenium will throw a StaleElementReferenceException
        for i, name in enumerate(counties):
            # Because the page loads through AJAX wait until the information for 
            # the county is loaded
            if name: 
                if input_counties is not None and name.upper() not in input_counties:
                    continue
                try:
                    check = EC.presence_of_element_located((By.ID, name))
                    WebDriverWait(driver, delay).until(check)
                except TimeoutException:
                    print 'Home page took too long to load'
                    print 'Stopping scraper. Your data has not been added'
                    return
            else:
                continue

            sleep(.5) # Because, inexplicably, it takes a second after the to load the data after the precinct name loads

            # Get links from the county row
            county = driver.find_elements_by_css_selector(selector)[i]
            links = county.find_elements_by_tag_name('a')

            county_name = name
            rep_votes = county.find_elements_by_css_selector('td')[2].text
            dem_votes = county.find_elements_by_css_selector('td')[3].text

            # The URL for each county is generated by Clarity on each page visit
            # Emulating a click is a sure bet to get to the detail page
            links[1].click()

            # Wait until the new page loads
            try:
                check = EC.presence_of_element_located((By.ID, 'precinctDetailLabel'))
                WebDriverWait(driver, delay).until(check)
            except TimeoutException:
                print 'Page took too long to load. Trying to add precincts anyway'

            # Remove cruft at the end of URL and append it to our list of URLs
            split_url = driver.current_url.split('/')
            base_url = ('/').join(split_url[:-2])
            self.county_urls.append([county_name.upper(), base_url, rep_votes, dem_votes])

            print '{} county precincts added'.format(county_name)
            driver.get(self.main_url)

        # After looping through all the counties, close Firefox
        driver.quit()

        x = pd.DataFrame(self.county_urls)
        # Save the county urls to the tmp directory so they can be reused on future passes
        x.to_csv('/tmp/county_urls.csv', encoding='utf-8', index=False)

        return

    def get_precincts(self):
        """
        Get JSON data from the endpoints listed in :county_urls: and parse
        the precinct-level election results from each one
        """
        self.precinct_results = [] # Reset the precinct results

        for county_name, base_url, rep_votes, dem_votes in self.county_urls:
            logging.info('Getting precinct details from {}'.format(base_url))

            # Candidate names and votes are stored in separate files. God knows
            # why.
            candidate_data = requests.get(base_url + '/json/sum.json')
            vote_data = requests.get(base_url + '/json/details.json')

            # Get the list of candidates
            contests = json.loads(candidate_data.content)['Contests']

            # Find out which of the contests contains the candidates we're interested in.
            # Clarity sometimes includes multiple contests in the same JSON file
            try:
                order = [i for i, val in enumerate(contests) if CANDIDATES['rep'] in val['CH']][0]
                candidates = contests[order]['CH']
            except:
                continue
                logging.error("""The contestant names you supplied don\'t match
                    any in the data files. Are you sure you spelled the names
                    correctly?""")

            #Get votes for each candidate
            contests = json.loads(vote_data.content)['Contests']
            contest = contests[order]

            for precinct, votes in zip(contest['P'], contest['V']):
                data = {'precinct': precinct, 'county': county_name}
                total = 0
                for candidate, count in zip(candidates, votes):
                    if candidate == CANDIDATES['rep']:
                        total += int(count)
                        data['rep_votes'] = int(count)
                    elif candidate == CANDIDATES['dem']:
                        data['dem_votes'] = int(count)
                        total += int(count)
                data['total'] = total

                self.precinct_results.append(data)

        votes = pd.DataFrame(self.precinct_results)
        votes.to_csv(VOTES_TMP, index=False, encoding='utf-8')
        return

class ResultSnapshot(Parser):
    """
    Class that contains utilities for cleaning Georgia election results and
    merging with statistical data gathered from the US Census.
    """

    def __init__(self, **kwargs):
        super(ResultSnapshot, self).__init__(**kwargs)

    def _clean(self, row):
        """
        Private method for renaming the few precincts scraped from the site that
        have names that don't match names in the precinct shapefiles.
        """
        r = re.compile(r'\d{3} ')
        precinct1 = re.sub(r, '', row['precinct'])
        precinct2 = re.sub(re.compile(r'EP04-05|EP04-13'), 'EP04', precinct1)
        precinct3 = re.sub(re.compile(r'10H1|10H2'), '10H', precinct2)
        precinct4 = re.sub(re.compile(r'CATES D - 04|CATES D - 07'), 'CATES D', precinct3)
        precinct5 = re.sub(re.compile(r'AVONDALE HIGH - 05|AVONDALE HIGH - 04'), 'AVONDALE HIGH', precinct4)
        precinct6 = re.sub(re.compile(r'CHAMBLEE 2'), 'CHAMBLEE', precinct5)
        precinct7 = re.sub(re.compile(r'WADSWORTH ELEM - 04'), 'WADSWORTH ELEM', precinct6)
        precinct8 = re.sub(re.compile(r'CP06A'), 'CP06', precinct7)
        return precinct8.strip().upper()[:20] # Restrict to 20 chars

    def _get_income(self, row):
        if row['avg_income'] < 50000:
            return 'low'
        elif row['avg_income'] < 100000:
            return 'mid'
        else:
            return 'high'

    def _get_rep_proportion(self, row):
        try:
            return float(row['rep_votes'])/row['total']
        except ZeroDivisionError:
            return 0

    def _get_dem_proportion(self, row):
        try:
            return float(row['dem_votes'])/row['total']
        except ZeroDivisionError:
            return 0


    def _clean_vote_stats(self, precincts):
        """
        Private method used to calculate proportions of voters for each 
        candidate by precinct, clean the precinct name, put the income in bins,
        and perform other operations necessary before it's ready to be 
        consumed by the JS app
        """
        cframe = precincts

        # Calculate proportion of total votes that each candidate got
        cframe['rep_p'] = cframe.apply(self._get_rep_proportion, axis=1)
        cframe['dem_p'] = cframe.apply(self._get_dem_proportion, axis=1)
        cframe['precinct'] = cframe.apply(self._clean, axis=1)

        return cframe

    def _get_income(self, row):
        if row['avg_income'] < 50000:
            return 'low'
        elif row['avg_income'] < 100000:
            return 'mid'
        else:
            return 'high'

    def merge_votes(self, statsf=STATS_FILE, outf=VOTES_TMP):
        """
        Public method used to merge the election result dataset with the precinct 
        maps from the Reapportionment office.
        """
        votes_raw = self.precinct_results
        votes = pd.DataFrame(votes_raw)
        stats = pd.read_csv(statsf, index_col=False)

        fvotes = self._clean_vote_stats(votes)

        merged = stats.merge(fvotes,
            left_on='ajc_precinct',
            right_on='precinct',
            how='left',
            indicator=True)

        # Write unmerged precincts to a CSV. Check this to see why you're
        # missing them
        self.unmerged_precincts = merged[merged._merge != 'both']
        self.unmerged_precincts.to_csv(UNMERGED_TMP, index=False)

        # Drop precincts with null values for the election results
        self.merged_precincts = merged[merged._merge == 'both']

        logging.info('Writing precinct information to csv {}'.format(outf))
        self.merged_precincts.to_csv(outf)
        return

    def aggregate_stats(self, statsfile=STATS_FILE):
        """
        Calculate an aggregate stats file that's used to populate summary
        statistics in the map
        """
        just_votes = self.merged_precincts
        stats = pd.read_csv(statsfile)

        merged = just_votes.merge(stats, how='inner')
        merged['income_bin'] = merged.apply(self._get_income, axis=1)

        # Calculate aggregated stats for summary table
        race = merged.groupby(['county', 'race'])['rep_votes', 'dem_votes'].sum().unstack()
        income = merged.groupby(['county','income_bin'])['rep_votes', 'dem_votes'].sum().unstack()

        reps = race.rep_votes.merge(income.rep_votes, left_index=True, right_index=True)
        reps['party'] = 'rep_votes'
        repsf = reps.reset_index()

        dems = race.dem_votes.merge(income.dem_votes, left_index=True, right_index=True)
        dems['party'] = 'dem_votes'
        demsf = dems.reset_index()

        combined = pd.concat([repsf, demsf])

        # Create a nested defaultdict
        data = defaultdict(lambda: defaultdict(dict))

        fields = ['black',
                  'white',
                  'hispanic',
                  'high',
                  'mid',
                  'low']

        # Create a nested JSON object
        for i, row in combined.iterrows():
            county = row['county']
            party = row['party']

            county_res = [x[2:] for x in self.county_urls if x[0] == county.upper()][0]
            data[county]['all'][party] = 0

            for field in fields:
                # Check if val is null for precincts missing a certain group
                # (eg some precincts have no Hispanics)
                if pd.isnull(row[field]):
                    continue
                data[county][field][party] = row[field]

                if field in ['high', 'mid', 'low']:
                    data[county]['all']['rep_votes'] = float(county_res[0])
                    data[county]['all']['dem_votes'] = float(county_res[1])
                # It's impossible to use default dict for the below, because the factory can't
                # generate both dicts and ints by default
                try: 
                    data['ALL COUNTIES'][field][party] += row[field]
                except KeyError:
                    data['ALL COUNTIES'][field][party] = 0

        # Lastly, calculate summary stats for counties
        data['ALL COUNTIES']['all']['rep_votes'] = sum([float(x[2]) for x in self.county_urls])
        data['ALL COUNTIES']['all']['dem_votes'] = sum([float(x[3]) for x in self.county_urls])

        logging.info('Writing aggregated stats to {}'.format(AGG_STATS_OUTPUT))

        with open(AGG_STATS_OUTPUT, 'w') as f:
            f.write(json.dumps(data, indent=4))

        return

    def update_map(self, vote_file=VOTES_TMP, geoJSON=MAP_INPUT):
        """
        Take map JSON data and generate a new map with updated election data.
        """
        logging.info('Adding latest vote information to map file {}'.format(MAP_OUTPUT))

        f = open(vote_file)
        votes = csv.DictReader(f)
        map_data = open(geoJSON, 'r').read()
        map_ = json.loads(map_data)

        metadata = {}
        reporting = 0
        for i, feature in enumerate(map_['features']):
            name = feature['properties']['PRECINCT_N']
            try:
                f.seek(0)
                match = [x for x in votes if x['PRECINCT_N'] == name][0]
                # CSV DictReader automatically parses all columns as strings, 
                # so we need to manually convert these back to floats
                floats = [
                    'rep_votes',
                    'dem_votes',
                    'rep_p',
                    'dem_p',
                    'total',
                    'avg_income'
                ]

                for x in floats:
                    match[x] = float(match[x])
                map_['features'][i]['properties'] = match

                if int(match['dem_votes']) != 0 or int(match['rep_votes']) != 0:
                    reporting += 1

            # Catch cases where the map has precincts that aren't in the voter
            # files
            except IndexError:
                continue

        # Add relevant metadata
        f = '%-I:%M %p, %A %b %-d' # eg: 12:30 AM, Wednesday Nov. 8
        metadata['last_update'] = datetime.datetime.now().strftime(f)
        metadata['precincts_reporting'] = reporting
        metadata['total_precincts'] = TOTAL_PRECINCTS

        with open(MAP_OUTPUT, 'w') as a, open(METADATA_OUTPUT, 'w') as b:
            a.write(json.dumps(map_))
            b.write(json.dumps(metadata))


if __name__ == '__main__':
    p = ResultSnapshot(contest_url=CONTEST_URL)
    p.get_county_urls()
    p.get_precincts()
    p.merge_votes()
    p.aggregate_stats()
    p.update_map()

