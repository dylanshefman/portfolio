import requests
import geojson

def fetch_streets_in_bbox(lat_min, lat_max, lon_min, lon_max):
    """
    Fetch streets within a bounding box using Overpass API.
    """
    # Overpass API query to get streets (highway = residential, primary, secondary, etc.)
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    (
      way["highway"](around:{lat_max},{lon_max},{lat_min},{lon_min});
    );
    out body;
    """
    
    response = requests.get(overpass_url, params={'data': overpass_query})
    response.raise_for_status()  # Ensure we got a valid response

    return response.json()

def convert_to_geojson(osm_data):
    """
    Convert OSM data to GeoJSON format.
    """
    features = []
    for element in osm_data['elements']:
        if element['type'] == 'way':
            coords = []
            for node in element['nodes']:
                coords.append((node['lat'], node['lon']))
            features.append(geojson.Feature(
                geometry=geojson.LineString(coords),
                properties={}
            ))
    return geojson.FeatureCollection(features)

def main(lat_min, lat_max, lon_min, lon_max):
    # Step 1: Fetch streets within the bounding box
    print(f"Fetching streets within the bounding box: {lat_min}, {lat_max}, {lon_min}, {lon_max}...")
    osm_data = fetch_streets_in_bbox(lat_min, lat_max, lon_min, lon_max)
    print(f"Fetched {len(osm_data['elements'])} streets.")

    # Step 2: Convert the OSM data to GeoJSON
    geojson_data = convert_to_geojson(osm_data)

    # Step 3: Save the GeoJSON data to a file
    geojson_filename = f"bbox_streets_{lat_min}_{lat_max}_{lon_min}_{lon_max}.geojson"
    with open(geojson_filename, 'w') as f:
        geojson.dump(geojson_data, f)
    print(f"GeoJSON data saved as {geojson_filename}")

if __name__ == "__main__":
    # Prompt the user for four coordinates (bounding box corners)
    lat_min = float(input("Enter the minimum latitude: "))
    lat_max = float(input("Enter the maximum latitude: "))
    lon_min = float(input("Enter the minimum longitude: "))
    lon_max = float(input("Enter the maximum longitude: "))
    
    main(lat_min, lat_max, lon_min, lon_max)
