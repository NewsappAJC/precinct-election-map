import random
import json
from collections import Counter

data = json.loads(open('assets/data/all_precincts.json', 'r').read())
features = data['features']

filtered = [] # The array that will hold all precincts from metro Atlanta counties
cnt = Counter() # Use a counter to check that the number of precincts per county is correct

counties = ['121', '089', '135', '067', '063', '077', '097', '113', '151']
for i, precinct in enumerate(features):
    county_name = precinct['properties']['COUNTYFP10'] 
    if county_name in counties:
        # Random data for testing DO NOT USE IN PRODUCTION.
        if i % 2 == 0:
            precinct['properties']['party'] = 'Republican'
        else: 
            precinct['properties']['party'] = 'Democrat'
        precinct['properties']['median_income'] = random.random() * 100000
        precinct['properties']['race'] = ['white','black','hispanic'][random.randint(0,2)]

        filtered.append(precinct)
        cnt[county_name] += 1

print cnt

with open('assets/data/atlanta-precincts.json', 'w') as f:
    f.write(json.dumps(filtered))
