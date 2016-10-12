# Standard lib imports
from os.path import dirname, abspath, join, split
import re
import json
from glob import glob
from collections import defaultdict

# Third-party imports
import pandas as pd

# Constants
BASE_DIR = dirname(dirname(dirname(abspath(__file__))))
FPATH = join(BASE_DIR, 'assets', 'data', '2012_agg_stats.json')

# Begin helper functions
def get_income(row):
    if row['avg_income'] < 50000:
        return 'low'
    elif row['avg_income'] < 100000:
        return 'mid'
    else:
        return 'high'
# End helper functions

#-----------------------------------------------------#
# merge_votes() concatenates all the precinct election 
# results .csv files from the Secretary of State
# and merges with the .csvs of demographic data for
# each precinct. It also calculates aggregate statistics
# based on this data
#-----------------------------------------------------#
def merge_votes():
    current_dir = dirname(abspath(__file__))

    # Get a list of all the .csv files in the precinct_results dir
    precinct_results = glob(join(current_dir, 'precinct_results', '*.csv'))
    list_ = []

    # Create a single dataframe by concatenating all the .csv files
    for f in precinct_results:
        df = pd.read_csv(f, index_col=False, header=2)
        # We're only interested in the total votes for each candidate
        df = df[['Precinct', 'Registered Voters', 'Total Votes', 'Total Votes.1', 'Total']]

        # Rename some of the columns. This assumes that every csv from the
        # Secretary of State lists the candidates in the same order, double-check this.
        df = df.rename(columns={
            'Total Votes': 'rep_votes',
            'Total Votes.1': 'dem_votes',
            'Registered Voters':'registered_v',
            'Total': 'total'})

        # Filter out precincts with zero votes
        df = df[df.apply(lambda x: x.rep_votes > 0 and 
            x.dem_votes > 0 and 
            x.total > 0, axis=1)] 

        # Calculate proportion of total votes that each candidate got
        df['rep_p'] = df.apply(lambda x: float(x['rep_votes'])/float(x['total']), axis=1)
        df['dem_p'] = df.apply(lambda x: float(x['dem_votes'])/float(x['total']), axis=1)

        df['Precinct'] = df.apply(lambda x: x['Precinct'].upper(), axis=1)

        # Get the county name from the csv to limit fuzzy matching later
        df['county'] = split(f)[1][:-4].upper()

        # Append the cleaned dataframe to our list of precincts
        list_.append(df)

    # Concat the list of dataframes into a single dataframe
    df1 = pd.concat(list_)
    df1.to_csv('votes_concat.csv', index=False)

    # Import the .csv with the precinct demographic data
    df2 = pd.read_csv('income_race_precincts.csv', index_col=False)

    # Perform a left join to find out how many precincts don't have a match in
    # the election data
    merged = df2.merge(df1,
        left_on='PRECINCT_N',
        right_on='Precinct',
        how='outer',
        indicator=True)
    # Write unmerged precincts to a list so we can check them
    unmerged_right = merged[merged._merge == 'right_only']
    print 'Unmerged: ', len(unmerged_right)
    unmerged_right.to_csv('unmerged.csv')

    # Filter merged dataset down to only precincts that merged successfully
    merged = merged[merged._merge == 'both']
    merged.to_csv('betterfucknmatchyo.csv')

    # Bin by income
    merged['income_bin'] = merged.apply(get_income, axis=1)

    # Calculate aggregated stats for summary table. Has to be nested so that user can 
    # drill down and get data by demographic group, by county, or by demographic group
    # within a county.
    race = merged.groupby(['county', 'race'])['rep_votes', 'dem_votes'].sum().unstack()
    income = merged.groupby(['county','income_bin'])['rep_votes', 'dem_votes'].sum().unstack()

    reps = race.rep_votes.merge(income.rep_votes, left_index=True, right_index=True)
    reps['party'] = 'rep_votes'
    repsf = reps.reset_index()

    dems = race.dem_votes.merge(income.dem_votes, left_index=True, right_index=True)
    dems['party'] = 'dem_votes'
    # The county is set as the index by default after the groupby, don't leave it that way
    demsf = dems.reset_index()

    c = pd.concat([repsf, demsf])

    # Using a defaultdict to supply default values when a key doesn't exist
    # The code below creates a nested defaultdict
    # http://stackoverflow.com/questions/19189274/defaultdict-of-defaultdict-nested
    data = defaultdict(lambda: defaultdict(dict))

    fields = ['black', 
              'white',
              'hispanic',
              'high',
              'mid',
              'low']

    # Create a nested JSON object
    for i, row in c.iterrows():
        county = row['county']
        party = row['party']
        data[county]['all'][party] = 0

        for field in fields:
            # Check if val is null for precincts missing a certain group
            # (eg some precincts have no Hispanics)
            if pd.isnull(row[field]):
                continue
            data[county][field][party] = row[field]
            data[county]['all'][party] += row[field]
            # It's impossible to use default dict for the below, because the factory can't
            # generate both dicts and ints by default
            try: 
                data['ALL'][field][party]+= row[field]
            except KeyError:
                data['ALL'][field][party] = 0

    # Lastly, calculate summary stats for counties. Don't loop through ALL because it
    # repeats data. Sorry about the long list comprehension.
    #gop_totals = [value['GOP'] for key, value in data['ALL'].iteritems()]
    #dem_totals = [value['DEM'] for key, value in data['ALL'].iteritems()]
    data['ALL']['all']['rep_votes'] = merged['rep_votes'].sum()
    data['ALL']['all']['dem_votes'] = merged['dem_votes'].sum()

    with open(FPATH, 'w') as f:
        f.write(json.dumps(data, indent=4))

    return

if __name__ == '__main__':
    merge_votes()
