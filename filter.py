import random
import json
from collections import Counter

data = json.loads(open('assets/data/2014_precincts_income_race.json', 'r').read())

for i, precinct in enumerate(data['features']):
    # Random data for testing DO NOT USE IN PRODUCTION.
    if i % 2 == 0:
        precinct['properties']['party'] = 'Republican'
    else: 
        precinct['properties']['party'] = 'Democrat'

with open('assets/data/2014_precincts_income_race.json', 'w') as f:
    f.write(json.dumps(data))
