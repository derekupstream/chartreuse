# Auth Migration Guide: Firebase ↔ Supabase

This guide explains how to switch between Firebase and Supabase authentication with minimal code changes.

## Architecture Overview

We use an **Adapter Pattern** that abstracts authentication logic behind a common interface:

```
Your Code → AuthAdapter → (Firebase | Supabase)
```

## Quick Switch

### 1. Environment Variables

**For Firebase:**
```env
AUTH_PROVIDER=firebase
FIREBASE_CONFIG=your_firebase_config
```

**For Supabase:**
```env
AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 2. Code Changes

**No code changes needed!** The adapter handles everything automatically.

## Implementation Details

### Firebase Implementation
- Uses Firebase Admin SDK on server
- Uses Firebase Client SDK on client
- ID tokens for authentication
- Real-time auth state changes

### Supabase Implementation  
- Uses Supabase client library
- JWT tokens for authentication
- Real-time auth state changes via subscriptions

## Data Migration

### User Data
Both systems store similar user data:
- `id` (Firebase UID vs Supabase UUID)
- `email` 
- `name`/display name
- Custom metadata

### Migration Strategy
1. Export users from Firebase
2. Transform to Supabase format
3. Import to Supabase
4. Update user IDs in your database

## For Your Developer

### When Deploying to Production
1. Set `AUTH_PROVIDER=firebase` in production
2. Use existing Firebase configuration
3. No code changes needed

### When Testing New Features
1. Set `AUTH_PROVIDER=supabase` in development
2. Use Supabase configuration
3. Test new auth-dependent features

### Porting Features Back
Since the interface is identical, any auth-dependent code works with both providers:

```typescript
// This works with both Firebase and Supabase
const user = await authAdapter.signIn(email, password)
const currentUser = await authAdapter.getCurrentUser()
```

## Benefits

✅ **Zero-downtime switching** - Change environment variable only  
✅ **Identical API** - No code changes required  
✅ **Easy testing** - Develop with Supabase, deploy with Firebase  
✅ **Modular** - Add new auth providers easily  
✅ **Type safety** - Full TypeScript support  

## Adding New Auth Providers

1. Implement `AuthAdapter` interface
2. Add to factory function
3. Add environment variable option
4. Done!
