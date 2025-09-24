import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AutoComplete, Form, Input, Space, Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import {
  loadGoogleMapsApi,
  isGoogleMapsLoaded,
  getPlaceDetails,
  extractLocationData,
  LocationData
} from '../../../lib/googleMaps';

const { Text } = Typography;

export interface LocationInputProps {
  /**
   * Google Maps API key
   */
  apiKey: string;
  /**
   * Form field name for the location input
   */
  name?: string | string[];
  /**
   * Label for the form field
   */
  label?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Callback when location is selected
   */
  onLocationSelect?: (locationData: LocationData) => void;
  /**
   * Callback when input value changes
   */
  onChange?: (value: string) => void;
  /**
   * Current value
   */
  value?: string;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Types of places to search for
   * @default ['(cities)']
   */
  types?: string[];
  /**
   * Country restrictions (ISO 3166-1 Alpha-2 country codes)
   * @example ['us', 'ca']
   */
  componentRestrictions?: { country: string | string[] };
  /**
   * Whether to show detailed address breakdown
   */
  showAddressBreakdown?: boolean;
}

interface AutocompleteOption {
  value: string;
  label: React.ReactNode;
  placeId: string;
  description: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  apiKey,
  name,
  label,
  placeholder = 'Enter location...',
  onLocationSelect,
  onChange,
  value,
  disabled = false,
  types = ['(cities)'],
  componentRestrictions,
  showAddressBreakdown = false
}) => {
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load Google Maps API on component mount
  useEffect(() => {
    if (!apiKey) {
      console.error('LocationInput: Google Maps API key is required');
      return;
    }

    const initApi = async () => {
      try {
        await loadGoogleMapsApi(apiKey);
        setApiLoaded(true);
        autocompleteService.current = new google.maps.places.AutocompleteService();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    if (!isGoogleMapsLoaded()) {
      initApi();
    } else {
      setApiLoaded(true);
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [apiKey]);

  // Debounced search function
  const handleSearch = useCallback(
    (searchValue: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (!searchValue.trim() || !apiLoaded || !autocompleteService.current) {
          setOptions([]);
          return;
        }

        setLoading(true);

        const request: google.maps.places.AutocompletionRequest = {
          input: searchValue,
          types
        };

        if (componentRestrictions) {
          request.componentRestrictions = componentRestrictions;
        }

        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          setLoading(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const newOptions: AutocompleteOption[] = predictions.map(prediction => ({
              value: prediction.description,
              label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <div>
                    <div>{prediction.structured_formatting.main_text}</div>
                    <Text type='secondary' style={{ fontSize: '12px' }}>
                      {prediction.structured_formatting.secondary_text}
                    </Text>
                  </div>
                </div>
              ),
              placeId: prediction.place_id,
              description: prediction.description
            }));

            setOptions(newOptions);
          } else {
            setOptions([]);
          }
        });
      }, 300); // 300ms debounce
    },
    [apiLoaded, types, componentRestrictions]
  );

  // Handle option selection
  const handleSelect = async (selectedValue: string, option: AutocompleteOption) => {
    setLoading(true);
    try {
      const place = await getPlaceDetails(option.placeId);
      if (place) {
        const locationData = extractLocationData(place);
        setSelectedLocation(locationData);

        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      }
    } catch (error) {
      console.error('Failed to get place details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    }

    // Clear selected location if input is manually changed
    if (selectedLocation && newValue !== selectedLocation.formatted_address) {
      setSelectedLocation(null);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const autocompleteElement = (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onChange={handleChange}
      disabled={disabled || !apiLoaded}
      placeholder={apiLoaded ? placeholder : 'Loading Google Maps...'}
      filterOption={false}
      notFoundContent={loading ? 'Searching...' : 'No locations found'}
    >
      <Input prefix={<EnvironmentOutlined />} suffix={loading ? '...' : null} allowClear />
    </AutoComplete>
  );

  const formElement = name ? (
    <Form.Item label={label} name={name}>
      {autocompleteElement}
    </Form.Item>
  ) : (
    autocompleteElement
  );

  if (!showAddressBreakdown || !selectedLocation) {
    return formElement;
  }

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {formElement}
      {selectedLocation && (
        <div
          style={{
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: '6px',
            fontSize: '12px'
          }}
        >
          <Text type='secondary'>Selected Location:</Text>
          <div style={{ marginTop: '4px' }}>
            {selectedLocation.city && (
              <div>
                <strong>City:</strong> {selectedLocation.city}
              </div>
            )}
            {selectedLocation.state && (
              <div>
                <strong>State/Region:</strong> {selectedLocation.state}
              </div>
            )}
            {selectedLocation.country && (
              <div>
                <strong>Country:</strong> {selectedLocation.country}
              </div>
            )}
            {selectedLocation.latitude && selectedLocation.longitude && (
              <div>
                <strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(6)},{' '}
                {selectedLocation.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      )}
    </Space>
  );
};

export default LocationInput;
