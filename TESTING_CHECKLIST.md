# Ooma Network Intelligence Platform - Testing Checklist

## Core Dashboard Functionality
- [ ] Real-time metrics display updates every 5 seconds
- [ ] Historical charts render correctly with 24-hour data
- [ ] Geographic map shows device locations with proper status colors
- [ ] WebSocket connectivity maintains live updates
- [ ] Sidebar statistics calculate correctly (active devices, network score, alerts)

## Data Management
- [ ] CSV import functionality processes network metrics
- [ ] CSV export generates downloadable files
- [ ] Database operations (CRUD) work for devices, metrics, alerts
- [ ] Data validation prevents invalid entries
- [ ] Timestamps and time zones display correctly

## Alert System
- [ ] Alert creation and acknowledgment workflow
- [ ] Alert severity levels (error, warning, info) display properly
- [ ] Real-time alert notifications via WebSocket
- [ ] Alert filtering and search functionality

## Device Management
- [ ] Device registration and status updates
- [ ] Device location mapping (latitude/longitude)
- [ ] Device type classification (router, pi, etc.)
- [ ] Device offline detection and status changes

## API Endpoints
- [ ] GET /api/metrics - Returns paginated network metrics
- [ ] GET /api/metrics/latest - Returns most recent metrics
- [ ] GET /api/devices - Returns all monitored devices
- [ ] GET /api/alerts - Returns active alerts
- [ ] GET /api/dashboard/stats - Returns aggregated statistics
- [ ] POST /api/metrics/import - CSV import functionality
- [ ] POST /api/export/request - Export request creation

## Performance & Scalability
- [ ] Response times under load (< 500ms for most operations)
- [ ] Memory usage with large datasets
- [ ] WebSocket connection stability
- [ ] Database query optimization
- [ ] Frontend rendering performance with multiple charts

## User Interface
- [ ] Responsive design on different screen sizes
- [ ] Dark theme consistency across components
- [ ] Navigation between dashboard sections
- [ ] Loading states and error handling
- [ ] Accessibility features (keyboard navigation, screen readers)

## Security & Data Integrity
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] CORS configuration
- [ ] Environment variable protection
- [ ] File upload security (CSV imports)

## Edge Cases
- [ ] Network disconnection handling
- [ ] Empty data states
- [ ] Invalid CSV format handling
- [ ] Device location edge cases (invalid coordinates)
- [ ] Large dataset performance (1000+ metrics)
- [ ] Concurrent user sessions

## Integration Testing
- [ ] End-to-end workflow: Device registration → Data collection → Alert generation
- [ ] CSV import to chart visualization pipeline
- [ ] Geographic map interaction with device details
- [ ] Alert acknowledgment workflow