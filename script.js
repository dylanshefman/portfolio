document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('street-canvas');
    const ctx = canvas.getContext('2d');

    const mapData = 'maps/cropped_detroit.geojson';

    // Bounding box for downtown Detroit (-83.057379, 42.329023, -83.038781, 42.336422)
    const bounds = {
        minLng: -83.057379,
        minLat: 42.329023,
        maxLng: -83.038781,
        maxLat: 42.336422
    };

    let streets = [];
    let nearestPoint = null;

    // Load GeoJSON data
    fetch(mapData)
        .then(response => response.json())
        .then(data => {
            streets = parseGeoJSON(data);
            console.log(streets);
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawStreetGrid();
        });

    // Parse the GeoJSON data to extract street lines (both LineString and MultiLineString)
    function parseGeoJSON(data) {
        let lines = [];
        data.features.forEach(feature => {
            const streetname = feature.properties.RDNAME;
            const geometry = feature.geometry;

            if (geometry.type === 'LineString') {
                // Single line
                lines.push({
                    streetname: streetname,
                    coords: [geometry.coordinates] // Wrap the coordinates in an array to handle uniformly
                });
            } else if (geometry.type === 'MultiLineString') {
                // Multiple lines
                lines.push({
                    streetname: streetname,
                    coords: geometry.coordinates
                });
            }
        });
        return lines;
    }

    // Convert geographic coordinates (lon, lat) to screen coordinates based on the bounds
    function projectCoordinates(lon, lat) {
        const x = (lon - bounds.minLng) / (bounds.maxLng - bounds.minLng) * canvas.width;
        const y = (1 - (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * canvas.height;
        return { x, y };
    }

    // Function to calculate color intensity based on distance
    function getColorBasedOnDistance(distance) {
        const maxDistance = 400;  // Max distance at which roads will fade to grey
        const intensity = Math.max(0, Math.min(1, (maxDistance - distance) / maxDistance));
        const red = Math.floor(255 * intensity);
        return `rgb(${red},0,0)`;
    }

    // Draw the street grid on the canvas with pixel-level color calculation, maintaining line thickness
    function drawStreetGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 8;  // Maintain line thickness

        streets.forEach(line => {
            const coordinatesList = line.coords;

            coordinatesList.forEach(coordinates => {
                for (let i = 0; i < coordinates.length - 1; i++) {
                    const [lon1, lat1] = coordinates[i];
                    const [lon2, lat2] = coordinates[i + 1];
                    const { x: x1, y: y1 } = projectCoordinates(lon1, lat1);
                    const { x: x2, y: y2 } = projectCoordinates(lon2, lat2);

                    // Calculate the distance between points and divide the segment into smaller parts
                    const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    const numSegments = Math.ceil(lineLength); // Segment length (in pixels)

                    ctx.beginPath();
                    // Draw each segment while maintaining the line thickness
                    for (let j = 0; j <= numSegments; j++) {
                        // Interpolate each point along the line
                        const t = j / numSegments;
                        const x = x1 + t * (x2 - x1);
                        const y = y1 + t * (y2 - y1);

                        // Find the nearest point to the cursor
                        let distance = Infinity;
                        if (nearestPoint) {
                            distance = Math.sqrt(Math.pow(nearestPoint.x - x, 2) + Math.pow(nearestPoint.y - y, 2));
                        }

                        // Get color based on distance
                        const color = getColorBasedOnDistance(distance);

                        // Change the color for the current segment
                        ctx.strokeStyle = color;
                        ctx.lineTo(x, y);
                    }

                    // Finalize the line drawing
                    ctx.stroke();
                }
            });
        });
    }

    // Event listener for mouse movement
    canvas.addEventListener('mousemove', function (event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        nearestPoint = { x: mouseX, y: mouseY };

        drawStreetGrid(); // Redraw the street grid with the updated nearest point
    });
});

