import geopandas as gpd
from shapely.geometry import box

# Load GeoJSON file into a GeoDataFrame
gdf = gpd.read_file('maps/detroit.geojson')

# Define the bounding box for cropping (xmin, ymin, xmax, ymax)
xmin, ymin, xmax, ymax = -83.057379, 42.329023, -83.038781, 42.336422  # Example coordinates
bbox = box(xmin, ymin, xmax, ymax)

# Crop the GeoDataFrame by filtering out the data within the bounding box
cropped_gdf = gdf[gdf.intersects(bbox)]

# Save the cropped GeoDataFrame to a new GeoJSON file
cropped_gdf.to_file('cropped_detroit.geojson', driver='GeoJSON')

# Optionally, you can also plot the cropped data to check
cropped_gdf.plot()





