#-----------------------------------------#
# Compute values for polygons based on the values
# of overlapping polygons using the QGIS Python API
#-----------------------------------------#
import csv
import itertools

canvas = iface.mapCanvas()
layers = canvas.layers()

print 'Proportionalizing the following layers:'
if layers[0].name() == '2014_acs_tracts_data_ATLANTA' and layers[1].name() == '2014_voting_dists_ATLANTA':
    print layers[0].name()
    print layers[1].name() 

intersections = []

# Loop through the features in the voting precinct layer
for precinct in layers[1].getFeatures():
    # Loop through the features in the census tract layer
    for tract in layers[0].getFeatures():
        # Check if each census tract overlaps with a voting precinct
        if tract.geometry().intersects(precinct.geometry()):
            # Find the intersection
            intersection = tract.geometry().intersection(precinct.geometry())
            # Compute the area of the intersection
            isect_area = intersection.geometry().area()
            tract_area = tract.geometry().area()

            # Compute the proportion of the census tract included in the intersection
            # (the proportion factor)
            p = isect_area / tract_area
            
            # Get the values we need from the census tract data, 
            # and multiply by the proportion factor
            income = tract.attribute('income_tot')
            num_households = tract.attribute('income_num')
            total_pop = tract.attribute('race_total')
            white = tract.attribute('race_white')
            hispanic = tract.attribute('race_hispa')
            black = tract.attribute('race_black')
            id = precinct.attribute('CTYSOSID')
            tract_id = tract.attribute('NAMELSAD')

            # Add those values to a dictionary that we append to the list of intersections
            data = {'v_id': id, 
                    'tract': tract_id,
                    'total_pop': total_pop * p,
                    'hispanic': hispanic * p,
                    'black': black * p,
                    'white': white * p,
                    'p': p
                   }

            try:
                income = float(income)
                num_households = float(num_households)
                data['total_income'] = income * p
                data['households'] = num_households * p
            except:
                data['total_income'] = 'NA'
                data['households'] = 'NA'

            intersections.append(data)

with open('/Users/jcox/Desktop/voting_dist_data.csv', 'w') as f:
    keys = intersections[0].keys()
    wr = csv.DictWriter(f, keys, delimiter=',')
    wr.writeheader()
    wr.writerows(intersections)
