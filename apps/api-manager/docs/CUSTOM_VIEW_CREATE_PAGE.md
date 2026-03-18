# Custom View Create Page Documentation

## Overview

This document describes the implementation of the custom view creation page in the API Manager II application.

## File Structure

```
src/routes/(protected)/account-access/custom-views/
├── +page.svelte                    # List view with "Create View" button
├── +page.server.ts                 # Server-side data loading for list
├── create/
│   ├── +page.svelte                # Create form page
│   └── +page.server.ts             # Server-side data loading for create
└── [view_id]/
    ├── +page.svelte                # Detail view page
    └── +page.server.ts             # Server-side data loading for detail

src/routes/api/obp/banks/[bank_id]/views/
└── +server.ts                      # API endpoint for creating views
```

## Features

### 1. Custom View Creation Form

The create page (`src/routes/(protected)/account-access/custom-views/create/+page.svelte`) includes:

#### Basic Information Section
- **Bank Selection**: Dropdown to select the bank for the custom view
- **Name**: Required field for the view name
- **Description**: Required textarea for view description
- **Metadata View**: Optional field (defaults to "_0")
- **Which Alias to Use**: Optional field for alias specification
- **Is Public**: Checkbox to make the view publicly accessible
- **Hide Metadata if Alias Used**: Checkbox option

#### Transaction Permissions (10 permissions)
- This Bank Account
- Other Bank Account
- Metadata
- Label
- Amount
- Type
- Currency
- Start Date
- Finish Date
- Balance

#### Account Permissions (11 permissions)
- Owners
- Type
- Balance
- Currency
- Label
- National Identifier
- SWIFT BIC
- IBAN
- Number
- Bank Name
- Credit Limit

#### Counterparty Permissions (9 permissions)
- National Identifier
- SWIFT BIC
- IBAN
- Bank Name
- Number
- Metadata
- Kind
- Public Alias
- Private Alias

#### Other Permissions (8 permissions)
- Comments
- Narrative
- Tags
- Images
- More Info
- URL
- Image URL
- Where Tag

#### Write Permissions (10 permissions)
- Add Comment
- Delete Comment
- Add Tag
- Delete Tag
- Add Image
- Delete Image
- Edit Narrative
- Create Counterparty
- Transaction Request (Own)
- Transaction Request (Any)

### 2. User Experience Features

#### Bulk Selection
Each permission category has "Select All" and "Deselect All" buttons for quick management.

#### Form Validation
- Real-time validation for required fields (Bank, Name, Description)
- Visual feedback for validation errors
- Submit button disabled when form is invalid

#### Visual Feedback
- Loading states during submission
- Success message on successful creation
- Error messages for failed operations
- Automatic redirect to the new view's detail page after creation

#### Responsive Design
- Mobile-friendly layout
- Permission checkboxes arranged in responsive grid
- Collapsible sections on smaller screens

### 3. Security Features

#### Role-Based Access Control
- Requires `CanCreateCustomView` entitlement
- Uses `PageRoleCheck` component to verify permissions
- Shows `MissingRoleAlert` if user lacks required permissions

#### Authentication
- Requires valid OAuth session
- Access token validated on both client and server side

### 4. API Integration

#### Server-Side Data Loading (`+page.server.ts`)
```typescript
export const load: PageServerLoad = async ({ locals }) => {
  // Validates user session
  // Fetches available banks
  // Returns required roles for permission checking
  // Returns user entitlements
};
```

#### API Endpoint (`/api/obp/banks/[bank_id]/views`)
```typescript
export const POST: RequestHandler = async ({ locals, params, request }) => {
  // Validates OAuth session
  // Parses request body
  // Builds OBP API payload
  // Creates custom view via OBP API
  // Returns created view or error
};
```

## API Payload Structure

The custom view creation payload sent to the OBP API includes:

```json
{
  "name": "string (required)",
  "description": "string (required)",
  "is_public": "boolean",
  "metadata_view": "string",
  "which_alias_to_use": "string",
  "hide_metadata_if_alias_used": "boolean",
  "allowed_actions": [],
  "can_see_transaction_this_bank_account": [],
  "can_see_transaction_other_bank_account": [],
  // ... all other permission fields as arrays
}
```

Each enabled permission is sent as an empty array `[]` to indicate it's available.

## Navigation Flow

1. **List Page** → "Create View" button
2. **Create Page** → Fill form and submit
3. **Success** → Auto-redirect to new view's detail page
4. **Cancel** → Return to list page

## Styling

The page uses consistent styling with the rest of the application:

- **Light/Dark Mode**: Full support with CSS custom properties
- **Colors**: Uses the application's color palette
- **Layout**: Responsive grid system
- **Components**: Reusable button and form styles

## Error Handling

### Client-Side
- Form validation errors displayed above submit button
- Individual field validation on blur
- Network errors caught and displayed

### Server-Side
- Missing authentication returns 401
- Invalid bank_id returns 400
- OBP API errors passed through with appropriate status codes
- All errors logged with `createLogger`

## Usage Example

1. Navigate to `/account-access/custom-views`
2. Click "Create View" button
3. Select a bank from the dropdown
4. Enter view name and description
5. Select desired permissions by category
6. Use "Select All" buttons for quick selection
7. Review write permissions warning
8. Click "Create Custom View"
9. Wait for success message
10. Automatically redirected to the new view's detail page

## Testing Checklist

- [ ] Form validation works for required fields
- [ ] All permission checkboxes can be toggled
- [ ] "Select All" / "Deselect All" buttons work for each category
- [ ] Form submission creates the view successfully
- [ ] Error messages display correctly
- [ ] Success redirect works
- [ ] Cancel button returns to list page
- [ ] Dark mode styling displays correctly
- [ ] Mobile responsive layout works
- [ ] Role-based access control enforced
- [ ] API error handling works properly

## Future Enhancements

Potential improvements for future versions:

1. **Permission Templates**: Preset permission configurations for common use cases
2. **Copy Existing View**: Create new view based on existing configuration
3. **Validation Rules**: More sophisticated validation for permission combinations
4. **Bulk Operations**: Create multiple views at once
5. **Import/Export**: Save and load view configurations
6. **Permission Descriptions**: Tooltips explaining each permission
7. **Preview Mode**: Preview what users will see with selected permissions
8. **Audit Trail**: Track who created which views and when

## Related Components

- `PageRoleCheck`: Validates user has required entitlements
- `MissingRoleAlert`: Displays when user lacks permissions
- `obp_requests`: HTTP client for OBP API calls
- `SessionOAuthHelper`: OAuth session management

## References

- OBP API Documentation: `/obp/v6.0.0/banks/{bank_id}/views` (POST)
- SvelteKit Form Actions: https://kit.svelte.dev/docs/form-actions
- Lucide Icons: https://lucide.dev/
