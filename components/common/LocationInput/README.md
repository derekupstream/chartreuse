# LocationInput Component

A React component that provides location autocomplete functionality using Google Places API, designed to work seamlessly with Ant Design forms.

## Features

- ✅ **Google Places API Integration**: Real-time location suggestions
- ✅ **Ant Design Compatible**: Works perfectly with Form.Item
- ✅ **TypeScript Support**: Full type safety
- ✅ **Debounced Search**: Optimized API usage (300ms debounce)
- ✅ **Flexible Types**: Support for cities, regions, establishments, etc.
- ✅ **Country Restrictions**: Limit results to specific countries
- ✅ **Address Breakdown**: Extract city, state, country separately
- ✅ **Error Handling**: Graceful handling of API failures
- ✅ **Free Tier Friendly**: Minimal API usage, stays within Google's free limits

## Quick Start

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project and enable Places API and JS Maps API
3. Generate API key
4. Add to `.env.local`:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 2. Basic Usage

```tsx
import LocationInput from 'components/common/LocationInput';

const MyForm = () => {
  const handleLocationSelect = locationData => {
    console.log('Selected:', locationData);
  };

  return (
    <Form>
      <LocationInput
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
        name='location'
        label='Location'
        placeholder='Enter location...'
        onLocationSelect={handleLocationSelect}
      />
    </Form>
  );
};
```

## Files Created

- `LocationInput.tsx` - Main component
- `index.tsx` - Exports
- `example.tsx` - Usage examples
- `INTEGRATION.md` - Integration guide
- `__tests__/LocationInput.test.tsx` - Jest tests
- `../../lib/googleMaps.ts` - Utility functions

## Cost Information

With a few hundred requests per month, you'll stay **completely free**:

- **Free tier**: $200/month credit (≈40,000 autocomplete requests)
- **Your usage**: <1% of free tier
- **Cost per 1000 requests**: $2.83 (after free tier)

## Integration with ProjectForm

See `INTEGRATION.md` for step-by-step instructions on adding location input to your existing ProjectForm.

## API Reference

### Props

| Prop                    | Type               | Required | Default             | Description                     |
| ----------------------- | ------------------ | -------- | ------------------- | ------------------------------- |
| `apiKey`                | string             | ✅       | -                   | Google Maps API key             |
| `name`                  | string \| string[] | ❌       | -                   | Form field name                 |
| `label`                 | string             | ❌       | -                   | Field label                     |
| `placeholder`           | string             | ❌       | "Enter location..." | Input placeholder               |
| `onLocationSelect`      | function           | ❌       | -                   | Callback when location selected |
| `onChange`              | function           | ❌       | -                   | Callback when input changes     |
| `value`                 | string             | ❌       | -                   | Current value                   |
| `disabled`              | boolean            | ❌       | false               | Whether input is disabled       |
| `types`                 | string[]           | ❌       | ['(cities)']        | Place types to search           |
| `componentRestrictions` | object             | ❌       | -                   | Country restrictions            |
| `showAddressBreakdown`  | boolean            | ❌       | false               | Show address details            |

### LocationData Interface

```typescript
interface LocationData {
  formatted_address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}
```

## Examples

### City Only

```tsx
<LocationInput apiKey={apiKey} types={['(cities)']} placeholder='Enter city...' />
```

### US Locations Only

```tsx
<LocationInput apiKey={apiKey} componentRestrictions={{ country: ['us'] }} placeholder='Enter US location...' />
```

### With Address Breakdown

```tsx
<LocationInput
  apiKey={apiKey}
  showAddressBreakdown={true}
  onLocationSelect={data => {
    console.log(`City: ${data.city}, State: ${data.state}`);
  }}
/>
```

## Testing

Run tests with:

```bash
yarn test LocationInput
```

## Next Steps

1. Get your Google Maps API key
2. Add it to your environment variables
3. Import and use the LocationInput component
4. See `INTEGRATION.md` for ProjectForm integration

The component is production-ready and optimized for your use case!
