Precinct-level Election Results
===============================
Description: A map of election results with precinct-level data, combined with demographic data about race and average income taken from the [2014 American Community Survey](http://factfinder.census.gov/faces/nav/jsf/pages/index.xhtml), built with Leaflet. The vote results are collected by scraping the [Secretary of State elections website](http://results.enr.clarityelections.com/GA/62848/174629/en/md_data.html?cid=30310&). 

See the `get_data` dir for the scripts used to get the vote data, combine it with demographic data, and calculate summary statistics. The `get_data` dir also contains the script used with QGIS to calculate demographic data for voting precincts based on overlapping census tracts.

Published: TKTK

Lives Here: TKTK

Hosted Here: TKTK

Installation
---
`npm install`

Startup
---
`npm run serve-dev`

Data
---
* [Census data about income and race from the ACS 2014 survey](http://factfinder.census.gov/faces/nav/jsf/pages/index.xhtml)
* [2014 precinct shapefiles from the reapportionment office](http://www.legis.ga.gov/Joint/reapportionment/en-US/default.aspx)
* [2014 census tract shapefiles](ftp://ftp2.census.gov/geo/tiger/TIGER2014/TRACT/)
