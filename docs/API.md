# TerritoryIQ — REST API Documentation

**Base URL:** `http://localhost:4000/api/v1`
**Auth:** Bearer JWT token in `Authorization` header

---

## Authentication

### POST `/auth/login`
```json
Request:
{ "email": "admin@territoryiq.com", "password": "Admin@123" }

Response 200:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "...", "role": "admin", "mrId": null }
}
```

### POST `/auth/refresh`
```json
Request:  { "refreshToken": "eyJ..." }
Response: { "accessToken": "eyJ..." }
```

### POST `/auth/logout`
```json
Request:  { "refreshToken": "eyJ..." }
Response: { "message": "Logged out successfully" }
```

### GET `/auth/me`
```json
Response: {
  "user": {
    "id": "...", "email": "...", "role": "admin",
    "mrId": null, "fullName": null,
    "territoryId": null, "territoryName": null
  }
}
```

---

## Analytics

### GET `/analytics/dashboard`
Returns all KPIs for the main dashboard.
```json
Response: {
  "coverage": {
    "doctorCoverage": 78.4,
    "customerCoverage": 85.2,
    "totalDoctors": 1951,
    "coveredDoctors": 1528,
    "totalCustomers": 308,
    "coveredCustomers": 262
  },
  "mrs":    { "total": 52, "active": 47, "onlineNow": 12 },
  "visits": { "today": 312, "validToday": 300, "invalidToday": 12, "avgDuration": 24.3 },
  "alerts": { "critical": 3, "warning": 4, "info": 1 }
}
```

### GET `/analytics/coverage/trend?months=6&territoryId=`
### GET `/analytics/mr-productivity?from=2026-01-01&to=2026-05-18&territoryId=`
### GET `/analytics/territory-comparison`
### GET `/analytics/visit-heatmap?from=2026-04-18&territoryId=`
### GET `/analytics/product-performance?from=2026-04-18`

---

## Medical Representatives

### GET `/mrs`
Query params: `status`, `territoryId`

### GET `/mrs/live`
Live status of all active MRs with visit counts, GPS status.

### GET `/mrs/:id`
Full MR detail including visit counts.

### POST `/mrs`
```json
{
  "userId": "uuid",
  "employeeId": "EMP-0099",
  "fullName": "Ravi Kumar",
  "territoryId": "uuid",
  "phone": "9821009999",
  "dailyVisitTarget": 10,
  "monthlyTarget": 500000
}
```

### PATCH `/mrs/:id`
Update any allowed fields (fullName, status, territoryId, etc.)

---

## Territories

### GET `/territories`
Returns all territories with coverage stats (from `vw_territory_coverage`).

### GET `/territories/:id`
Territory detail with doctor/customer counts.

### POST `/territories`  *(Admin only)*
```json
{ "name": "Kolkata South", "city": "Kolkata", "region": "East", "state": "West Bengal" }
```

---

## Doctors

### GET `/doctors`
Query params: `search`, `specialty`, `priority`, `mrId`, `territoryId`, `page`, `limit`

### GET `/doctors/:id`
Full profile including last 10 visits.

### POST `/doctors`
```json
{
  "name": "Dr. Arun Joshi",
  "specialty": "Cardiologist",
  "qualification": "MBBS, MD",
  "clinicHospital": "Apollo Hospital",
  "address": "Juhu, Mumbai",
  "phone": "9900111222",
  "priority": "high",
  "potentialScore": 8.5,
  "visitFrequencyDays": 14,
  "assignedMrId": "uuid",
  "territoryId": "uuid"
}
```
Auto-geocodes address if `latitude`/`longitude` not provided.

### PATCH `/doctors/:id`
Update any doctor field.

---

## Customers

### GET `/customers`
Query params: `search`, `type` (pharmacy|clinic|hospital|healthcare_retailer), `mrId`, `territoryId`, `page`, `limit`

### GET `/customers/:id`
### POST `/customers`
```json
{
  "name": "MedPlus Pharmacy Juhu",
  "customerType": "pharmacy",
  "address": "Juhu Tara Road, Mumbai",
  "contactPerson": "Ramesh Gupta",
  "phone": "9800301001",
  "visitFrequencyDays": 7,
  "monthlyBusinessPotential": 85000,
  "assignedMrId": "uuid",
  "territoryId": "uuid"
}
```

---

## Visits

### POST `/visits/checkin`
```json
{
  "visitType": "doctor",
  "doctorId": "uuid",
  "latitude": 19.0544,
  "longitude": 72.8322,
  "notes": "Discussed Cardivex 10mg"
}
```
Returns visit record + geo validation result.

### PUT `/visits/:id/checkout`
```json
{
  "latitude": 19.0548,
  "longitude": 72.8325,
  "discussionNotes": "Doctor very interested in Cardivex. Will prescribe.",
  "productsDiscussed": ["Cardivex 10mg"],
  "samplesGiven": [{ "productId": "uuid", "quantity": 2 }],
  "followupDate": "2026-06-01",
  "visitOutcome": "positive",
  "competitorActivity": "Acme rep visited yesterday"
}
```

### GET `/visits`
Query params: `mrId`, `doctorId`, `customerId`, `visitType`, `from`, `to`, `geoStatus`, `page`, `limit`

### GET `/visits/:id`
### GET `/visits/today/:mrId`

### POST `/visits/gps`
GPS ping (called every 60s by MR device):
```json
{ "latitude": 19.076, "longitude": 72.877, "accuracy": 8.5, "speed": 0, "heading": 90 }
```

---

## Daily Activity Reports

### GET `/dar?mrId=&from=&to=`
### GET `/dar/today`  *(MR role — own report)*
### POST `/dar`
```json
{
  "reportDate": "2026-05-18",
  "doctorCalls": 8,
  "customerVisits": 3,
  "samplesDistributed": 6,
  "competitorActivities": "Acme rep active in Bandra area",
  "marketFeedback": "Strong demand for Cardivex",
  "routeDistanceKm": 34.2
}
```
Upserts (creates or updates) report for the day.

### PATCH `/dar/:id/submit`
Marks report as submitted. Cannot be undone.

---

## Alerts

### GET `/alerts`
Query params: `severity`, `type`, `isRead`, `mrId`, `page`, `limit`

### PATCH `/alerts/:id/read`
### PATCH `/alerts/:id/resolve`  *(Manager+ only)*

---

## Geo Services

### GET `/geo/geocode?address=Bandra West Mumbai`
```json
{ "location": { "lat": 19.0596, "lng": 72.8295 } }
```

### GET `/geo/reverse?lat=19.0596&lng=72.8295`
```json
{ "address": "Bandra West, Mumbai, Maharashtra, India" }
```

### POST `/geo/optimize-route`
```json
Request:
{
  "start": { "lat": 19.076, "lng": 72.877 },
  "stops": [
    { "lat": 19.054, "lng": 72.832 },
    { "lat": 19.033, "lng": 72.840 },
    { "lat": 19.113, "lng": 72.869 }
  ]
}

Response:
{
  "optimizedWaypoints": [...stops in optimal order...],
  "route": {
    "distance": 18420,
    "duration": 2340,
    "geometry": "encoded_polyline_string",
    "waypoints": [...]
  }
}
```

### GET `/geo/nearby/doctors?lat=19.076&lng=72.877&radius=5`
Returns doctors within 5km radius, ordered by distance.

### GET `/geo/territory/:id/boundary`
Returns PostGIS boundary as GeoJSON.

### GET `/geo/mr/:mrId/route-replay?date=2026-05-18`
Returns GPS track for an MR on a given date.

---

## Reports

### GET `/reports/daily-activity?mrId=&from=&to=`
### GET `/reports/visit-compliance?from=&to=`

---

## Products

### GET `/products`
### POST `/products`
```json
{ "name": "Cardivex 20mg", "category": "Cardiology", "sku": "CARD-002", "description": "Higher dose variant" }
```

---

## WebSocket Events

Connect: `ws://localhost:4000` with `auth: { token: "Bearer_token" }`

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `gps:update` | `{ lat, lng, accuracy }` | MR GPS ping |
| `subscribe:territory` | `territoryId` | Subscribe to territory events |
| `alert:read` | `alertId` | Mark alert as read |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `mr:location:update` | `{ mrId, lat, lng, ts }` | MR moved (broadcast to managers) |
| `visit:checkin` | `{ mrId, visitId, visitType, lat, lng, geoStatus }` | New check-in |
| `visit:checkout` | `{ visitId, duration }` | Check-out completed |
| `alert:new` | Alert object | New alert for manager/MR |

---

## Error Responses

All errors follow this format:
```json
{ "error": "Human-readable message", "statusCode": 400 }
```

| Code | Meaning |
|------|---------|
| 400 | Validation error / bad request |
| 401 | Unauthenticated (missing/expired token) |
| 403 | Unauthorized (insufficient role) |
| 404 | Resource not found |
| 409 | Duplicate record |
| 422 | Validation failed (express-validator) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
