# Standard lib imports
import os
import re
import pdb

# Third-party imports
import pandas as pd
import clarity_live
from clarity_live import Parser


#-----------------------------------------------------#
# merge_votes() concatenates all the precinct election 
# results .csv files from the Secretary of State
# and merges with the .csvs of demographic data for
# each precinct. It also calculates aggregate statistics
# based on this data
#-----------------------------------------------------#
class ResultSnapshot(Parser):
    def __init__(self, **kwargs):
        super(ResultSnapshot, self).__init__(**kwargs)

        unmerged_precincts = None #[DataFrame]

    # A messy system for renaming up the few precincts scraped from the site that
    # have names that don't match the map names, when the map names can't be changed
    def _clean(self, row):
        r = re.compile(r'\d{3} ')
        precinct1 = re.sub(r, '', row['Precinct'])
        precinct2 = re.sub(re.compile(r'EP04-05|EP04-13'), 'EP04', precinct1)
        precinct3 = re.sub(re.compile(r'10H1|10H2'), '10H', precinct2)
        precinct4 = re.sub(re.compile(r'CATES D - 04|CATES D - 07'), 'CATES D', precinct3)
        precinct5 = re.sub(re.compile(r'AVONDALE HIGH - 05|AVONDALE HIGH - 04'), 'AVONDALE HIGH', precinct4)
        precinct6 = re.sub(re.compile(r'CHAMBLEE 2'), 'CHAMBLEE', precinct5)
        precinct7 = re.sub(re.compile(r'WADSWORTH ELEM - 04'), 'WADSWORTH ELEM', precinct6)
        return precinct6.strip().upper()[:20]

    def _get_income(self, row):
        if row['avg_income'] < 50000:
            return 'low'
        elif row['avg_income'] < 100000:
            return 'mid'
        else:
            return 'high'

    def _abstract_votes(self):
        # Filter out precincts with zero votes
        rvotes = rvotes[rvotes.apply(lambda x: x.rep_votes > 0 and 
            x.dem_votes > 0 and 
            x.total > 0, axis=1)] 

        # Rename column headers
        rvotes = votes.rename(columns={cand1: 'rep_votes', cand2: 'dem_votes'})

        # Calculate proportion of total votes that each candidate got
        rvotes['rep_p'] = rvotes.apply(lambda x: x['rep_votes']/x['total'], axis=1)
        rvotes['dem_p'] = rvotes.apply(lambda x: x['dem_votes']/x['total'], axis=1)
        rvotes['Precinct'] = rvotes.apply(self._clean, axis=1)

        rvotes.to_csv('cleaned_votes.csv', index=False)

    def merge(self, votes=self.precinct_results, stats='ajc_precincts.csv'):
        """
        Merge the election result dataset with the precinct maps from the Reapportionment office.
        Useful if you have a file with demographic stats that you want to merge
        with the election data.
        """
        votes = pd.DataFrame(votes['data'], columns=votes['headers'])
        stats = pd.read_csv(stats, index_col=False)

        merged = stats.merge(votes,
            left_on='ajc_precinct',
            right_on='Precinct',
            how='outer',
            indicator=True)

        self.unmerged_precincts = merged[merged._merge != 'both']
        self.merged_precincts = merged[merged._merge == 'both']


    def 
        # Bin by income
        merged['income_bin'] = merged.apply(self._get_income, axis=1)

        # Calculate aggregated stats for summary table
        race = merged.groupby('race')[['rep_votes', 'dem_votes']].sum().transpose()
        income = merged.groupby('income_bin')[['rep_votes', 'dem_votes']].sum().transpose()
        merged = race.merge(income, left_index=True, right_index=True)
        merged['all'] = merged.sum(axis=1)

        merged.to_json('aggregated_stats.json')

        return

if __name__ == '__main__':
    p = Parser(clarity_live.CONTEST_URL) # Scrape election results from clarity
    p.parse_precinct_results(counties=clarity_live.COUNTIES)
