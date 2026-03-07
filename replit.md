# Ooma Network Intelligence Platform

## Overview

The Ooma Network Intelligence Platform is a real-time network monitoring and analytics system built with a modern full-stack architecture. It provides comprehensive network performance monitoring across multiple devices and locations, featuring live dashboards, interactive charts, geographic visualization, and intelligent alerting. The platform is designed for network administrators and IT professionals who need detailed insights into network performance metrics including speed tests, latency monitoring, and device health tracking.

The application supports multi-device monitoring with real-time updates via WebSocket connections, historical data analysis, CSV data import/export capabilities, and customizable alerting systems for network performance issues.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred color theme: Dark purple-tinted backgrounds with purples, violets, blues, and greens as accent colors. Contrasting colors (amber/gold for warnings, rose/pink for errors) complement the cool-tone palette.

## System Architecture

### Frontend Architecture
The client-side application is built using **React 18** with TypeScript and follows a component-based architecture. The frontend uses **Vite** as the build tool and development server, providing fast hot module replacement and optimized builds. Routing is handled by **Wouter**, a lightweight client-side router.

**UI Framework**: The application leverages **shadcn/ui** components built on top of **Radix UI** primitives, providing accessible and customizable components. **Tailwind CSS** is used for styling with a purple-tinted dark theme. The color system uses CSS custom properties defined in `client/src/index.css` with a palette of: violet primary (`hsl(265,80%,58%)`), blue info (`hsl(220,85%,56%)`), emerald success (`hsl(155,72%,44%)`), amber warning (`hsl(45,100%,55%)`), and rose error (`hsl(340,82%,52%)`). Chart colors (in `client/src/lib/chart-utils.ts`) use emerald for download, purple for upload, sky-blue for ping, and indigo for jitter.

**State Management**: **TanStack Query** (React Query) manages server state, caching, and data synchronization. The application uses custom hooks for WebSocket connections to enable real-time updates.

**Data Visualization**: **Chart.js** is used for creating interactive charts showing network performance over time. **Leaflet** provides geographic mapping capabilities for visualizing device locations.

### Backend Architecture
The server is built with **Express.js** and TypeScript, following a modular structure with separate route handlers and storage abstractions. The API provides RESTful endpoints for managing network metrics, devices, alerts, and export requests.

**Real-time Communication**: **WebSocket** connections enable live updates for metrics and alerts, broadcasting changes to all connected clients.

**File Processing**: **Multer** handles file uploads for CSV import functionality, allowing bulk import of network metric data.

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database, accessed through **Drizzle ORM** with the **@neondatabase/serverless** driver for serverless PostgreSQL connections. The database schema includes tables for network metrics, devices, alerts, and export requests.

**Database Schema Design**:
- **networkMetrics**: Stores timestamped network performance data with fields for download/upload speeds, ping latency, and rolling averages
- **devices**: Manages network monitoring devices with location data and status tracking
- **alerts**: Handles alert management with severity levels and acknowledgment tracking
- **exportRequests**: Tracks data export jobs with status and file generation

### Authentication and Authorization
The current architecture does not implement explicit authentication mechanisms, suggesting this is either handled at the infrastructure level or is designed for internal/trusted network environments.

### External Service Integrations

**Google Cloud Storage**: The application integrates with **@google-cloud/storage** for file storage capabilities, likely used for storing exported reports and uploaded CSV files.

**Uppy File Upload**: **Uppy** provides a sophisticated file upload interface with support for drag-and-drop, progress tracking, and cloud storage integration via **@uppy/aws-s3**.

**Email Notifications**: Based on the attached Python script, the system supports email alerting via SMTP for network performance issues, though this appears to be implemented as a separate monitoring service.

**Database Provider**: **Neon Database** provides the serverless PostgreSQL instance, offering automatic scaling and connection pooling for the application.

### Dashboard Duration & Time Range

The dashboard supports configurable time-range viewing via a duration dropdown (1h, 6h, 24h, 7d, 30d, 90d). Duration state is managed in `dashboard.tsx` and passed as props to `RealTimeMetrics` and `ChartsSection` components. Data is fetched using `/api/metrics?from=ISO&to=ISO` query parameters. Charts use intelligent downsampling to display appropriate data density for each time range. The Refresh button invalidates all TanStack Query caches.

**Metric Cards**: The headline number shows the **period average** for the selected duration; the "Current" sub-label shows the live fleet-wide average (averaged across all latest per-device readings). Peak/Low sub-numbers show the extremes for the period.

### Filtering: Duration → Region → City

Three cascading filter dropdowns control data scope (left to right):
1. **Duration** (1h–90d): controls the time window
2. **Region** (All Regions, West, Central, Northeast, Southeast): geographic grouping
3. **City** (individual cities): specific location

Region mapping (`REGION_MAP` in `dashboard.tsx`, `REGION_CITIES` in `server/routes.ts`):
- **West**: San Francisco, Los Angeles, Seattle, Denver
- **Central**: Chicago, Austin
- **Northeast**: New York
- **Southeast**: Atlanta, Miami

When a region is selected, it sends `location=region:West` to the API. The backend `resolveLocationFilter()` in `routes.ts` expands this to an array of cities and uses `inArray()` in the SQL query. The city dropdown filters to only show cities within the selected region, and both region and city items are disabled (grayed out) if they have no metric data in the selected duration.

The `/api/metrics/locations` endpoint returns distinct locations with data in a given time range, used by the frontend to determine which regions/cities to enable.

**Query Key Convention**: TanStack Query keys use array segments like `['/api/metrics', duration, location]` — never objects as array segments.

### Seed Data

The `seed-data.ts` script generates 90 days of realistic network performance data for 9 devices across 9 US cities (~50,000 data points). Data uses variable intervals: 5min for last 7d, 15min for 7-30d, hourly for 30-90d. Includes time-of-day patterns, realistic variance, occasional outage events, and rolling averages.

The architecture follows modern full-stack patterns with clear separation between frontend presentation, backend API logic, and data persistence layers. The system is designed for real-time monitoring with efficient data flow and responsive user interfaces.