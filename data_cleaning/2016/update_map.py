# Python standard lib imports
import json
import csv

# Third-party imports
import pandas as pd

def update_map():
    """
    Take map JSON data and generate a new map with updated election data.
    """
    results_snapshot = pd.read_csv('election_snapshot.csv')
    map_data = open('2014_precincts_income_race.json', 'r').read()

    map_ = json.loads(map_data)
    for feature in map_[1]:
        df1 = pd.DataFrame(feature['properties'])
        df2 = results_snapshot

        merged = df1.merge(df2)
        feature = merged.to_dict()


    with open('2014_precincts_income_raceUPDATE.json', 'w') as f:
        f.write(json.dumps(map_)

