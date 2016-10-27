# Standard lib imports
import os
import re
import pdb

# Third-party imports
import pandas as pd
import clarity_live

# Constants
DIR = os.path.dirname(os.path.abspath(__file__))
CONTEST_URL = r'http://results.enr.clarityelections.com/GA/58980/163369/en/md_data.html?cid=50&'
COUNTIES = ['CLAYTON']

class ResultSnapshot(Parser):
    def __init__(self, **kwargs):
        super(ResultSnapshot, self).__init__(**kwargs)

        unmerged_precincts = None
        merged_precincts = None

    def _clean(self, row):
        """
        Private method forrenaming up the few precincts scraped from the site that
        have names that don't match the map names, when the map names can't be changed
        """
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
        """
        Private method for binning income
        """
        if row['avg_income'] < 50000:
            return 'low'
        elif row['avg_income'] < 100000:
            return 'mid'
        else:
            return 'high'

    def _clean_vote_stats(self, precincts):
        """
        Private method used to calculate proportions of voters for each 
        candidate by precinct, clean the precinct name, put the income in bins,
        and perform other operations necessary before it's ready to be 
        consumed by the JS app
        """
        # Filter out precincts with zero votes
        # Rename column headers
        cframe = precincts[precincts.apply(lambda x: x.rep_votes > 0 and 
            x.dem_votes > 0 and 
            x.total > 0, axis=1)] 

        # Calculate proportion of total votes that each candidate got
        cframe['rep_p'] = cframe.apply(lambda x: x['rep_votes']/x['total'], axis=1)
        cframe['dem_p'] = cframe.apply(lambda x: x['dem_votes']/x['total'], axis=1)
        cframe['Precinct'] = cframe.apply(self._clean, axis=1)
        cframe['income_bin'] = merged.apply(self._get_income, axis=1)

        return cframe

    def merge(self, votes=self.precinct_results, stats='ajc_precincts.csv'):
        """
        Public method used to merge the election result dataset with the precinct 
        maps from the Reapportionment office.
        """
        votes = pd.DataFrame(votes['data'], columns=votes['headers'])
        stats = pd.read_csv(stats, index_col=False)

        fvotes = get_vote_stats(votes)

        merged = stats.merge(votes,
            left_on='ajc_precinct',
            right_on='Precinct',
            how='outer',
            indicator=True)

        self.unmerged_precincts = merged[merged._merge != 'both']
        self.merged_precincts = merged[merged._merge == 'both']

        path = os.path.join(DIR, 'vote_data.csv')
        df.to_csv(path)
        return

    def aggregate_stats(self):
        """
        Calculate an aggregate stats file that's used to populate summary
        statistics in the map
        """
        # Calculate aggregated stats for summary table
        race = self.merged_precincts.groupby('race')[['rep_votes', 'dem_votes']].sum().transpose()
        income = self.merged_precincts.groupby('income_bin')[['rep_votes', 'dem_votes']].sum().transpose()
        merged = race.merge(income, left_index=True, right_index=True)
        merged['all'] = merged.sum(axis=1)

        merged.to_json(os.path.join(DIR, 'aggregated_stats.json'))
        return


if __name__ == '__main__':
    p = Parser(CONTEST_URL) # Scrape election results from clarity
    p.parse_precinct_results(COUNTIES)
    p.merge()
    p.aggregate_stats()

