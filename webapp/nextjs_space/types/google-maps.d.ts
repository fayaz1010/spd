
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: any;
          AutocompleteService: any;
          PlacesServiceStatus: any;
          PlacesService: any;
        };
        Geocoder: any;
        GeocoderStatus: any;
        LatLng: any;
        LatLngBounds: any;
        Map: any;
        Marker: any;
        InfoWindow: any;
      };
    };
  }
}

export {};
