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
def bin_income(row):
    if row['avg_income'] < 50000:
        return 'low'
    elif row['avg_income'] < 100000:
        return 'mid'
    else:
        return 'high'

# End helper functions

#-----------------------------------------------------#
# merge_votes() concatenates all the precinct election 
# results .csv files from the Secretary of State. It then cleans 
# the precinct names and merges with the .csvs of demographic data for
# each precinct. It then calculates aggregate statistics
# based on this data.
#-----------------------------------------------------#
def merge_votes():
    current_dir = dirname(abspath(__file__))

    # Get a list of all the .csv files in the precinct_results dir
    # Each .csv must have the county name as its filename
    precinct_results = glob(join(current_dir, 'precinct_results', '*.csv'))
    list_ = []

    for f in precinct_results:
        # Load the csv and filter down to the relevant columns
        df = pd.read_csv(f, index_col=False, header=2)
        df = df[['Precinct', 'Registered Voters', 'Total Votes', 'Total Votes.1', 'Total']]

        # Rename some of the columns. To date the SoS has always placed the
        # Republican candidate first. Check this when downloading 2016 data.
        df = df.rename(columns={
            'Total Votes': 'rep_votes',
            'Total Votes.1': 'dem_votes',
            'Registered Voters':'registered_v',
            'Total': 'total'})

        # Filter out precincts with zero votes
        df = df[df.apply(lambda x: x.rep_votes > 0 and 
            x.dem_votes > 0 and 
            x.total > 0, axis=1)] 

        # Add a column with proportion of total votes for each candidate
        df['rep_p'] = df.apply(lambda x: float(x['rep_votes'])/float(x['total']), axis=1)
        df['dem_p'] = df.apply(lambda x: float(x['dem_votes'])/float(x['total']), axis=1)

        # Convert precinct to uppercase
        df['Precinct'] = df.apply(lambda x: clean(x['Precinct'], county), axis=1)

        # Get the county name from the csv filename
        df['county'] = split(f)[1][:-4].upper()

        # Append the cleaned dataframe to our list of all counties
        list_.append(df)

    # CALCULATE AGGREGATE STATISTICS

    # Concat the list of dataframes
    df1 = pd.concat(list_)
    df1.to_csv('votes_concat.csv', index=False)

    # Import the .csv with the precinct demographic data
    df2 = pd.read_csv('2012_precincts_income_race_clean.csv', index_col=False)

    # Perform a left join to find out how many precincts don't have a match in
    # the election data
    merged = df2.merge(df1,
        left_on='PRECINCT_N',
        right_on='Precinct',
        how='outer',
        indicator=True)
    # Write unmerged precincts to a list so we can check them
    unmerged_left = merged[merged._merge == 'left_only']
    print 'Unmerged: ', len(unmerged_left)
    unmerged_left.to_csv('unmerged_left.csv')
    unmerged_right = merged[merged._merge == 'right_only']
    unmerged_right.to_csv('unmerged_right.csv')

    # Filter merged dataset down to only precincts that merged successfully
    merged = merged[merged._merge == 'both']

    # Bin by income
    merged['income_bin'] = merged.apply(bin_income, axis=1)

    # Calculate aggregated stats for summary table
    race = merged.groupby(['county', 'race'])['rep_votes', 'dem_votes'].sum().unstack()
    income = merged.groupby(['county','income_bin'])['rep_votes', 'dem_votes'].sum().unstack()

    reps = race.rep_votes.merge(income.rep_votes, left_index=True, right_index=True)
    reps['party'] = 'rep_votes'
    repsf = reps.reset_index()

    dems = race.dem_votes.merge(income.dem_votes, left_index=True, right_index=True)
    dems['party'] = 'dem_votes'
    demsf = dems.reset_index()

    c = pd.concat([repsf, demsf])

    # Create a nested defaultdict
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
                data['ALL COUNTIES'][field][party] += row[field]
            except KeyError:
                data['ALL COUNTIES'][field][party] = 0

    # Lastly, calculate summary stats for counties
    data['ALL COUNTIES']['all']['rep_votes'] = merged['rep_votes'].sum()
    data['ALL COUNTIES']['all']['dem_votes'] = merged['dem_votes'].sum()

    with open(FPATH, 'w') as f:
        f.write(json.dumps(data, indent=4))

    return

if __name__ == '__main__':
    merge_votes()
