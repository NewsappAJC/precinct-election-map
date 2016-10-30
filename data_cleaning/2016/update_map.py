# Python standard lib imports
import json
import os
import csv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def update_map():
    """
    Take map JSON data and generate a new map with updated election data.
    """
    f = open('vote_data.csv')
    votes = csv.DictReader(f)
    map_data = open('2014_precincts_income_race.json', 'r').read()

    map_ = json.loads(map_data)
    for i, feature in enumerate(map_['features']):
        name = feature['properties']['PRECINCT_N']
        try:
            f.seek(0)
            match = [x for x in votes if x['PRECINCT_N'] == name][0]
            map_['features'][i]['properties'] = match
        except IndexError:
            continue

    #with open(os.path.join(BASE_DIR, 'assets', 'data', '2014_precincts_income_raceUPDATE.json'), 'w') as f:
    with open('map.json', 'w') as f:
        f.write(json.dumps(map_))

