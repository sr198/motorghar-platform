# **MotorGhar MVP – Product Requirements Specification (v1.0)**

*Version:* 1.0
*Date:* 2025-10-24
*Prepared by:* Workalaya Solutions
*Scope:* MVP release for “My Garage” and Admin Console
*Reference:* v0.2 full specification (Nepal-Market-Validated)

---

## **0. Executive Summary**

MotorGhar is Nepal’s **Digital Garage** — a platform that allows vehicle owners to manage their vehicles, track services, discover trusted service centers, and stay updated with relevant news and recalls.

The **MVP (v1.0)** focuses on establishing the foundation for this ecosystem through:

1. **User & Profile Management (Owner Portal)**
2. **My Garage** – full vehicle lifecycle management
3. **Admin Console** – centralized catalog and content management

VIN-based lookup, marketplace, and inspection features will follow in future versions.

---

## **1. Goals and Non-Goals**

### **1.1 Goals**

* Enable users to digitally manage their vehicles (add, update, delete).
* Provide users with access to verified service centers and allow scheduling of services.
* Offer a simple way to record and view service history.
* Display curated news, events, and recalls per vehicle model.
* Establish an admin console for managing vehicles, news, and service centers.

### **1.2 Non-Goals**

* No marketplace, buyer, or seller workflows.
* No partner (service center) logins.
* No VIN-based auto-lookup or DoTM integration.
* No payment or subscription features.
* No predictive analytics, ML models, or advanced notifications.

---

## **2. Personas**

| Persona           | Description                                         | Primary Goals                                                                  |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Vehicle Owner** | A registered user who manages one or more vehicles. | Maintain a digital record of vehicles, services, and reminders.                |
| **Administrator** | MotorGhar internal team.                            | Manage supported vehicles, service centers, and public content (news/recalls). |

---

## **3. Functional Scope**

### **3.1 User & Profile Management**

| Feature                | Description                                               | Acceptance Criteria                                                           |
| ---------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **User Registration**  | Email/password-based registration. OTP to be added later. | User can register with a valid email and password; email uniqueness enforced. |
| **Login/Logout**       | Session-based authentication using JWT.                   | Successful login returns token; logout invalidates session.                   |
| **Profile Management** | Update name, phone number, address, language preference.  | Profile data editable post-login.                                             |
| **Role-Based Access**  | Roles: OWNER, ADMIN.                                      | Access restricted per role.                                                   |
| **Localization**       | English and Nepali supported in all key UI strings.       | User can switch between languages.                                            |

---

### **3.2 My Garage (Owner Portal)**

| Feature                       | Description                                                              | Acceptance Criteria                                                        |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Vehicle Management**        | Add, update, delete vehicles manually using make, model, year, and trim. | CRUD operations must succeed; validation for duplicates (same reg number). |
| **Vehicle Details View**      | View detailed profile of each vehicle.                                   | Includes base info, documents, service history, reminders, and news.       |
| **Document Vault (Lite)**     | Upload and view documents (Bluebook, insurance, tax).                    | File size limit 10 MB; accepted formats: PDF/JPG/PNG.                      |
| **Service Center Discovery**  | Browse and save nearby service centers.                                  | Uses location data (Google Maps API or local dataset).                     |
| **Service Scheduling**        | Book and manage service appointments.                                    | Calendar view; reminders via email/SMS.                                    |
| **Service History Tracking**  | Log completed services with date, cost, notes.                           | Each record editable and deletable; cost numeric validation.               |
| **Reminders & Notifications** | Auto reminders for service dates and insurance expiry.                   | Configurable thresholds (default: 7 days before).                          |
| **News, Events & Recalls**    | Display vehicle-specific updates from Admin module.                      | Filtered by make/model/year; sorted by date.                               |
| **Notes**                     | Allow user to add personal notes per vehicle.                            | CRUD operations with timestamps.                                           |

---

### **3.3 Admin Console**

| Feature                        | Description                                             | Acceptance Criteria                                     |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------- |
| **Dashboard Overview**         | Display KPIs (total users, vehicles, active reminders). | Real-time counts from database.                         |
| **User Management**            | View and manage registered users.                       | Filter by role, last login; deactivate/reactivate.      |
| **Vehicle Catalog Management** | Add and maintain supported makes, models, and trims.    | CRUD functionality with uniqueness validation.          |
| **Service Center Management**  | Add/edit service center info with geo-coordinates.      | Must support address, contact, map pin.                 |
| **News & Recalls Management**  | Publish news/events linked to vehicle models.           | Rich text editor for content; publication date control. |
| **Audit Logs**                 | Track admin actions.                                    | All CRUD actions logged with timestamp and user ID.     |

---

## **4. Data Model Overview**

### **Core Entities**

| Entity            | Key Fields                                                                | Relationships                       |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------- |
| **User**          | id, name, email, password_hash, role, language_pref                       | 1-N with Vehicle                    |
| **Vehicle**       | id, user_id, make, model, year, trim, registration_no                     | 1-N with ServiceRecord, News        |
| **ServiceCenter** | id, name, address, lat, long, contact                                     | Optional link to User for ownership |
| **ServiceRecord** | id, vehicle_id, date, cost, notes, center_id                              | 1-1 with Reminder                   |
| **Reminder**      | id, service_record_id, type, due_date, status                             | Belongs to ServiceRecord            |
| **NewsItem**      | id, title, content, vehicle_make, vehicle_model, type (news/event/recall) | Linked by make/model                |
| **Document**      | id, vehicle_id, type, file_path, uploaded_by                              | 1-N with Vehicle                    |

---

## **5. Non-Functional Requirements**

| Category          | Requirement                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Performance**   | P50 < 2 s load for dashboard and My Garage view.                                         |
| **Scalability**   | Designed to support 10k users, 50k vehicles initially.                                   |
| **Security**      | Passwords hashed (bcrypt); JWT expiry 24 h; RBAC enforced.                               |
| **Localization**  | Nepali and English UI strings stored centrally for easy translation.                     |
| **Availability**  | 99% uptime target.                                                                       |
| **Tech Stack**    | React + Vite + TS (frontend), Fastify Gateway, NodeJS Backend, PostgreSQL, Redis, MinIO. |
| **Testing**       | Unit + integration tests required; E2E for core flows.                                   |
| **Accessibility** | WCAG 2.1 Level AA compliance for core pages.                                             |

---

## **6. API Requirements (High Level)**

| API                    | Method                           | Description                      | Auth   |
| ---------------------- | -------------------------------- | -------------------------------- | ------ |
| `/api/auth/register`   | POST                             | Register new user                | Public |
| `/api/auth/login`      | POST                             | Login and issue JWT              | Public |
| `/api/profile`         | GET/PUT                          | Fetch/update profile             | Auth   |
| `/api/vehicles`        | GET/POST                         | List/Add vehicles                | Auth   |
| `/api/vehicles/:id`    | GET/PUT/DELETE                   | Manage vehicle details           | Auth   |
| `/api/services`        | GET/POST                         | Log/view service records         | Auth   |
| `/api/reminders`       | GET/POST                         | Manage reminders                 | Auth   |
| `/api/service-centers` | GET                              | List service centers by location | Auth   |
| `/api/news`            | GET                              | Fetch news by make/model         | Public |
| `/api/admin/*`         | CRUD endpoints for admin modules | Admin only                       |        |

---

## **7. Acceptance Criteria (End-to-End)**

1. A registered owner can:

   * Add multiple vehicles.
   * Upload documents for each vehicle.
   * Schedule and track services.
   * View relevant news and recalls.
   * Receive service reminders.
2. Admin can:

   * Add new makes/models and service centers.
   * Publish news or recall alerts.
   * View system metrics on dashboard.
3. All interactions logged and validated through backend.
4. Localization toggle must persist across sessions.
5. API responses follow unified schema (`success`, `data`, `error`).

---

## **8. Release Plan**

| Phase                       | Scope                               | Deliverables                     |
| --------------------------- | ----------------------------------- | -------------------------------- |
| **Alpha (Internal)**        | Auth, vehicle CRUD, admin catalog   | Working API + UI                 |
| **Beta (Closed User Test)** | Service scheduling, reminders, docs | Stable user workflows            |
| **MVP Launch (Public)**     | All owner + admin features          | Deployed version + feedback loop |

---

## **9. Future Extensions**

* VIN-based vehicle lookup (API integration).
* Partner Service Center portal.
* Marketplace and inspection system.
* Financing, insurance, and DoTM integration.
* AI-based recommendation and analytics.

