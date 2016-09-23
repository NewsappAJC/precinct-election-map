import random
import pandas as pd

df = pd.read_csv('../assets/data/income_race_precincts.csv')

# BEGIN HELPER FUNCTIONS

# Random vote data for testing DO NOT USE IN PRODUCTION OBVIOUSLY.
def get_votes(row):
    total = (random.random() * 500) + 1000
    rep_votes = (random.random() * (total * .5)) + total * .3

    return int(rep_votes)

# Binning by income
def get_income(row):
    if row['avg_income'] < 50000:
        return 'low'
    elif row['avg_income'] < 100000:
        return 'mid'
    else:
        return 'high'

# END HELPER FUNCTIONS

# Write a csv of non-aggregated data for use in map
df['rep_v'] = df.apply(get_votes, axis=1)
df['dem_v'] = df.apply(lambda x: int((random.random() * 500) + 1000) - x['rep_v'], axis=1)
df['income'] = df.apply(get_income, axis=1)
df.to_csv('data_w_votes.csv')

# Calculate aggregated stats for summary table
race = df.groupby('race')[['rep_v', 'dem_v']].sum().transpose() # Transpose so that you can join frames on vote category
income = df.groupby('income')[['rep_v', 'dem_v']].sum().transpose()
merged = race.merge(income, left_index=True, right_index=True)
merged['all'] = merged.sum(axis=1)

merged.to_json('../assets/data/aggregated_stats.json')
