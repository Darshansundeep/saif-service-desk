# Admin Panel Documentation

## Overview

The Admin Panel provides comprehensive tools for system administrators to manage users, generate reports, and monitor system performance.

## Access

**URL**: `/admin`

**Requirements**:
- Must be logged in
- Must have `admin` role
- Non-admin users are automatically redirected to `/tickets`

## Features

### 1. **User Management** (`/admin/users`)

Manage all user accounts in the system.

#### Capabilities:
- ✅ View all users with their roles and details
- ✅ Change user roles (Customer, Agent, Admin)
- ✅ Delete user accounts
- ✅ View user statistics (total users by role)
- ✅ Add new users (coming soon)

#### User Statistics Dashboard:
- **Total Users**: Count of all registered users
- **Admins**: Number of admin accounts
- **Agents**: Number of agent accounts
- **Customers**: Number of customer accounts

#### User Table Features:
- Email and full name display
- Role badges with color coding
- Created date
- Inline role editing
- Delete functionality
- Protection against self-modification

#### Role Management:
- **Customer** → Can create and view own tickets
- **Agent** → Can view all tickets, assign, and update status
- **Admin** → Full system access including user management

#### Safety Features:
- Cannot change your own role
- Cannot delete your own account
- Confirmation dialog before deletion
- All tickets remain in system after user deletion

---

### 2. **Reports & Analytics** (`/admin/reports`)

Comprehensive reporting dashboard with system-wide statistics.

#### Overview Metrics:
- **Total Tickets**: All tickets in the system
- **Open Tickets**: Currently open tickets
- **In Progress**: Tickets being worked on
- **Resolved**: Completed tickets

#### User Impact Analysis:
- **Total Users Affected**: Sum of all users_affected across tickets
- **Average per Ticket**: Mean users affected per ticket
- **Maximum Impact**: Highest single-ticket impact

#### Priority Distribution:
- Visual breakdown of tickets by priority (Low, Medium, High, Critical)
- Progress bars showing relative distribution
- Count for each priority level

#### Issue Type Distribution:
- Tickets categorized by issue type
- Visual representation with progress bars
- Counts for each category:
  - Bug
  - Feature Request
  - Support
  - Incident
  - Change Request
  - Other

#### Agent Performance:
- **Assigned Tickets**: Total tickets assigned to each agent
- **Resolved Tickets**: Number resolved by agent
- **Closed Tickets**: Number closed by agent
- **Resolution Rate**: Percentage of assigned tickets resolved

#### Recent Activity:
- Last 10 tickets created
- Shows title, creator, status, and priority
- Quick overview of recent system activity

#### Export Functionality:
- **Export to CSV**: Download report data
- Includes all overview metrics
- Timestamped filename
- Easy to open in Excel/Google Sheets

---

### 3. **Analytics** (`/admin/analytics`)

*Coming Soon*
- Ticket trends over time
- Response time analytics
- SLA compliance tracking
- Custom date range reports

---

### 4. **System Settings** (`/admin/settings`)

*Coming Soon*
- Email notification configuration
- System-wide settings
- Custom issue types
- SLA definitions

---

## Navigation

### Access Admin Panel:
1. Login as admin user
2. Click "Admin Panel" button in header (visible only to admins)
3. Select desired admin function from dashboard

### Admin Panel Dashboard Cards:
- **User Management** - Blue icon
- **Reports** - Green icon
- **Analytics** - Purple icon
- **System Settings** - Orange icon

---

## User Management Workflows

### Change User Role:
1. Go to `/admin/users`
2. Click "Edit" icon next to user
3. Select new role from dropdown
4. Role updates immediately
5. User's permissions change on next login

### Delete User:
1. Go to `/admin/users`
2. Click "Delete" (trash) icon
3. Confirm deletion in dialog
4. User is permanently removed
5. Their tickets remain in system

### View User Statistics:
- Statistics cards at top of user management page
- Real-time counts by role
- Total user count

---

## Reports Workflows

### View System Reports:
1. Go to `/admin/reports`
2. Scroll through different report sections
3. View metrics, charts, and tables

### Export Report:
1. Go to `/admin/reports`
2. Click "Export Report" button (top right)
3. CSV file downloads automatically
4. Open in spreadsheet application

### Analyze Agent Performance:
1. Go to `/admin/reports`
2. Scroll to "Agent Performance" section
3. View table with agent statistics
4. Sort by resolution rate or ticket count

---

## Database Queries

The admin panel uses optimized SQL queries:

### User Statistics:
```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
```

### Ticket Statistics:
```sql
SELECT 
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as new_tickets,
  -- ... other status counts
FROM tickets
```

### Agent Performance:
```sql
SELECT 
  u.full_name,
  COUNT(t.id) as assigned_tickets,
  COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets
FROM users u
LEFT JOIN tickets t ON u.id = t.assigned_to
WHERE u.role IN ('agent', 'admin')
GROUP BY u.id, u.full_name
```

---

## Security

### Access Control:
- ✅ Admin-only routes protected by middleware
- ✅ Role verification on every request
- ✅ Non-admin users redirected automatically

### Data Protection:
- ✅ Cannot modify own admin account
- ✅ Confirmation required for destructive actions
- ✅ Audit trail via updated_at timestamps

### Best Practices:
- Always have at least 2 admin accounts
- Regularly review user roles
- Monitor agent performance metrics
- Export reports for compliance

---

## Color Coding

### Roles:
- **Admin**: Red badge
- **Agent**: Blue badge
- **Customer**: Green badge

### Status:
- **New**: Blue
- **Open**: Green
- **In Progress**: Yellow
- **Resolved**: Purple
- **Closed**: Gray

### Priority:
- **Low**: Gray
- **Medium**: Blue
- **High**: Orange
- **Critical**: Red

---

## Future Enhancements

### Planned Features:
1. **Bulk User Operations**
   - Import users from CSV
   - Bulk role changes
   - Bulk user deletion

2. **Advanced Reports**
   - Custom date ranges
   - Scheduled report generation
   - Email report delivery
   - PDF export

3. **User Activity Logs**
   - Track user actions
   - Login history
   - Audit trail

4. **System Configuration**
   - Custom issue types
   - Email templates
   - SLA definitions
   - Notification settings

5. **Dashboard Widgets**
   - Customizable admin dashboard
   - Real-time metrics
   - Alert notifications

---

## Troubleshooting

### Cannot Access Admin Panel:
- Verify you're logged in as admin
- Check user role in database
- Clear browser cache and cookies

### User Role Not Updating:
- Refresh the page
- Check database directly
- Verify admin permissions

### Reports Not Loading:
- Check database connection
- Verify tickets exist in database
- Check browser console for errors

---

## Testing

### Test User Management:
1. Create test user account
2. Change role to agent
3. Verify permissions changed
4. Change back to customer
5. Delete test account

### Test Reports:
1. Create several test tickets
2. Assign to different agents
3. Update statuses
4. View reports to verify data

---

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check application logs
4. Contact system administrator

---

**Last Updated**: October 19, 2025
**Version**: 1.0
