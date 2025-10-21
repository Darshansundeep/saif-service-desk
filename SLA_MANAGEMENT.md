# SLA Management System

## Overview

The SLA (Service Level Agreement) Management system automatically tracks response and resolution times for all tickets based on their priority level. This ensures your service desk meets committed service levels and helps identify tickets at risk of breaching SLA.

## Features

### ✅ Automatic SLA Tracking
- **Auto-assignment**: SLA policies automatically assigned based on ticket priority
- **Response Time**: Tracks time to first agent response
- **Resolution Time**: Tracks time to ticket resolution
- **Business Hours**: Supports business hours-only calculations
- **Real-time Monitoring**: Live SLA status on every ticket

### ✅ SLA Policies by Priority

| Priority | Response Time | Resolution Time | Escalation Time |
|----------|---------------|-----------------|-----------------|
| Critical | 15 minutes    | 4 hours         | 2 hours         |
| High     | 1 hour        | 8 hours         | 4 hours         |
| Medium   | 4 hours       | 24 hours        | 12 hours        |
| Low      | 8 hours       | 48 hours        | -               |

### ✅ SLA Status Indicators

- **🟢 Met**: SLA was met successfully
- **🔵 Pending**: SLA in progress, on track
- **🟠 At Risk**: >80% of time elapsed, approaching breach
- **🔴 Breached**: SLA deadline passed

### ✅ Automatic Triggers

1. **Ticket Created** → SLA tracking starts automatically
2. **First Agent Comment** → Response SLA recorded
3. **Ticket Resolved/Closed** → Resolution SLA recorded
4. **SLA Breach** → Logged in breach history

## Database Schema

### Tables Created

1. **sla_policies** - SLA policy definitions
2. **ticket_sla_tracking** - Per-ticket SLA tracking
3. **sla_breach_history** - Audit trail of breaches
4. **business_hours** - Business hours configuration
5. **holidays** - Holiday calendar

### Automatic Triggers

- ✅ Auto-create SLA tracking on ticket creation
- ✅ Auto-update on first response
- ✅ Auto-update on resolution
- ✅ Auto-log breaches

## Setup Instructions

### 1. Run Database Migration

```bash
psql -U postgres -d service_tickets -f scripts/09-create-sla-management.sql
```

This will:
- Create all SLA tables
- Insert default SLA policies
- Set up business hours (Mon-Fri, 9 AM - 5 PM)
- Create automatic triggers

### 2. Verify Installation

Check that tables were created:

```sql
SELECT * FROM sla_policies;
SELECT * FROM business_hours;
```

### 3. Test SLA Tracking

1. Create a new ticket
2. Check that SLA tracking was created:
```sql
SELECT * FROM ticket_sla_tracking WHERE ticket_id = 'your-ticket-id';
```

## Usage

### For Agents

#### View SLA on Ticket
1. Open any ticket
2. See SLA section at top showing:
   - Response SLA status and countdown
   - Resolution SLA status and countdown
   - Progress bars
   - Applied policy

#### Monitor SLA Dashboard
1. Go to **Admin Panel** → **SLA Management**
2. View:
   - Overall compliance rates
   - Breached tickets list
   - At-risk tickets list
   - Average response/resolution times

### For Admins

#### Configure SLA Policies
```sql
-- Update existing policy
UPDATE sla_policies
SET response_time_minutes = 30,
    resolution_time_minutes = 480
WHERE priority = 'high';

-- Create custom policy
INSERT INTO sla_policies (name, description, priority, response_time_minutes, resolution_time_minutes)
VALUES ('VIP Customer SLA', 'For VIP customers', 'high', 10, 120);
```

#### Configure Business Hours
```sql
-- Update business hours
UPDATE business_hours
SET start_time = '08:00:00',
    end_time = '18:00:00'
WHERE day_of_week = 1; -- Monday

-- Disable weekend work
UPDATE business_hours
SET is_working_day = FALSE
WHERE day_of_week IN (0, 6); -- Sunday, Saturday
```

#### Add Holidays
```sql
INSERT INTO holidays (name, date, is_recurring)
VALUES 
  ('New Year', '2025-01-01', TRUE),
  ('Christmas', '2025-12-25', TRUE),
  ('Independence Day', '2025-07-04', TRUE);
```

## SLA Calculations

### Response Time
- **Starts**: When ticket is created
- **Ends**: When first agent/admin adds a comment
- **Status**: Met if first response before due time

### Resolution Time
- **Starts**: When ticket is created
- **Ends**: When ticket status changes to 'resolved' or 'closed'
- **Status**: Met if resolved before due time

### Business Hours Mode
When `business_hours_only = TRUE`:
- Only counts time during business hours
- Pauses timer outside business hours
- Excludes holidays
- Currently simplified (can be enhanced)

## SLA Dashboard

### Access
**Admin Panel** → **SLA Management**

### Metrics Displayed

1. **Response Compliance Rate**
   - Percentage of tickets meeting response SLA
   - Met vs breached count

2. **Resolution Compliance Rate**
   - Percentage of tickets meeting resolution SLA
   - Met vs breached count

3. **Active Breaches**
   - Count of currently breached tickets
   - Breakdown by type (response/resolution)

4. **Average Times**
   - Average response time
   - Average resolution time

### Ticket Lists

1. **Breached Tickets**
   - Tickets that missed SLA deadline
   - Sorted by breach severity
   - Quick link to ticket

2. **At Risk Tickets**
   - Tickets >80% through SLA time
   - Time remaining shown
   - Proactive intervention opportunity

## API Functions

### Get SLA for Ticket
```typescript
import { getTicketSLA, calculateSLAStatus } from "@/lib/sla"

const slaTracking = await getTicketSLA(ticketId)
const slaStatus = calculateSLAStatus(slaTracking)
```

### Get SLA Metrics
```typescript
import { getSLAMetrics } from "@/lib/sla"

const metrics = await getSLAMetrics(startDate, endDate)
```

### Get Breached Tickets
```typescript
import { getBreachedTickets } from "@/lib/sla"

const breached = await getBreachedTickets()
```

### Get At-Risk Tickets
```typescript
import { getAtRiskTickets } from "@/lib/sla"

const atRisk = await getAtRiskTickets()
```

## Components

### SLAIndicator
Displays SLA status with progress bar:

```tsx
<SLAIndicator
  status="at_risk"
  timeRemaining={45}
  progress={85}
  type="response"
/>
```

### SLABadge
Compact SLA status badge:

```tsx
<SLABadge status="breached" type="resolution" />
```

## Reports & Analytics

### SLA Compliance Report
```sql
SELECT 
  DATE_TRUNC('day', t.created_at) as date,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN st.response_sla_met = TRUE THEN 1 END) as response_met,
  COUNT(CASE WHEN st.resolution_sla_met = TRUE THEN 1 END) as resolution_met,
  ROUND(AVG(st.response_time_minutes), 2) as avg_response_minutes,
  ROUND(AVG(st.resolution_time_minutes), 2) as avg_resolution_minutes
FROM tickets t
INNER JOIN ticket_sla_tracking st ON t.id = st.ticket_id
WHERE t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', t.created_at)
ORDER BY date DESC;
```

### Agent SLA Performance
```sql
SELECT 
  u.full_name,
  COUNT(*) as tickets_handled,
  COUNT(CASE WHEN st.response_sla_met = TRUE THEN 1 END) as response_met,
  COUNT(CASE WHEN st.resolution_sla_met = TRUE THEN 1 END) as resolution_met,
  ROUND(AVG(st.response_time_minutes), 2) as avg_response_time,
  ROUND(AVG(st.resolution_time_minutes), 2) as avg_resolution_time
FROM users u
INNER JOIN tickets t ON t.assigned_to = u.id
INNER JOIN ticket_sla_tracking st ON t.id = st.ticket_id
WHERE u.role IN ('agent', 'admin')
  AND t.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name
ORDER BY resolution_met DESC;
```

### SLA Breach Analysis
```sql
SELECT 
  breach_type,
  COUNT(*) as breach_count,
  ROUND(AVG(breach_minutes), 2) as avg_breach_minutes,
  MAX(breach_minutes) as max_breach_minutes
FROM sla_breach_history
WHERE breached_at >= NOW() - INTERVAL '30 days'
GROUP BY breach_type;
```

## Best Practices

### 1. Monitor Daily
- Check SLA dashboard daily
- Address breached tickets immediately
- Proactively work on at-risk tickets

### 2. Set Realistic SLAs
- Base on actual performance data
- Consider team capacity
- Account for peak times

### 3. Use Escalation
- Set escalation times appropriately
- Auto-escalate at-risk tickets
- Ensure L2 agents available

### 4. Review Regularly
- Monthly SLA compliance review
- Adjust policies based on data
- Identify improvement areas

### 5. Train Team
- Ensure agents understand SLA importance
- Set clear expectations
- Celebrate SLA achievements

## Troubleshooting

### SLA Not Created for Ticket
**Check:**
1. Ticket has valid priority
2. SLA policy exists for that priority
3. Trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_sla_tracking';`

### SLA Times Incorrect
**Check:**
1. Server timezone settings
2. Business hours configuration
3. Holiday calendar

### Response SLA Not Updating
**Check:**
1. Comment is from agent/admin (not customer)
2. Trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_track_first_response';`

## Future Enhancements

### Planned Features
- [ ] Email notifications for SLA breaches
- [ ] Auto-escalation based on SLA
- [ ] Custom SLA policies per customer
- [ ] SLA pause/resume functionality
- [ ] Advanced business hours calculations
- [ ] SLA reports export
- [ ] SLA widgets on dashboard
- [ ] Mobile SLA alerts

## Integration with Existing Features

### ✅ No Impact on Current Features
- Existing tickets continue to work
- All current functionality preserved
- SLA is additive, not disruptive

### ✅ Enhances Existing Features
- Ticket detail page shows SLA
- Admin dashboard includes SLA metrics
- Reports can include SLA data
- Audit logs track SLA changes

## Support

For issues or questions:
1. Check this documentation
2. Review database logs
3. Check trigger status
4. Verify SLA policies exist

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Compatibility**: Service Ticket System v1.0+
