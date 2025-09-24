/**
 * Google Maps API utilities for loading and using Places API
 */

// Global variable to track if Google Maps API is loaded
let googleMapsLoaded = false;
let googleMapsPromise: Promise<void> | null = null;

/**
 * Load Google Maps JavaScript API with Places library
 */
export const loadGoogleMapsApi = (apiKey: string): Promise<void> => {
  // Return existing promise if already loading
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  // Return resolved promise if already loaded
  if (googleMapsLoaded || (window as any).google?.maps?.places) {
    googleMapsLoaded = true;
    return Promise.resolve();
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Add callback to window
    (window as any).initGoogleMaps = () => {
      googleMapsLoaded = true;
      resolve();
      // Clean up
      delete (window as any).initGoogleMaps;
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Check if Google Maps API is loaded
 */
export const isGoogleMapsLoaded = (): boolean => {
  return googleMapsLoaded && !!(window as any).google?.maps?.places;
};

/**
 * Get place details from a place ID
 */
export const getPlaceDetails = (
  placeId: string,
  fields: string[] = ['formatted_address', 'address_components', 'geometry']
): Promise<google.maps.places.PlaceResult | null> => {
  return new Promise((resolve, reject) => {
    if (!isGoogleMapsLoaded()) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const service = new google.maps.places.PlacesService(document.createElement('div'));

    service.getDetails(
      {
        placeId,
        fields
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Places service failed: ${status}`));
        }
      }
    );
  });
};

/**
 * Extract structured location data from Google Places result
 */
export type LocationData = {
  formatted_address: string;
  city?: string;
  state?: string;
  state_short?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
};

export const extractLocationData = (place: google.maps.places.PlaceResult): LocationData => {
  const locationData: LocationData = {
    formatted_address: place.formatted_address || ''
  };

  // Extract latitude and longitude
  if (place.geometry?.location) {
    locationData.latitude = place.geometry.location.lat();
    locationData.longitude = place.geometry.location.lng();
  }

  // Extract address components
  if (place.address_components) {
    place.address_components.forEach(component => {
      const types = component.types;

      if (types.includes('locality')) {
        locationData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationData.state = component.long_name;
        locationData.state_short = component.short_name;
      } else if (types.includes('country')) {
        locationData.country = component.long_name;
      } else if (types.includes('postal_code')) {
        locationData.postal_code = component.long_name;
      }
    });
  }

  return locationData;
};
