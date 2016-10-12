# Standard lib imports
import os
import difflib # Useful for fuzzy matching
import re
from glob import glob

# Third-party imports
import pandas as pd

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
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Get a list of all the .csv files in the precinct_results dir
    precinct_results = glob(os.path.join(current_dir, 'precinct_results', '*.csv'))
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
        df['rep_p'] = df.apply(lambda x: x['rep_votes']/x['total'], axis=1)
        df['dem_p'] = df.apply(lambda x: x['dem_votes']/x['total'], axis=1)

        # Get the county name from the csv to limit fuzzy matching later
        df['county'] = os.path.split(f)[1][:-4].upper()

        # Append the cleaned dataframe to our list of precincts
        list_.append(df)

    # Concat the list of dataframes into a single dataframe
    df1 = pd.concat(list_)
    df1.to_csv('votes_concat.csv', index=False)

    # Import the .csv with the precinct demographic data
    df2 = pd.read_csv('2012_atl_precincts_income_race.csv', index_col=False)

    # Perform a left join to find out how many precincts don't have a match in
    # the election data
    merged = df2.merge(df1,
        left_on='PRECINCT_N',
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
