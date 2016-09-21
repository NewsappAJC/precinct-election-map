import random
import json
import pandas as pd

df = pd.read_csv('income_race_precincts.csv')

# HELPER FUNCTIONS

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

df['rep_v'] = df.apply(get_votes, axis=1)
df['dem_v'] = df.apply(lambda x: ((random.random() * 500) + 1000) - x['rep_v'], axis=1)
df['income'] = df.apply(get_income, axis=1)

# END HELPER FUNCTIONS

# Calculate aggregated stats for summary table

dems_by_race = df.groupby('race')['dem_v'].sum()
reps_by_race = df.groupby('race')['rep_v'].sum()

dems_by_income = df.groupby('income')['dem_v'].sum()
reps_by_income = df.groupby('income')['rep_v'].sum()

outd = {
    'black': {},
    'white': {},
    'hispanic': {},
    'high': {},
    'mid': {},
    'low': {},
}

for cat in outd:
    if cat in ['black', 'white', 'hispanic']:
        outd[cat]['dem_v'] = int(dems_by_race.ix[cat])
        outd[cat]['rep_v'] = int(reps_by_race.ix[cat])
    else:
        outd[cat]['dem_v'] = int(dems_by_income.ix[cat])
        outd[cat]['rep_v'] = int(reps_by_income.ix[cat])

out_frame = pd.DataFrame(outd)
out_frame.to_json('cooltimes.json')
