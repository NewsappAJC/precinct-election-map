import random
import json
from collections import Counter

data = json.loads(open('assets/data/2014_precincts_income_race.json', 'r').read())

for i, precinct in enumerate(data['features']):
    # Random data for testing DO NOT USE IN PRODUCTION.
    total = (random.random() * 500) + 1000
    rep_votes = (random.random() * (total * .5)) + total * .3
    dem_votes = total - rep_votes

    precinct['properties']['rep_v'] = int(rep_votes)
    precinct['properties']['dem_v'] = int(dem_votes)

with open('assets/data/2014_precincts_income_race.json', 'w') as f:
    f.write(json.dumps(data))
