// MapContainer.js
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Autocomplete} from '@react-google-maps/api';
import ProjectDataService from "../services/upload-files.service";
//import axios from 'axios';

const libraries = ['places'];
const containerStyle = {
  width: '100%',
  height: '400px',
};

const center = {
  lat: 43.65107, // Example: Toronto latitude
  lng: -79.347015, // Example: Toronto longitude
};

const MapContainer = () => {
  const [markers, setMarkers] = useState([]);
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [apiKey, setApiKey] = useState('');

  const markerRef = useRef([]);   // pointers to markers

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await ProjectDataService.getAll(); // get the addresses
        console.log('Response from getAll:', response); // Log response
        const addresses = response.data;
        console.log('Addresses:', addresses);

        const results = await ProjectDataService.geocode(addresses);  // geocode them
        setMarkers(results.data);

      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    const fetchApiKey = async () => {
      try {
        const response = await ProjectDataService.mapsKey();
        const data = response.data;
        setApiKey(data.key);
      } catch (error) {
        console.error("Error fetching API key: ", error)
      }
    }
    fetchAddresses();
    fetchApiKey();
  }, []);   // Empty

  const handlePlaceSelected = (marker) => {
    setMarkers((current) => [...current, { ...marker, fromSearchBar: true }]);  // add a fromsearchbar element to differentiate the searched marker from the db markers
    if (map) {
      map.panTo(marker.location); // Make sure marker.location is correct
      map.setZoom(16); // Zoom in on the marker
    } else {
      console.error("Map instance is not initialized.");
    }
  };

  const onLoad = mapInstance => {
    setMap(mapInstance);
  }

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      const newMarker = {
        location,
        address: place.formatted_address,
      };

      handlePlaceSelected(newMarker);
    } else {
      console.error("Autocomplete is not loaded yet!");
    }
  };

  useEffect(() => {
    if(map) {
      markerRef.current.forEach(marker => marker.setMap(null));   // Remove old markers
      markerRef.current = [];     // clear pointer

      markers.forEach(markerData => {
        const marker = new window.google.maps.Marker({      // refers specifically to global google.maps object
           position: markerData.location,
           map: map,
           title: markerData.address
        });
        markerRef.current.push(marker);       // Store the marker value
      });
    }
  }, [map, markers]);

  return (

    <div>
      {apiKey && (<LoadScript googleMapsApiKey={apiKey} libraries={libraries}>   
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search for a location"
            style={{
              boxSizing: `border-box`,
              border: `1px solid transparent`,
              width: `240px`,
              height: `32px`,
              padding: `0 12px`,
              borderRadius: `3px`,
              boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
              fontSize: `14px`,
              outline: `none`,
              textOverflow: `ellipses`,
              position: "absolute",
              left: "50%",
              marginLeft: "-120px",
              top: "10px",
            }}
          />
        </Autocomplete>

        <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10} onLoad={onLoad}>

          {/* {markers.map((marker, index) => (
            
            <Marker
              key={index}
              position={marker.location}
              onClick={() => setSelectedMarker(marker)}
              icon={{
                url: marker.fromSearchBar
                  ? "../images/maps-icon.png"
                  : "http://maps.google.com/mapfiles/ms/icons/red-dot.png" // Blue for searched marker

              }}
            />
          ))}
          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.location}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <h2>Address</h2>
                <p>{selectedMarker.address}</p>
              </div>
            </InfoWindow>
          )} */}
        </GoogleMap>
      </LoadScript>
      )}
    </div>
  );
};

export default MapContainer;
