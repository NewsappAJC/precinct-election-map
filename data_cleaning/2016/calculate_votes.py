# Standard lib imports
import os
import difflib # Useful for fuzzy matching
import re
from glob import glob
import pdb

# Third-party imports
import pandas as pd

import clarity_live
from clarity_live import Parser

# Begin helper functions
def get_income(row):
    if row['avg_income'] < 50000:
        return 'low'
    elif row['avg_income'] < 100000:
        return 'mid'
    else:
        return 'high'

def clean(row):
    r = re.compile(r'\d{3} ')
    precinct1 = re.sub(r, '', row['Precinct'])
    precinct2 = re.sub(re.compile(r'EP04-05|EP04-13'), 'EP04', precinct1)
    precinct3 = re.sub(re.compile(r'10H1|10H2'), '10H', precinct2)
    precinct4 = re.sub(re.compile(r'CATES D - 04|CATES D - 07'), 'CATES D', precinct3)
    precinct5 = re.sub(re.compile(r'AVONDALE HIGH - 05|AVONDALE HIGH - 04'), 'AVONDALE HIGH', precinct4)
    precinct6 = re.sub(re.compile(r'CHAMBLEE 2'), 'CHAMBLEE', precinct5)
    precinct7 = re.sub(re.compile(r'WADSWORTH ELEM - 04'), 'WADSWORTH ELEM', precinct6)
    return precinct6.strip().upper()[:20]

# End helper functions

#-----------------------------------------------------#
# merge_votes() concatenates all the precinct election 
# results .csv files from the Secretary of State
# and merges with the .csvs of demographic data for
# each precinct. It also calculates aggregate statistics
# based on this data
#-----------------------------------------------------#
def merge_votes():
    p = Parser(clarity_live.CONTEST_URL) # Scrape election results from clarity
    p.parse_precinct_results(counties=clarity_live.COUNTIES)
    p.to_csv()
    votes = pd.DataFrame(p.vote_data, columns=p.headers)
    #votes = pd.read_csv('w_ajc_precincts')

    # Rename column headers
    rvotes = votes.rename(columns={'CRUZ': 'rep_votes', 'J.': 'dem_votes'})

    # Filter out precincts with zero votes
    rvotes = rvotes[rvotes.apply(lambda x: x.rep_votes > 0 and 
        x.dem_votes > 0 and 
        x.total > 0, axis=1)] 

    # Calculate proportion of total votes that each candidate got
    rvotes['rep_p'] = rvotes.apply(lambda x: x['rep_votes']/x['total'], axis=1)
    rvotes['dem_p'] = rvotes.apply(lambda x: x['dem_votes']/x['total'], axis=1)
    rvotes['Precinct'] = rvotes.apply(clean, axis=1)

    rvotes.to_csv('income_race_votes_concat.csv', index=False)
    print 'File written to CSV'
    return
    # Import the .csv with the precinct demographic data
    df2 = pd.read_csv('atl_precincts_income_race_matched.csv', index_col=False)

    # Perform a left join to find out how many precincts don't have a match in
    # the election data
    merged = df2.merge(df1,
        left_on='ajc_precinct',
        right_on='Precinct',
        how='outer',
        indicator=True)
    merged.to_csv('all_w_ind.csv')

    # If any precincts were left out, write them to the unmerged_precincts .csv
    unmerged_left = merged[merged._merge == 'left_only']
    print 'Unmerged: ', len(unmerged_left)
    unmerged_right = merged[merged._merge == 'right_only']

    #if len(unmerged) > 0:
    #    unmerged.to_csv('unmerged_precincts.csv', index=False)
    #else:
    #    print 'All precincts merged successfully'
    unmerged_left.to_csv('unmerged_left.csv')
    unmerged_right.to_csv('unmerged_right.csv')

    # Filter merged dataset down to only precincts with matching names
    merged = merged[merged._merge == 'both']

    # Bin by income
    merged['income_bin'] = merged.apply(get_income, axis=1)

    # Write to a csv. I will have to manually join this .csv to the map with QGIS
    merged.to_csv('income_race_votes.csv')

    # Calculate aggregated stats for summary table
    race = merged.groupby('race')[['rep_votes', 'dem_votes']].sum().transpose()
    income = merged.groupby('income_bin')[['rep_votes', 'dem_votes']].sum().transpose()
    merged = race.merge(income, left_index=True, right_index=True)
    merged['all'] = merged.sum(axis=1)

    merged.to_json('aggregated_stats.json')

    return

if __name__ == '__main__':
    merge_votes()
