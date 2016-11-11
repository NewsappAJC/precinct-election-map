Precinct-level Election Results
===============================
Description: A map of 2016 general election results with precinct-level data, combined with demographic data about race and average income taken from the [2014 American Community Survey](http://factfinder.census.gov/faces/nav/jsf/pages/index.xhtml), built with Leaflet. The vote results are collected by scraping the [Secretary of State elections website](http://results.enr.clarityelections.com/GA/62848/174629/en/md_data.html?cid=30310&), and can be automatically merged with the map data as needed

See the `data_cleaning` dir for the scripts used to get the vote data, combine it with demographic data, and calculate summary statistics. The `get_data` dir also contains the script used with QGIS to calculate demographic data for voting precincts based on overlapping census tracts.

Published: Nov. 8 2016

Lives Here: [http://www.myajc.com/atlanta-neighborhood-2016-presidential-election-results-map/](http://www.myajc.com/atlanta-neighborhood-2016-presidential-election-results-map/)

Hosted Here: [http://ajcnewsapps.s3-website-us-east-1.amazonaws.com/2016/precinct-election-map/](http://ajcnewsapps.s3-website-us-east-1.amazonaws.com/2016/precinct-election-map/)

Installation
---
Run the following commands from the top level directory of the app.

Install node dependencies
`npm install`

Install nvm and use the right version of Node
`npm install -g nvm`
`nvm use`

Install Python dependencies (if you don't have [virtualenv](https://virtualenv.pypa.io/en/stable/) it's a good idea to install it)
`pip install -r requirements.txt`

Setup
---
To run the scraper and regenerate the map with data from a Clarity elections site:

1. Edit the constants at the top of `clarity_live.py` to fit the parameters of the race you're interested in scraping. The scraper should work for race data provided by Clarity, a vendor used by more than 20 states to show live precinct-level results.
2. You may need to install PhantomJS separately and pass the path to the binary in the `clarity_live.py` script. [Get PhantomJS](phantomjs.org)
3. Run the `clarity_live.py` script to grab the most recent results and regenerate the map: `npm run update_data`. You must have a recent version of Firefox installed. Make sure to check that Selenium is compatible with your Firefox installation. Pauses have been added to avoid Selenium crashing so the script can take a little while to run. The script is far from perfect so it may throw errors.

Run the development server
`npm run serve-dev`

Deployment
---
To deploy the map with live updates on election night, simply start a cronjob that runs `python data_cleaning/2016/clarity_live.py` and `npm run deploy-production` in succession. Use `npm run deploy-staging` to deploy to the staging environment.

If you run into trouble with the shell process spawned by cron not being able to access the virtualenv, follow the instructions in [this StackOverflow answer](http://stackoverflow.com/a/2924295/4599578).

Notes
---
* Frontend code lives in the `assets` directory
* The python scripts used to collect data and update the map live in the `data_cleaning` directory

Data
---
* [Census data about income and race from the ACS 2014 survey](http://factfinder.census.gov/faces/nav/jsf/pages/index.xhtml)
* [2014 precinct shapefiles from the reapportionment office](http://www.legis.ga.gov/Joint/reapportionment/en-US/default.aspx)
* [2014 census tract shapefiles](ftp://ftp2.census.gov/geo/tiger/TIGER2014/TRACT/)
