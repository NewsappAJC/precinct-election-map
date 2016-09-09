import json
from collections import Counter

data = json.loads(open('dist/dev/precincts.geojson', 'r').read())
features = data['features']

filtered = [] # The array that will hold all precincts from metro Atlanta counties
cnt = Counter() # Use a counter to check that the number of precincts per county is correct

counties = ['121', '089', '135', '067', '063', '077', '097', '113', '151']
for precinct in features:
    county_name = precinct['properties']['COUNTYFP10'] 
    if county_name in counties:
        filtered.append(precinct)
        cnt[county_name] += 1

print cnt

with open('atlanta-precincts.json', 'w') as f:
    f.write(json.dumps(filtered))

