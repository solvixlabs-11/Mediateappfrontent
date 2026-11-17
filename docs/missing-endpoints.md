# Missing Backend Endpoints - Mobile App (`Mediateappfrontent`)

**Date**: 2026-11-04  
**Source**: Dynamic Data Audit (`docs/audit/static-data.md`)

The following mobile app features require dedicated backend endpoints. Until these endpoints are implemented on the FastAPI backend, the corresponding mobile UI features display clean Empty / Coming Soon states without any fake, mock, or hardcoded business data:

---

### 1. DCR Route Deviation Submission
- **Method / Path**: `POST /api/v1/dcr/deviations` (or `POST /api/v1/tours/deviations`)
- **Required Request Payload**:
  ```json
  {
    "deviation_date": "2026-11-04",
    "standard_route_id": 1,
    "city_id": 2,
    "area_id": 5,
    "reason": "Doctor conference at alternate clinic",
    "manager_approval_required": true
  }
  ```
- **Referenced In**: `src/features/dcr/screens/DeviationScreen.tsx`
- **Current Mobile Behavior**: Shows a notification explaining that backend route deviation submission is pending backend activation; does not fake saving with `setTimeout`.

---

### 2. Doctor Monthly Business Tracking
- **Method / Path**: `GET /api/v1/customers/doctors/{doctor_id}/business` (or `GET /api/v1/dashboard/doctor-business`)
- **Expected Response**:
  ```json
  [
    {
      "doctor_id": 101,
      "doctor_name": "Dr. Rajesh Sharma",
      "specialization": "Cardiology",
      "target_amount": 50000.0,
      "achieved_amount": 48200.0,
      "achievement_percentage": 96.4
    }
  ]
  ```
- **Referenced In**: `src/features/dashboard/components/QuickActionModals.tsx` (`DoctorBusinessModal`)
- **Current Mobile Behavior**: Renders clear Empty / Coming Soon card ("Doctor business tracking will be available in the upcoming release").

---

### 3. Field Induction & Training Modules
- **Method / Path**: `GET /api/v1/training/modules`
- **Expected Response**:
  ```json
  [
    {
      "id": 1,
      "title": "Mediate Brand Portfolio 2026",
      "duration_minutes": 15,
      "category": "Product Detailing",
      "content_url": "https://cdn.mediate.com/training/portfolio-2026.pdf",
      "is_completed": false
    }
  ]
  ```
- **Referenced In**: `src/features/dashboard/components/QuickActionModals.tsx` (`InductionModal`)
- **Current Mobile Behavior**: Renders visual aids from `/api/v1/products` or clear Empty state.

---

### 4. Stockist Credit Note Management
- **Method / Path**: `POST /api/v1/credit-notes`
- **Expected Request Payload**:
  ```json
  {
    "stockist_id": 12,
    "amount": 15400.0,
    "reason": "Expiry Return",
    "remarks": "Batch BA-2401 expired return"
  }
  ```
- **Referenced In**: `src/features/dashboard/components/QuickActionModals.tsx` (`CreditNoteModal`)
- **Current Mobile Behavior**: Informs user that credit note processing is pending ERP sync.

---

### 5. Broadcast SMS / Push Communication
- **Method / Path**: `POST /api/v1/notifications/broadcast`
- **Expected Request Payload**:
  ```json
  {
    "recipient_group": "ALL_ACTIVE_MRS",
    "message": "Circular update regarding Q4 campaign."
  }
  ```
- **Referenced In**: `src/features/dashboard/components/QuickActionModals.tsx` (`SMSBroadcastModal`)
- **Current Mobile Behavior**: Informs manager that system broadcast requires admin approval.

