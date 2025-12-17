# Persistent Storage System

This document explains the persistent storage system implemented to maintain app state across browser refreshes.

## Overview

The persistent storage system automatically saves and restores application state using localStorage, ensuring users don't lose their work when refreshing the browser or closing/reopening tabs.

## Features

- **Automatic Persistence**: State is automatically saved when changed
- **Type Safety**: Full TypeScript support with proper typing
- **TTL Support**: Optional time-to-live for expiring data
- **Error Handling**: Graceful fallbacks when localStorage fails
- **User Data Management**: Automatic cleanup on logout

## Components

### 1. Storage Utility (`src/utils/storage.ts`)

Core utility for localStorage operations with advanced features:

```typescript
import { persistentState } from '@/utils/storage';

// Save form data with 24-hour expiration
persistentState.saveFormState('new_request_form', formData);

// Load with default value
const data = persistentState.loadFormState('new_request_form', defaultData);

// Clear specific data
persistentState.clearFormState('new_request_form');
```

### 2. React Hooks (`src/hooks/usePersistentState.ts`)

Easy-to-use React hooks for persistent state:

```typescript
import { usePersistentState, usePersistentFormState, useUserPreference } from '@/hooks/usePersistentState';

// Basic persistent state
const [value, setValue, clearValue] = usePersistentState('key', defaultValue);

// Form-specific state (auto-cleared on submit)
const [formData, setFormData, clearForm] = usePersistentFormState('form_id', initialData);

// User preferences (never expire)
const [theme, setTheme] = useUserPreference('theme', 'light');
```

## Current Persistent Data

### Service Request Form
- **Form Data**: All input fields and selections
- **Current Step**: Which step the user was on in the multi-step form
- **Timeline Steps**: Custom repair timeline entries
- **Auto-cleared**: Data is cleared when form is successfully submitted

### Dashboard
- **Search Query**: Last search term entered
- **Filter Settings**: Any active filters (future enhancement)

### User Preferences
- **Username**: Display name for greetings
- **Profile Image**: User avatar
- **Theme**: Light/dark mode preference

### Authentication
- **Session Data**: Login state and user information
- **Auto-cleanup**: All user data cleared on logout

## Usage Examples

### Adding Persistent State to a Component

```typescript
import { usePersistentState } from '@/hooks/usePersistentState';

function MyComponent() {
  const [count, setCount] = usePersistentState('my_count', 0);
  const [settings, setSettings] = usePersistentState('my_settings', { theme: 'light' });

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

### Form Persistence

```typescript
import { usePersistentFormState } from '@/hooks/usePersistentState';

function MyForm() {
  const [formData, setFormData] = usePersistentFormState('contact_form', {
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async () => {
    await submitForm(formData);
    // Form state is automatically cleared on successful submission
  };
}
```

### User Preferences

```typescript
import { useUserPreference } from '@/hooks/usePersistentState';

function ThemeToggle() {
  const [theme, setTheme] = useUserPreference('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

## Data Management

### Automatic Cleanup
- Form data is cleared when forms are successfully submitted
- All user data is cleared when user logs out
- Expired data is automatically removed (TTL support)

### Manual Cleanup
```typescript
import { persistentState } from '@/utils/storage';

// Clear specific data
persistentState.clearFormState('form_id');
persistentState.clearUserData(); // Clears all user data
persistentState.clearAllData(); // Clears everything
```

## Best Practices

1. **Use Appropriate Hooks**:
   - `usePersistentState` for general app state
   - `usePersistentFormState` for form data (auto-cleared on submit)
   - `useUserPreference` for user settings (never expire)

2. **TTL for Sensitive Data**:
   - Use TTL for temporary data like form drafts
   - Don't use TTL for user preferences

3. **Error Handling**:
   - The system handles localStorage errors gracefully
   - Components work even if persistence fails

4. **Data Structure**:
   - Store serializable data only (no functions, DOM elements)
   - Use meaningful keys to avoid conflicts

## Browser Compatibility

- Modern browsers with localStorage support
- Graceful degradation if localStorage is unavailable
- No cookies or server-side storage required

## Security Notes

- All data is stored client-side only
- Sensitive data should still be validated server-side
- User data is cleared on logout for privacy
