# Ticket Fields Update

## New Fields Added

The ticket creation form now includes the following additional fields:

### 1. **Requestor Email ID** (Required)
- **Field Name**: `requestor_email`
- **Type**: Email input
- **Validation**: Valid email format required
- **Purpose**: Capture the email address of the person requesting the ticket

### 2. **Issue Type** (Required)
- **Field Name**: `issue_type`
- **Type**: Dropdown select
- **Options**:
  - Bug
  - Feature Request
  - Support
  - Incident
  - Change Request
  - Other
- **Purpose**: Categorize the type of issue being reported

### 3. **Priority** (Required)
- **Field Name**: `priority`
- **Type**: Dropdown select
- **Options**:
  - Low
  - Medium (default)
  - High
  - Critical
- **Purpose**: Indicate the urgency of the ticket

### 4. **No. of Users Affected** (Required)
- **Field Name**: `users_affected`
- **Type**: Number input
- **Default**: 1
- **Minimum**: 1
- **Purpose**: Track the impact scope of the issue

## Database Changes

### Migration Applied
File: `scripts/04-add-ticket-fields.sql`

```sql
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS requestor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS issue_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS users_affected INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_tickets_requestor_email ON tickets(requestor_email);
```

### Updated Schema
The `tickets` table now includes:
- `requestor_email` - VARCHAR(255)
- `issue_type` - VARCHAR(100)
- `users_affected` - INTEGER (default: 1)

## Code Changes

### 1. Database Types (`lib/db.ts`)
Updated `Ticket` interface to include new fields:
```typescript
export interface Ticket {
  // ... existing fields
  requestor_email: string | null
  issue_type: string | null
  users_affected: number | null
}
```

### 2. Create Ticket Form (`components/create-ticket-form.tsx`)
- Added 4 new form fields in a responsive grid layout
- All new fields are required
- Email validation for requestor_email
- Number validation for users_affected

### 3. Ticket Actions (`app/actions/tickets.ts`)
- Updated `createTicket` function to extract and save new fields
- Added validation for required fields
- Updated INSERT query to include new columns

### 4. Ticket Detail View (`components/ticket-detail.tsx`)
- Added display for requestor email
- Added display for issue type (as a badge)
- Added display for users affected count
- Organized in a clean grid layout

## Form Layout

The new ticket creation form is organized as follows:

```
Title *
Description *

[Requestor Email ID *]  [Issue Type *]
[Priority *]            [No. of Users Affected *]

Attachments
[Create Ticket] [Cancel]
```

## Display in Ticket Details

When viewing a ticket, the new fields are displayed:

**Left Column:**
- Created by
- Assigned to
- Requestor Email

**Right Column:**
- Created date
- Updated date
- Issue Type (badge)
- Users Affected (count)

## Testing

To test the new fields:

1. **Create a new ticket**:
   - Go to `/tickets/new`
   - Fill in all required fields including the new ones
   - Submit the form

2. **View the ticket**:
   - Navigate to the ticket detail page
   - Verify all new fields are displayed correctly

3. **Database verification**:
   ```bash
   psql -U ticket_admin -d service_tickets
   SELECT title, requestor_email, issue_type, users_affected FROM tickets;
   ```

## Future Enhancements

Potential improvements for these fields:

1. **Issue Type Filtering**: Add filter by issue type on tickets list page
2. **Impact Analysis**: Create reports based on users_affected
3. **Email Notifications**: Send notifications to requestor_email
4. **Custom Issue Types**: Allow admins to configure custom issue types
5. **Validation Rules**: Add business rules (e.g., critical priority requires high users_affected)

## Migration for Existing Tickets

Existing tickets in the database will have:
- `requestor_email`: NULL
- `issue_type`: NULL
- `users_affected`: NULL

These can be updated manually or through a data migration script if needed.
