/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiY29kZXNodWJoY3BwMjUyNiIsImEiOiJjbWJybGl1OWswOHByMmlzNzM4cm8ybjhuIn0.WJRgkqY4B1I6CFXXCefvCw';
  var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/codeshubhcpp2526/cmbrmb3jz00z101sdh6pnfcps', // style URL
    // zoom: 5,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create Marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add a marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
