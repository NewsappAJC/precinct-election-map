import pdb
from sys import argv
import json

import pandas as pd
import requests

script, base_url, county_name = argv

precinct_results = []

# Candidate names and votes are stored in separate files. God knows
# why.
candidate_data = requests.get(base_url + '/json/sum.json')
vote_data = requests.get(base_url + '/json/details.json')

# Get the list of candidates
contests = json.loads(candidate_data.content)['Contests']

# Find out which of the contests contains the candidates we're interested in.
# Clarity sometimes includes multiple contests in the same JSON file
pdb.set_trace()
order = [i for i, val in enumerate(contests) if 'DONALD J. TRUMP (REP)' in val['CH']][0]
candidates = contests[order]['CH']

#Get votes for each candidate
contests = json.loads(vote_data.content)['Contests']
contest = contests[order]

for precinct, votes in zip(contest['P'], contest['V']):
    data = {'precinct': precinct, 'county': county_name}
    total = 0
    for candidate, count in zip(candidates, votes):
        if candidate == 'DONALD J. TRUMP (REP)':
            total += int(count)
            data['rep_votes'] = int(count)
        elif candidate == 'HILLARY CLINTON (DEM)':
            data['dem_votes'] = int(count)
            total += int(count)
    data['total'] = total

    precinct_results.append(data)

votes = pd.DataFrame(precinct_results)
votes.to_csv('{}.csv'.format(county_name), index=False)
