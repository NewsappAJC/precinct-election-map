# Python standard lib imports
import json
import os
import csv
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP_PATH = os.path.join(BASE_DIR, 'assets', 'data', '2014_precincts_income_raceUPDATE.json')

# Configure logging
logging.basicConfig(level=logging.INFO)

def update_map():
    """
    Take map JSON data and generate a new map with updated election data.
    """
    logging.info('Adding latest vote information to map file {}'.format(MAP_PATH))

    f = open('vote_data.csv')
    votes = csv.DictReader(f)
    map_data = open('2014_income_race.json', 'r').read()

    map_ = json.loads(map_data)
    for i, feature in enumerate(map_['features']):
        name = feature['properties']['PRECINCT_N']
        try:
            f.seek(0)
            match = [x for x in votes if x['PRECINCT_N'] == name][0]
            # CSV DictReader automatically parses all columns as strings, 
            # so we need to manually convert these back to ints
            for x in ['rep_votes', 'dem_votes', 'rep_p', 'dem_p', 'avg_income']:
                match[x] = float(match[x])
            map_['features'][i]['properties'] = match
        except IndexError:
            continue

    with open(MAP_PATH, 'w') as f:
        f.write(json.dumps(map_))

if __name__ == '__main__':
    update_map()
