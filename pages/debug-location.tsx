/**
 * Debug page for testing LocationInput component
 * Navigate to /debug-location to test the component
 */

import React from 'react';
import { Form, Card, Typography, Space, Button } from 'antd';
import LocationInput from '../components/common/LocationInput';
import type { LocationData } from '../components/common/LocationInput';

const { Title, Paragraph, Text } = Typography;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const DebugLocationPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleLocationSelect = (locationData: LocationData) => {
    console.log('Debug: Selected location:', locationData);
  };

  const handleFormSubmit = (values: any) => {
    console.log('Debug: Form submitted with values:', values);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>LocationInput Debug Page</Title>

      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Environment Check</Title>
        <Space direction='vertical'>
          <Text>
            <strong>Google Maps API Key:</strong> {GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}
          </Text>
          {GOOGLE_MAPS_API_KEY && (
            <Text>
              <strong>Key Preview:</strong> {GOOGLE_MAPS_API_KEY.substring(0, 10)}...
            </Text>
          )}
          <Text>
            <strong>Window.google:</strong>{' '}
            {typeof window !== 'undefined' && (window as any).google ? '✅ Loaded' : '❌ Not Loaded'}
          </Text>
        </Space>
      </Card>

      {!GOOGLE_MAPS_API_KEY && (
        <Card style={{ marginBottom: '24px', border: '1px solid #ff4d4f' }}>
          <Title level={4} type='danger'>
            ⚠️ API Key Missing
          </Title>
          <Paragraph>
            Please add your Google Maps API key to your <Text code>.env</Text> file:
          </Paragraph>
          <Text code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here</Text>
        </Card>
      )}

      <Card>
        <Title level={4}>Test LocationInput Component</Title>
        <Paragraph>Open your browser's developer console (F12) to see debug logs.</Paragraph>

        <Form form={form} layout='vertical' onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
          <LocationInput
            apiKey={GOOGLE_MAPS_API_KEY}
            name='testLocation'
            label='Test Location Input'
            placeholder='Try typing a city name...'
            onLocationSelect={handleLocationSelect}
            showAddressBreakdown={true}
            types={['(cities)']}
          />

          <Form.Item name='testCity' style={{ display: 'none' }}>
            <input />
          </Form.Item>
          <Form.Item name='testState' style={{ display: 'none' }}>
            <input />
          </Form.Item>
          <Form.Item name='testCountry' style={{ display: 'none' }}>
            <input />
          </Form.Item>

          <Button type='primary' htmlType='submit'>
            Test Submit
          </Button>
        </Form>
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Debug Instructions</Title>
        <ol>
          <li>Open browser developer console (F12)</li>
          <li>Go to Console tab</li>
          <li>Type in the location input above</li>
          <li>Check console logs for debug information</li>
          <li>Look for network requests in Network tab</li>
        </ol>

        <Title level={5} style={{ marginTop: '16px' }}>
          Expected Console Logs:
        </Title>
        <ul>
          <li>
            <Text code>LocationInput: Initializing with API key: Present</Text>
          </li>
          <li>
            <Text code>GoogleMaps: loadGoogleMapsApi called with key: Present</Text>
          </li>
          <li>
            <Text code>LocationInput: handleSearch called with: [your input]</Text>
          </li>
          <li>
            <Text code>LocationInput: Making API request...</Text>
          </li>
          <li>
            <Text code>LocationInput: API response status: OK</Text>
          </li>
        </ul>

        <Title level={5} style={{ marginTop: '16px' }}>
          Network Requests:
        </Title>
        <Paragraph>
          You should see requests to <Text code>maps.googleapis.com</Text> in the Network tab.
        </Paragraph>
      </Card>
    </div>
  );
};

export default DebugLocationPage;
