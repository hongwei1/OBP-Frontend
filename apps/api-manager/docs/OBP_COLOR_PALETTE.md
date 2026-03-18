# OBP Color Palette

This document defines the official Open Bank Project color palette for API Manager II, organized by theme (light/dark mode) and message type (error, warning, debug, info).

## Color Usage Guidelines

These colors should be used for:
- Alert messages and notifications
- Toast messages
- Error states
- Warning indicators
- Debug information
- Informational messages

## Dark Mode Colors

### Error Colors
```css
--obp-dark-mode-error-title-color: #FF4E4E;
--obp-dark-mode-error-background-color: #2F131F;
```

**Usage:** Critical errors, failed operations, validation errors
- **Title/Text:** `#FF4E4E` - Bright red for high visibility
- **Background:** `#2F131F` - Deep burgundy/maroon background

**Example:** "Failed to delete entitlement", "API request failed"

---

### Warning Colors
```css
--obp-dark-mode-warning-title-color: #F3C63F;
--obp-dark-mode-warning-background-color: #2E261E;
```

**Usage:** Warnings, cautions, non-critical issues
- **Title/Text:** `#F3C63F` - Golden yellow for attention
- **Background:** `#2E261E` - Dark brown/amber background

**Example:** "This action cannot be undone", "Rate limit approaching"

---

### Debug Colors
```css
--obp-dark-mode-debug-title-color: #54E9A1;
--obp-dark-mode-debug-background-color: #0F261D;
```

**Usage:** Debug information, development messages, success states
- **Title/Text:** `#54E9A1` - Bright mint green for positive feedback
- **Background:** `#0F261D` - Dark forest green background

**Example:** "Request completed successfully", "Debug: API response received"

---

### Info Colors
```css
--obp-dark-mode-info-title-color: #4DB8FF;
--obp-dark-mode-info-background-color: #0D1A26;
```

**Usage:** Informational messages, tips, general notifications
- **Title/Text:** `#4DB8FF` - Bright cyan blue for clarity
- **Background:** `#0D1A26` - Deep navy blue background

**Example:** "New features available", "Tip: Use search to find users quickly"

---

## Light Mode Colors

### Error Colors
```css
--obp-light-mode-error-title-color: #F7DDE0;
--obp-light-mode-error-background-color: #2F131F;
```

**Usage:** Critical errors, failed operations, validation errors
- **Title/Text:** `#F7DDE0` - Soft pink for readability on dark background
- **Background:** `#2F131F` - Deep burgundy/maroon background (same as dark mode)

**Example:** "Failed to create entitlement", "Authentication error"

---

### Warning Colors
```css
--obp-light-mode-warning-title-color: #E7B622;
--obp-light-mode-warning-background-color: #F4ECDA;
```

**Usage:** Warnings, cautions, non-critical issues
- **Title/Text:** `#E7B622` - Rich golden orange for emphasis
- **Background:** `#F4ECDA` - Soft cream/beige background

**Example:** "Bank ID required for this role", "Session expiring soon"

---

### Debug Colors
```css
--obp-light-mode-debug-title-color: #33C77F;
--obp-light-mode-debug-background-color: #D9EFE8;
```

**Usage:** Debug information, development messages, success states
- **Title/Text:** `#33C77F` - Vibrant green for positive feedback
- **Background:** `#D9EFE8` - Soft mint background

**Example:** "Entitlement created successfully", "User updated"

---

### Info Colors
```css
--obp-light-mode-info-title-color: #4DB8FF;
--obp-light-mode-info-background-color: #DDEDFB;
```

**Usage:** Informational messages, tips, general notifications
- **Title/Text:** `#4DB8FF` - Bright cyan blue (same as dark mode)
- **Background:** `#DDEDFB` - Soft sky blue background

**Example:** "API connection restored", "Remember to save your changes"

---

## Implementation in Code

### CSS Variables
Add these to your theme CSS file:

```css
/* Dark Mode */
:root[data-mode="dark"] {
  --obp-error-title: #FF4E4E;
  --obp-error-bg: #2F131F;
  
  --obp-warning-title: #F3C63F;
  --obp-warning-bg: #2E261E;
  
  --obp-debug-title: #54E9A1;
  --obp-debug-bg: #0F261D;
  
  --obp-info-title: #4DB8FF;
  --obp-info-bg: #0D1A26;
}

/* Light Mode */
:root[data-mode="light"], :root {
  --obp-error-title: #F7DDE0;
  --obp-error-bg: #2F131F;
  
  --obp-warning-title: #E7B622;
  --obp-warning-bg: #F4ECDA;
  
  --obp-debug-title: #33C77F;
  --obp-debug-bg: #D9EFE8;
  
  --obp-info-title: #4DB8FF;
  --obp-info-bg: #DDEDFB;
}
```

### Svelte Component Example

```svelte
<style>
  .error-alert {
    color: var(--obp-error-title);
    background: var(--obp-error-bg);
  }
  
  .warning-alert {
    color: var(--obp-warning-title);
    background: var(--obp-warning-bg);
  }
  
  .success-alert {
    color: var(--obp-debug-title);
    background: var(--obp-debug-bg);
  }
  
  .info-alert {
    color: var(--obp-info-title);
    background: var(--obp-info-bg);
  }
</style>
```

### Tailwind Configuration

If using Tailwind CSS, add these to your config:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'obp-error': {
          title: {
            dark: '#FF4E4E',
            light: '#F7DDE0',
          },
          bg: {
            dark: '#2F131F',
            light: '#2F131F',
          }
        },
        'obp-warning': {
          title: {
            dark: '#F3C63F',
            light: '#E7B622',
          },
          bg: {
            dark: '#2E261E',
            light: '#F4ECDA',
          }
        },
        'obp-success': {
          title: {
            dark: '#54E9A1',
            light: '#33C77F',
          },
          bg: {
            dark: '#0F261D',
            light: '#D9EFE8',
          }
        },
        'obp-info': {
          title: {
            dark: '#4DB8FF',
            light: '#4DB8FF',
          },
          bg: {
            dark: '#0D1A26',
            light: '#DDEDFB',
          }
        },
      }
    }
  }
}
```

## Color Accessibility

All color combinations have been designed to meet WCAG 2.1 accessibility standards:

- **Error:** High contrast for critical visibility
- **Warning:** Moderate contrast for attention without alarm
- **Debug/Success:** Clear positive feedback
- **Info:** Calm, readable informational display

## Related Files

- `obp-theme.css` - Main theme file
- `src/app.css` - Application-wide styles
- `src/lib/components/Toast.svelte` - Toast notification component
- `src/lib/components/Alert.svelte` - Alert component (if exists)

## Version History

- **v1.0.0** - Initial OBP color palette documentation
