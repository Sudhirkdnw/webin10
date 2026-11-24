# WEBIN10

## Complete Software Product Requirements \& Technical Architecture Specification

**Document Version:** 1.0  
**Status:** Architecture Baseline  
**Product:** Webin10  
**Product Type:** Multi-Tenant SaaS Business Operating System  
**Initial Market:** India — All Small and Medium Businesses  
**Initial Business Verticals:** Gym, Coaching, Tuition, Fitness and other configurable businesses  
**Architecture:** Modular Monolith + Event-Driven Background Processing  
**Backend:** NestJS + TypeScript  
**Frontend:** Next.js + TypeScript  
**Mobile:** React Native + Expo  
**Database:** PostgreSQL + Prisma ORM  
**Cache and Queue:** Redis + BullMQ  
**Payment Gateways:** Razorpay + Cashfree

---

# TABLE OF CONTENTS

1. Executive Summary
2. Product Vision and Objectives
3. Business Model and Target Market
4. Final Development Strategy
5. Application Architecture
6. User Roles and Permission Architecture
7. Super Admin Panel — Complete Requirements
8. Business Admin Panel — Complete Requirements
9. Customer Mobile Application — Complete Requirements
10. Multi-Tenant Architecture
11. Dynamic Configuration and Feature Management
12. Automation Engine Architecture
13. WhatsApp and Notification Architecture
14. Payment and Billing Architecture
15. Database Architecture
16. Complete Database Entity Catalogue
17. API Architecture and Contracts
18. Authentication and Authorization
19. Application Folder Structure
20. System Architecture Diagrams
21. Security Architecture
22. Non-Functional Requirements
23. Infrastructure and Deployment
24. Development Roadmap
25. Super Admin First — Detailed Execution Plan
26. Testing and Quality Assurance
27. Monitoring and Disaster Recovery
28. Production Readiness Checklist
29. Acceptance Criteria
30. Final Engineering Recommendations

---

# 1\. EXECUTIVE SUMMARY

Webin10 is a multi-tenant SaaS platform designed to help small and medium-sized businesses manage their complete business operations from a centralized system.

The platform will provide customer management, employee management, billing, payments, attendance, memberships, courses, communication, business automation and analytics.

The primary objective is to eliminate repetitive manual business operations.

Examples:

- A gym owner should automatically collect monthly membership fees.
- A coaching owner should automatically receive information about pending student fees.
- Students should receive class reminders.
- Gym members should receive membership renewal notifications.
- Business owners should monitor revenue and customer activity.
- Staff should only access the data permitted by their assigned roles.

Webin10 will have three primary applications and one shared backend:

| Application | Purpose |
| --- | --- |
| Super Admin Panel | Complete platform management |
| Business Admin Panel | Individual business management |
| Customer Mobile App | Customer-facing experience |
| Backend API | Shared business logic and data services |

## 1.1 Core Product Philosophy

**One Platform. Multiple Businesses. Complete Automation.**

Every business will have its own independent workspace, while Webin10 will manage the entire SaaS infrastructure centrally.

## 1.2 Critical Development Decision

Development will follow this exact order:

1. Backend foundation required for platform management.
2. Super Admin Backend APIs.
3. Super Admin Web Application.
4. Complete Super Admin testing and security verification.
5. Business Admin Backend APIs and Web Application.
6. Customer Mobile Application.
7. Production hardening and launch.

The Super Admin panel will be the first complete application delivered.

---

# 2\. PRODUCT VISION AND OBJECTIVES

## 2.1 Vision

Build an extensible Business Operating System that allows any small business to manage its operations without maintaining multiple disconnected applications.

## 2.2 Primary Objectives

- Centralized business management.
- Automated recurring payments and reminders.
- Customer relationship management.
- Staff and employee management.
- Role-based access control.
- Automated communication.
- Real-time business analytics.
- Configurable business modules.
- Multi-branch support.
- Customer-facing mobile application.

## 2.3 Product Success Metrics

Initial business metrics:

- Number of registered businesses.
- Monthly active businesses.
- Number of active customers.
- Successful payment collection rate.
- Automation execution success rate.
- Notification delivery rate.
- Monthly recurring revenue.
- Customer retention.
- Average onboarding completion time.

These metrics should be available through the Super Admin analytics dashboard.

---

# 3\. BUSINESS MODEL AND TARGET MARKET

Webin10 will initially target India.

## 3.1 Supported Business Categories

### Fitness and Wellness

- Gym
- Fitness Studio
- Yoga Studio
- Personal Training
- Sports Academy

### Education

- Coaching Centre
- Tuition Centre
- Computer Institute
- Dance Academy
- Music Academy
- Skill Development Institute

### Personal Services

- Salon
- Spa
- Beauty Studio
- Appointment-Based Services

### Future Categories

- Clinics, subject to appropriate healthcare privacy and compliance requirements.
- Professional service businesses.
- Membership organizations.
- Other configurable SMB categories.

## 3.2 Business Template System

Every business category will have its own predefined configuration template.

Example:

| Module | Gym | Coaching | Salon |
| --- | --- | --- | --- |
| Customer CRM | Yes | Yes | Yes |
| Membership | Yes | Optional | No |
| Courses | No | Yes | No |
| Attendance | Yes | Yes | Optional |
| Batch Management | No | Yes | No |
| Appointments | Optional | Optional | Yes |
| Billing | Yes | Yes | Yes |
| Staff Management | Yes | Yes | Yes |
| Automation | Yes | Yes | Yes |
| Analytics | Yes | Yes | Yes |

Templates should be configurable through the Super Admin Panel.

---

# 4\. FINAL DEVELOPMENT STRATEGY

The development strategy is explicitly Super Admin First

## Stage 1 — Super Admin

Build the complete platform control centre.

Super Admin must control:

- Business registrations.
- Business categories.
- Subscription plans.
- Platform modules.
- Feature flags.
- Configuration settings.
- Tenant accounts.
- Platform users.
- Payment provider settings.
- WhatsApp provider settings.
- System-wide notifications.
- Support access.
- Platform analytics.
- Audit logs.
- Security settings.

## Stage 2 — Business Admin

Build the business-specific operational dashboard.

Business owners will manage:

- Their customers.
- Employees.
- Memberships.
- Courses.
- Payments.
- Attendance.
- Automation.
- Reports.
- Branches.

## Stage 3 — Customer Mobile App

Build the customer application after the Business Admin APIs and workflows are stable.

Customers will manage their personal business relationships, payments, attendance and schedules.

## 4.1 Development Dependency Diagram

``` mermaid
flowchart TD
    A[Architecture and Database Foundation]
    B[Authentication and Platform Identity]
    C[Super Admin Backend APIs]
    D[Super Admin Web Panel]
    E[Super Admin Testing and Security]
    F[Business Admin Backend]
    G[Business Admin Frontend]
    H[Customer Mobile APIs]
    I[Customer Mobile App]
    J[Integration Testing]
    K[Production Launch]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
```

A limited amount of shared infrastructure and API groundwork can be developed in parallel, but the application delivery priority must remain Super Admin, Business Admin and Customer App.

---

# 5\. APPLICATION ARCHITECTURE

## 5.1 Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | NestJS |
| Language | TypeScript |
| Web Frontend | Next.js |
| Mobile | React Native + Expo |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache | Redis |
| Background Jobs | BullMQ |
| Authentication | JWT + Refresh Token Rotation |
| API Documentation | Swagger / OpenAPI |
| Payments | Razorpay + Cashfree |
| WhatsApp | Meta Cloud API |
| File Storage | AWS S3 |
| Hosting | AWS |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + OpenTelemetry |

## 5.2 Architecture Pattern

Use a Modular Monolith.

Do not start with microservices.

Backend modules will be independently organized, tested and maintained.

Background workers will be separate executable processes, but they will initially share the same backend codebase and domain logic.

## 5.3 High-Level Architecture

``` mermaid
flowchart TB
    SA[Super Admin]
    BA[Business Owner and Staff]
    CU[Customers]

    SA --> SPA[Super Admin Next.js]
    BA --> BWA[Business Admin Next.js]
    CU --> MOB[Customer React Native]

    SPA --> API[NestJS API]
    BWA --> API
    MOB --> API

    API --> AUTH[Authentication]
    API --> RBAC[Authorization]
    API --> CFG[Configuration Engine]
    API --> TEN[Tenant Management]

    API --> CRM[Business Modules]
    API --> BILL[Billing and Payments]
    API --> AUTO[Automation Engine]

    AUTH --> DB[(PostgreSQL)]
    RBAC --> DB
    CFG --> DB
    TEN --> DB
    CRM --> DB
    BILL --> DB

    AUTO --> REDIS[(Redis)]
    REDIS --> WORK[Background Workers]

    WORK --> WA[WhatsApp]
    WORK --> SMS[SMS]
    WORK --> EMAIL[Email]

    BILL --> RZ[Razorpay]
    BILL --> CF[Cashfree]
```

---

# 6\. USER ROLES AND PERMISSION ARCHITECTURE

Webin10 will implement two separate authorization domains.

## 6.1 Platform-Level Roles

| Role | Responsibility |
| --- | --- |
| Platform Owner | Complete platform ownership |
| Super Admin | Platform administration |
| Platform Support | Authorized customer support |
| Platform Finance | Platform subscription finance |
| Platform Operations | Platform operations |
| Platform Analyst | Authorized platform analytics |

Platform roles must not be automatically inherited by tenant users.

## 6.2 Tenant-Level Roles

| Role | Responsibility |
| --- | --- |
| Business Owner | Complete tenant administration |
| Business Manager | Business operations |
| Branch Manager | Assigned branch operations |
| Receptionist | Customer registration and basic payments |
| Trainer | Assigned gym members |
| Teacher | Assigned students and batches |
| Accountant | Financial reports and billing |
| Custom Staff | Owner-defined permissions |

## 6.3 Permission Architecture

Permission examples:

``` text
customers.read
customers.create
customers.update
customers.archive

staff.read
staff.create
staff.update

payments.read
payments.create
payments.refund

invoices.read
invoices.create

attendance.read
attendance.create

reports.read
settings.update

automation.read
automation.create
automation.manage
```

Permissions must be validated on the backend.

Frontend visibility is only a user experience feature and never a substitute for server-side authorization.

## 6.4 Authorization Hierarchy

``` mermaid
flowchart TD
    A[Authenticated Identity]
    A --> B{Identity Type}
    B --> C[Platform Identity]
    B --> D[Tenant Membership]

    C --> E[Platform Roles]
    E --> F[Platform Permissions]

    D --> G[Business Membership]
    G --> H[Tenant Roles]
    H --> I[Tenant Permissions]

    F --> J[Authorized Platform API]
    I --> K[Authorized Business API]
```

---

# 7\. SUPER ADMIN PANEL — COMPLETE PRODUCT REQUIREMENTS

This is the first application to be developed.

The Super Admin Panel is the central control system of Webin10.

## 7.1 Super Admin Dashboard

Dashboard should show:

### Platform Overview

- Total businesses.
- Active businesses.
- Suspended businesses.
- Pending registrations.
- Total registered users.
- Total active customers across tenants.
- Total branches.
- Monthly recurring revenue.
- Subscription renewals.
- Trial accounts.

### Financial Overview

- Total subscription revenue.
- Paid subscriptions.
- Pending subscriptions.
- Failed payments.
- Refunds.
- Monthly revenue trends.

### Platform Health

- API status.
- Database status.
- Redis status.
- Worker status.
- WhatsApp integration status.
- Payment gateway status.
- Notification delivery status.

### Analytics

- Business registration trends.
- Business category distribution.
- Subscription conversion.
- Tenant churn.
- Feature usage.
- Message usage.
- API usage.

## 7.2 Tenant Management

Super Admin can:

- View all registered businesses.
- Search by business name.
- Filter by category.
- Filter by subscription.
- View business profile.
- View registration date.
- View business status.
- Activate business.
- Suspend business.
- Restore suspended business.
- View usage statistics.
- View subscription information.
- View branch count.
- View staff count.
- View customer count.
- View integration status.

Every suspension and reactivation must record the actor, reason and timestamp.

Suspending a tenant must not delete its data.

## 7.3 Business Category Management

Super Admin can:

- Create business categories.
- Edit category information.
- Change category status.
- Configure default modules.
- Configure onboarding fields.
- Configure default workflows.
- Configure navigation.
- Configure category-specific limits.

Example:

Create a new business category named Dance Academy.

The system should allow Super Admin to define:

- Students.
- Teachers.
- Classes.
- Batches.
- Attendance.
- Monthly fees.
- Notifications.

No new frontend deployment should be required for changes that can be represented by existing configurable modules and fields.

## 7.4 Module Management

Modules represent large functional areas.

Examples:

- CRM.
- Billing.
- Attendance.
- Membership.
- Courses.
- Staff.
- Automation.
- Reports.
- Appointments.
- Branches.

Super Admin can:

- Add module metadata.
- Activate or deactivate a module.
- Assign modules to categories.
- Assign modules to plans.
- Configure availability.
- Configure module dependencies.
- Set module versions.

Module metadata must not be confused with actual executable software. New business logic still requires development and deployment.

## 7.5 Feature Flag Management

Features represent smaller capabilities.

Examples:

- QR Attendance.
- Advanced Reports.
- AI Assistant.
- Automatic Renewal.
- Bulk Messaging.
- Multi-Branch.
- Customer Mobile Access.

Feature configuration hierarchy:

``` text
Platform Default
       |
Business Category
       |
Subscription Plan
       |
Individual Tenant Override
       |
Effective Feature Availability
```

The backend must calculate effective permissions and feature availability.

A tenant override cannot bypass platform security restrictions or subscription entitlements.

## 7.6 Subscription Plan Management

Super Admin can:

- Create subscription plans.
- Update plan pricing.
- Set billing intervals.
- Configure trial periods.
- Configure staff limits.
- Configure customer limits.
- Configure branch limits.
- Configure storage limits.
- Configure message credits.
- Enable and disable features.
- Configure grace periods.
- Configure upgrade and downgrade rules.

Example plans:

| Plan | Monthly Price | Customers | Staff |
| --- | ---: | ---: | ---: |
| Starter | ₹499 | 100 | 2 |
| Growth | ₹999 | 500 | 5 |
| Professional | ₹1,999 | 2,000 | 15 |
| Enterprise | Custom | Configurable | Configurable |

These are proposed launch prices and must be validated before commercialization.

## 7.7 Platform Configuration Management

Central settings:

- Website branding.
- Logo.
- Theme.
- Default language.
- Default timezone.
- Currency defaults.
- Registration settings.
- OTP settings.
- Session policies.
- Notification settings.
- Security policies.
- Maintenance mode.
- API rate limits.
- File upload limits.
- Usage limits.

Configuration changes must have:

- Versioning.
- Audit history.
- Validation.
- Preview.
- Publish.
- Rollback.
- Optional approval workflow.

## 7.8 Payment Gateway Administration

Super Admin can:

- Enable Razorpay.
- Enable Cashfree.
- Configure provider availability.
- Configure subscription payment methods.
- View Webin10 subscription transactions.
- View gateway health.
- View webhook failures.
- View reconciliation status.
- Configure payment retries.

Secret credentials must be stored in encrypted secret storage, not returned to the browser.

## 7.9 WhatsApp and Communication Management

Super Admin can:

- Manage Meta integration configuration.
- Configure messaging providers.
- Manage message templates.
- View message usage.
- View failed messages.
- View delivery statistics.
- Configure global rate limits.
- Configure platform-level messaging policies.
- Manage provider health.

Tenant-specific WhatsApp accounts must remain separately isolated.

## 7.10 Support and Access Management

Super Admin must not automatically have unrestricted access to every business's customer records.

Support access workflow:

1. Admin selects a tenant.
2. Admin provides a support reason.
3. Authorized approver approves the request.
4. A time-limited access session is issued.
5. Every action is audited.
6. Access expires automatically.
7. Access can be revoked immediately.

Platform-level aggregate analytics can be available without exposing individual customer records.

## 7.11 Audit Logs

Capture:

- Login events.
- Failed authentication.
- Configuration changes.
- Tenant suspension.
- Tenant activation.
- Plan modifications.
- Permission changes.
- Support access.
- Refund authorization.
- Sensitive record access.

Audit events should be append-only from the application perspective, with restricted database permissions and tamper-evident retention.

---

# 8\. BUSINESS ADMIN PANEL — COMPLETE REQUIREMENTS

Business Admin will be developed after the Super Admin Panel.

Every business will have its own isolated workspace.

## 8.1 Dashboard

Widgets:

- Total customers.
- Active customers.
- New registrations.
- Revenue.
- Pending payments.
- Upcoming renewals.
- Attendance.
- Staff performance.
- Upcoming sessions.
- Automation activity.

## 8.2 Customer Management

Customer information:

- Name.
- Phone.
- Email.
- Address.
- Registration date.
- Customer ID.
- Customer status.
- Assigned staff.
- Membership or course.
- Payment history.
- Attendance.
- Communication history.

Features:

- Add customer.
- Edit customer.
- Archive customer.
- Import CSV.
- Export authorized records.
- Search.
- Filter.
- Assign staff.
- View customer timeline.

## 8.3 Staff Management

- Add staff.
- Invite staff.
- Assign roles.
- Configure permissions.
- Assign branch.
- Assign customers.
- Suspend staff.
- Revoke access.

## 8.4 Gym Management

- Membership plans.
- Member registration.
- Membership renewal.
- Membership expiry.
- Trainer allocation.
- Attendance.
- QR check-in.
- Member history.
- Fitness session scheduling.

## 8.5 Coaching Management

- Courses.
- Batches.
- Teachers.
- Students.
- Parents or guardians.
- Attendance.
- Timetables.
- Exams.
- Fee schedules.
- Course completion.

## 8.6 Billing and Payments

- Create invoices.
- Generate recurring invoices.
- Record cash payments.
- Record UPI payments.
- Accept online payments.
- Track partial payments.
- Track outstanding balances.
- Generate receipts.
- Handle refunds.
- Reconcile transactions.

## 8.7 Automation Management

Business owners can configure:

- Payment reminders.
- Renewal reminders.
- Attendance alerts.
- Class reminders.
- Welcome messages.
- Follow-ups.
- Birthday notifications.

Every automation must support pause, resume, execution logs, retries and appropriate consent checks.

## 8.8 Reports

- Daily revenue.
- Monthly revenue.
- Outstanding payments.
- Attendance.
- Customer growth.
- Customer retention.
- Staff performance.
- Membership expiry.
- Course performance.

---

# 9\. CUSTOMER MOBILE APPLICATION

The third application will be customer-facing.

Technology: React Native + Expo.

## 9.1 Customer Registration

- Phone number login.
- OTP verification.
- Profile setup.
- Linked business discovery.
- Business selection.

## 9.2 Customer Dashboard

- Upcoming sessions.
- Current membership.
- Course information.
- Pending invoices.
- Recent payments.
- Attendance summary.
- Notifications.

## 9.3 Customer Payment

- View invoices.
- Pay online.
- Select available payment methods.
- View payment status.
- Download receipts.
- View transaction history.

## 9.4 Customer Attendance

- View attendance history.
- View class schedules.
- View membership status.
- Receive attendance notifications.

## 9.5 Customer Communication

- Push notifications.
- Business announcements.
- Appointment reminders.
- Payment reminders.
- Support requests.

A customer linked to multiple businesses must be able to switch between those businesses without exposing another customer's data.

---

# 10\. MULTI-TENANT ARCHITECTURE

Webin10 will use:

**Shared PostgreSQL Database + Shared Schema + Tenant Isolation.**

Each business is a tenant.

Example:

``` text
Webin10
  |
  +-- ABC Gym (Tenant A)
  |     +-- Customers
  |     +-- Staff
  |     +-- Payments
  |
  +-- XYZ Coaching (Tenant B)
  |     +-- Students
  |     +-- Teachers
  |     +-- Payments
  |
  +-- Dance Academy (Tenant C)
        +-- Students
        +-- Teachers
        +-- Classes
```

## 10.1 Tenant Isolation Requirements

- Every tenant-owned table must include tenant\_id.
- Tenant context must be derived from authenticated membership.
- Tenant IDs supplied by the client cannot be trusted.
- Database queries must enforce tenant context.
- PostgreSQL RLS must protect tenant-owned records.
- Composite foreign keys must prevent cross-tenant relationships.
- Background workers must establish tenant context.
- Cache keys must include tenant identity.
- File storage paths must be tenant-scoped.
- Search indexes must enforce tenant filtering.

## 10.2 RLS Strategy

Enable and FORCE Row Level Security on tenant-owned tables.

Example:

``` sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation
ON customers
USING (
  tenant_id =
  current_setting('app.tenant_id', true)::uuid
)
WITH CHECK (
  tenant_id =
  current_setting('app.tenant_id', true)::uuid
);
```

Set tenant context inside a database transaction using transaction-local configuration.

The application database role must not own protected tables and must not have BYPASSRLS privileges.

Platform-level operations must use explicitly designed, separately authorized database access paths. Do not create an unrestricted Super Admin bypass.

---

# 11\. DYNAMIC CONFIGURATION ENGINE

This is one of the most important differentiators of Webin10.

The Super Admin Panel must control configuration without requiring code changes for every business setting.

## 11.1 Configuration Types

- Platform configuration.
- Category configuration.
- Plan configuration.
- Tenant configuration.
- Feature configuration.
- Navigation configuration.
- Form configuration.
- Notification configuration.
- Automation configuration.

## 11.2 Configuration Tables

- configuration\_definitions
- configuration\_values
- configuration\_versions
- feature\_flags
- tenant\_feature\_overrides
- platform\_modules
- category\_modules
- tenant\_modules
- plan\_features
- navigation\_items

## 11.3 Configuration Versioning

Every change should record:

- Previous value.
- New value.
- Changed by.
- Changed at.
- Reason.
- Version.
- Approval status.

## 11.4 Configuration Diagram

``` mermaid
flowchart TD
    A[Super Admin Configuration]
    A --> B[Platform Defaults]
    A --> C[Category Templates]
    A --> D[Plan Entitlements]
    A --> E[Tenant Overrides]

    B --> F[Configuration Resolver]
    C --> F
    D --> F
    E --> F

    F --> G[Effective Business Configuration]
    G --> H[Business Admin UI]
    G --> I[Backend Authorization]
```

The backend configuration resolver is authoritative. Frontend configuration is only for rendering the user interface.

---

# 12\. AUTOMATION ENGINE

Automation will be event-driven.

## 12.1 Architecture

``` mermaid
flowchart TD
    A[Business Event]
    A --> B[Event Publisher]
    B --> C[Automation Engine]
    C --> D[Load Rules]
    D --> E[Evaluate Conditions]
    E --> F{Condition Passed?}
    F -->|Yes| G[Create Action Job]
    F -->|No| H[Log Skipped]
    G --> I[Redis BullMQ]
    I --> J[Background Worker]
    J --> K[WhatsApp / SMS / Email]
    K --> L[Delivery Result]
    L --> M[Execution Log]
```

## 12.2 Example Workflows

### Payment Reminder

Trigger: Invoice due date approaching.

Condition: Invoice remains unpaid.

Action: Send WhatsApp reminder.

### Attendance Alert

Trigger: Student absent.

Condition: Two consecutive scheduled classes missed.

Action: Notify parent, if consent and contact configuration permit.

### Membership Renewal

Trigger: Membership approaching expiry.

Condition: Membership active and renewal unpaid.

Action: Send renewal reminder.

## 12.3 Automation Requirements

- Trigger definitions.
- Conditional expressions.
- Action definitions.
- Scheduling.
- Retry policies.
- Idempotency.
- Execution logs.
- Dead-letter queue.
- Manual pause.
- Approval workflow for sensitive actions.
- Tenant usage limits.

Automation must not send duplicate reminders after retries.

---

# 13\. WHATSAPP AND NOTIFICATION ARCHITECTURE

Channels:

- WhatsApp Cloud API.
- SMS.
- Email.
- Mobile push.
- In-app notifications.

WhatsApp must follow Meta's current policies, approved templates, opt-in and messaging-window rules.

## 13.1 Message Workflow

``` mermaid
sequenceDiagram
    participant E as Business Event
    participant A as Automation Engine
    participant Q as Queue
    participant W as WhatsApp Provider
    participant C as Customer

    E->>A: Payment Due
    A->>A: Check Consent and Template
    A->>Q: Queue Message
    Q->>W: Send Approved Template
    W->>C: Deliver Message
    W-->>A: Delivery Webhook
    A->>A: Update Notification Log
```

Maintain separate records for message attempts, provider message IDs, delivery status and consent.

---

# 14\. PAYMENT AND BILLING ARCHITECTURE

There are two separate financial systems.

## 14.1 Webin10 SaaS Subscription Payments

Business owners pay Webin10 for platform access.

Payment providers:

- Razorpay.
- Cashfree.

## 14.2 Business Customer Payments

Gym members and coaching students pay their respective businesses.

The business should connect its own authorized merchant/payment account or use an appropriately approved connected-account/marketplace arrangement.

Webin10 must not assume that ordinary payment gateway credentials authorize collection and redistribution of third-party funds.

## 14.3 Payment Architecture

``` mermaid
flowchart TD
    A[Payment Request]
    A --> B[Payment Service]
    B --> C{Payment Context}
    C --> D[Webin10 Subscription]
    C --> E[Business Customer Invoice]

    D --> F[Platform Merchant Account]
    E --> G[Business Merchant Account]

    F --> H[Provider Webhook]
    G --> H

    H --> I[Signature Verification]
    I --> J[Idempotency Check]
    J --> K[Payment Reconciliation]
    K --> L[Invoice Allocation]
    L --> M[Receipt and Audit]
```

## 14.4 Payment Tables

- payment\_providers
- integration\_accounts
- invoices
- invoice\_items
- payments
- payment\_allocations
- refunds
- payment\_webhook\_events
- subscription\_invoices
- subscription\_payments
- usage\_records

Financial records must be retained as historical records. Use reversals and adjustment entries instead of silently rewriting transactions.

---

# 15\. DATABASE ARCHITECTURE

Database: PostgreSQL.

ORM: Prisma.

## 15.1 Identity and Platform

- users
- platform\_admins
- platform\_roles
- platform\_permissions
- platform\_role\_permissions
- platform\_admin\_sessions
- mfa\_credentials
- recovery\_codes

## 15.2 Tenant and Business

- tenants
- tenant\_members
- business\_profiles
- business\_categories
- branches
- branch\_members

## 15.3 RBAC

- roles
- permissions
- role\_permissions
- member\_roles
- custom\_role\_assignments

## 15.4 Configuration

- platform\_modules
- features
- category\_modules
- tenant\_modules
- feature\_flags
- tenant\_feature\_overrides
- configuration\_definitions
- configuration\_values
- configuration\_versions
- navigation\_items

## 15.5 CRM

- customers
- customer\_contacts
- customer\_notes
- customer\_documents
- customer\_tags
- customer\_assignments

## 15.6 Business Operations

- staff\_profiles
- membership\_plans
- memberships
- courses
- enrollments
- batches
- batch\_students
- attendance\_records
- schedules
- appointments
- services

## 15.7 Finance

- invoices
- invoice\_items
- payments
- payment\_allocations
- refunds
- credit\_notes
- recurring\_billing\_rules

## 15.8 Communication

- notification\_templates
- notification\_preferences
- notification\_logs
- communication\_channels
- integration\_accounts
- webhook\_events
- webhook\_deliveries

## 15.9 Automation

- automation\_rules
- automation\_triggers
- automation\_conditions
- automation\_actions
- automation\_executions
- automation\_logs

## 15.10 Platform Operations

- plans
- plan\_features
- tenant\_subscriptions
- subscription\_invoices
- subscription\_payments
- usage\_records
- support\_tickets
- support\_access\_requests
- audit\_logs
- system\_announcements

## 15.11 Database Design Rules

1. Tenant-owned tables must have tenant\_id.
2. All business relationships must enforce tenant consistency.
3. Important financial data must have immutable history.
4. Indexes must cover common filtering and joining fields.
5. Foreign keys must be explicit.
6. Soft delete must only be used where appropriate.
7. Audit data must have restricted mutation permissions.
8. All migrations must be version-controlled.
9. Database backup and recovery must be tested.
10. Customer personal information must have appropriate retention and deletion policies.

---

# 16\. COMPLETE API ARCHITECTURE

Base URL:

`https://api.webin10.com/api/v1`

## 16.1 API Namespaces

``` text
/api/v1/auth
/api/v1/super-admin
/api/v1/business
/api/v1/customer
/api/v1/webhooks
/api/v1/health
```

## 16.2 Super Admin APIs

### Dashboard

GET /super-admin/dashboard

GET /super-admin/analytics

GET /super-admin/system-health

### Tenant Management

GET /super-admin/tenants

POST /super-admin/tenants

GET /super-admin/tenants/:id

PATCH /super-admin/tenants/:id

POST /super-admin/tenants/:id/suspend

POST /super-admin/tenants/:id/activate

### Category Management

GET /super-admin/categories

POST /super-admin/categories

PATCH /super-admin/categories/:id

DELETE /super-admin/categories/:id

### Module Management

GET /super-admin/modules

POST /super-admin/modules

PATCH /super-admin/modules/:id

### Feature Management

GET /super-admin/features

POST /super-admin/features

PATCH /super-admin/features/:id

### Subscription Management

GET /super-admin/plans

POST /super-admin/plans

PATCH /super-admin/plans/:id

GET /super-admin/subscriptions

### Configuration

GET /super-admin/configurations

PATCH /super-admin/configurations/:key

GET /super-admin/configurations/:key/versions

POST /super-admin/configurations/:key/rollback

### Security

GET /super-admin/audit-logs

GET /super-admin/security/sessions

POST /super-admin/support-access-requests

POST /super-admin/support-access-requests/:id/approve

POST /super-admin/support-access-requests/:id/revoke

## 16.3 Business APIs

GET /business/dashboard

GET /business/profile

PATCH /business/profile

GET /business/customers

POST /business/customers

GET /business/customers/:id

PATCH /business/customers/:id

GET /business/staff

POST /business/staff

GET /business/attendance

POST /business/attendance

GET /business/invoices

POST /business/invoices

GET /business/payments

POST /business/payments

GET /business/memberships

POST /business/memberships

GET /business/courses

POST /business/courses

GET /business/batches

POST /business/batches

GET /business/automations

POST /business/automations

GET /business/reports/revenue

## 16.4 Customer APIs

GET /customer/me

GET /customer/businesses

POST /customer/businesses/:tenantId/select

GET /customer/dashboard

GET /customer/invoices

GET /customer/payments

GET /customer/attendance

GET /customer/schedule

GET /customer/notifications

POST /customer/support-requests

## 16.5 Standard API Response

``` json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "uuid"
  }
}
```

Error responses must include machine-readable error codes.

API requirements:

- DTO validation.
- Authentication guards.
- Permission guards.
- Tenant resolution.
- Rate limiting.
- Pagination.
- Filtering.
- Idempotency.
- Request correlation.
- Swagger documentation.
- Versioning.
- Integration testing.

---

# 17\. AUTHENTICATION AND SECURITY ARCHITECTURE

## 17.1 Authentication

- Email and password.
- Phone OTP.
- Password recovery.
- Refresh token rotation.
- Session management.
- Logout and revocation.
- Optional passkeys in future.

## 17.2 Super Admin Security

- MFA mandatory.
- Secure session cookies.
- Device/session management.
- Login rate limits.
- Sensitive-action confirmation.
- Separate platform identity.
- IP and device audit where appropriate.
- Privileged access monitoring.

## 17.3 Tenant Security

- Tenant membership verification.
- Branch-level authorization where required.
- Role-based permissions.
- RLS.
- Audit logs.
- Session revocation.

## 17.4 Customer Security

- Verified phone/email.
- Customer-business association checks.
- Customer-specific resource authorization.
- Secure mobile token storage.
- Device session management.

## 17.5 Compliance

Security and privacy design must account for:

- DPDP Act 2023 and applicable rules.
- Applicable payment gateway requirements.
- Applicable RBI requirements.
- OWASP ASVS.
- OWASP API Security Top 10.
- Data retention requirements.
- Customer consent.
- Data export and deletion workflows.

---

# 18\. EXACT MONOREPO FOLDER STRUCTURE

``` text
Webin10/
│
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── common/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── platform-identity/
│   │   │   │   ├── super-admin/
│   │   │   │   ├── tenants/
│   │   │   │   ├── business/
│   │   │   │   ├── branches/
│   │   │   │   ├── roles/
│   │   │   │   ├── permissions/
│   │   │   │   ├── categories/
│   │   │   │   ├── modules/
│   │   │   │   ├── configuration/
│   │   │   │   ├── feature-flags/
│   │   │   │   ├── audit/
│   │   │   │   ├── support-access/
│   │   │   │   ├── customers/
│   │   │   │   ├── billing/
│   │   │   │   ├── payments/
│   │   │   │   ├── automation/
│   │   │   │   └── notifications/
│   │   │   └── health/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   ├── super-admin/
│   │   ├── src/app/
│   │   ├── src/components/
│   │   ├── src/modules/
│   │   │   ├── overview/
│   │   │   ├── tenants/
│   │   │   ├── categories/
│   │   │   ├── modules/
│   │   │   ├── features/
│   │   │   ├── plans/
│   │   │   ├── subscriptions/
│   │   │   ├── integrations/
│   │   │   ├── configuration/
│   │   │   ├── support/
│   │   │   ├── security/
│   │   │   ├── audit/
│   │   │   └── analytics/
│   │   ├── src/services/
│   │   └── src/lib/
│   │
│   ├── business-admin/
│   │   ├── src/app/
│   │   ├── src/components/
│   │   ├── src/modules/
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   ├── staff/
│   │   │   ├── finance/
│   │   │   ├── memberships/
│   │   │   ├── courses/
│   │   │   ├── attendance/
│   │   │   ├── schedules/
│   │   │   ├── automation/
│   │   │   └── reports/
│   │   ├── src/services/
│   │   └── src/lib/
│   │
│   └── customer-mobile/
│       ├── app/
│       ├── src/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── services/
│       │   ├── hooks/
│       │   ├── store/
│       │   └── navigation/
│       └── assets/
│
├── packages/
│   ├── shared-types/
│   ├── validation/
│   ├── api-client/
│   ├── ui-tokens/
│   └── eslint-config/
│
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── redis/
│   ├── nginx/
│   ├── monitoring/
│   └── ci-cd/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_CONTRACTS.md
│   ├── SECURITY.md
│   ├── SUPER_ADMIN.md
│   ├── BUSINESS_ADMIN.md
│   ├── CUSTOMER_APP.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── README.md
```

---

# 19\. SUPER ADMIN FIRST — DETAILED EXECUTION ROADMAP

This section defines the actual implementation sequence.

## PHASE 0 — Architecture Foundation

Duration: 3–5 working days.

Tasks:

- Repository initialization.
- pnpm workspace.
- Backend bootstrap.
- PostgreSQL setup.
- Prisma setup.
- Environment validation.
- Docker development environment.
- Logging.
- Health checks.
- Swagger setup.
- CI pipeline.

Deliverable:

A functioning backend foundation.

## PHASE 1 — Platform Identity and Authentication

Duration: 4–6 working days.

Tasks:

- Platform Admin identity.
- User identity.
- Super Admin roles.
- Platform permissions.
- Login.
- MFA.
- Refresh token rotation.
- Session management.
- Password recovery.
- Account suspension.

Deliverable:

Secure Super Admin authentication.

## PHASE 2 — Tenant and Business Management

Duration: 4–6 working days.

Tasks:

- Tenant creation.
- Business profile.
- Business category.
- Branch creation.
- Tenant status.
- Tenant search.
- Tenant filters.
- Tenant details.
- Suspend and activate workflow.

Deliverable:

Super Admin can manage all business accounts.

## PHASE 3 — Category and Module Management

Duration: 4–5 working days.

Tasks:

- Business category CRUD.
- Module registry.
- Category-module mapping.
- Feature registry.
- Tenant module overrides.
- Module dependencies.
- Feature availability.

Deliverable:

Dynamic business template management.

## PHASE 4 — Subscription Management

Duration: 4–6 working days.

Tasks:

- Subscription plans.
- Plan features.
- Plan limits.
- Trial configuration.
- Subscription status.
- Subscription lifecycle.
- Usage limits.

Deliverable:

Super Admin can manage SaaS plans.

## PHASE 5 — Dynamic Configuration

Duration: 4–6 working days.

Tasks:

- Configuration definitions.
- Configuration values.
- Category defaults.
- Tenant overrides.
- Version history.
- Preview and publish.
- Rollback.
- Configuration validation.

Deliverable:

Centralized configuration control.

## PHASE 6 — Platform Integrations

Duration: 4–7 working days.

Tasks:

- Razorpay configuration.
- Cashfree configuration.
- WhatsApp provider settings.
- SMS provider settings.
- Email provider settings.
- Integration health.
- Webhook monitoring.

Deliverable:

Central integration administration.

## PHASE 7 — Audit and Support

Duration: 3–5 working days.

Tasks:

- Audit logs.
- Support tickets.
- Support access requests.
- Approval.
- Expiration.
- Revocation.
- Sensitive access monitoring.

Deliverable:

Secure support and governance system.

## PHASE 8 — Super Admin Frontend

Duration: 7–10 working days.

Build:

- Login.
- MFA.
- Dashboard.
- Sidebar.
- Tenant management.
- Category management.
- Module management.
- Feature management.
- Plans.
- Configurations.
- Integrations.
- Audit logs.
- Support access.
- System settings.

Deliverable:

Complete Super Admin Web Application.

## PHASE 9 — Super Admin Verification

Duration: 4–6 working days.

Tasks:

- Functional testing.
- API testing.
- Authorization testing.
- Security testing.
- Cross-tenant isolation.
- Configuration rollback testing.
- Performance testing.
- Backup verification.

Deliverable:

Super Admin Release Candidate.

Estimated Super Admin implementation: approximately 7–10 weeks for a small experienced team, depending on integration and security scope.

---

# 20\. BUSINESS ADMIN DEVELOPMENT ROADMAP

Start only after the Super Admin foundation and configuration interfaces are stable.

## Phase BA-1 — Business Onboarding

- Business registration.
- Category selection.
- Owner setup.
- Branch setup.
- Plan assignment.
- Business configuration.
- Dashboard initialization.

## Phase BA-2 — CRM

- Customer CRUD.
- Search.
- Filters.
- Customer profile.
- Customer history.
- Import and export.
- Staff assignment.

## Phase BA-3 — Business Operations

- Gym membership.
- Coaching courses.
- Batch management.
- Attendance.
- Schedules.
- Staff management.

## Phase BA-4 — Finance

- Invoices.
- Payment collection.
- Razorpay.
- Cashfree.
- Receipts.
- Outstanding reports.
- Reconciliation.

## Phase BA-5 — Communication and Automation

- WhatsApp connection.
- Notification templates.
- Payment reminders.
- Attendance reminders.
- Workflow management.
- Execution logs.

## Phase BA-6 — Analytics

- Revenue reports.
- Customer analytics.
- Attendance.
- Staff reports.
- Renewal reports.

---

# 21\. CUSTOMER MOBILE APPLICATION ROADMAP

Build after Business Admin core APIs stabilize.

## Mobile Phase 1

- App foundation.
- Authentication.
- OTP.
- Secure sessions.
- Customer profile.

## Mobile Phase 2

- Business selection.
- Customer dashboard.
- Membership and course information.
- Invoice history.

## Mobile Phase 3

- Payment.
- Receipt.
- Attendance.
- Class schedule.

## Mobile Phase 4

- Push notifications.
- Support requests.
- Multi-business switching.
- App security.
- Store release preparation.

---

# 22\. TESTING AND QUALITY ASSURANCE

## 22.1 Unit Tests

Every module must test its business logic.

## 22.2 Integration Tests

Verify database transactions, authentication, authorization and integrations.

## 22.3 End-to-End Tests

Test complete business workflows.

## 22.4 Security Tests

Mandatory scenarios:

| Scenario | Expected Result |
| --- | --- |
| Tenant A accesses Tenant B data | Denied |
| Staff accesses owner-only settings | Denied |
| Customer accesses another customer's invoice | Denied |
| Non-admin accesses Super Admin | Denied |
| Expired support access | Denied |
| Suspended tenant logs in | Denied |
| Duplicate payment webhook | No duplicate payment |
| Unauthorized configuration update | Denied |
| Revoked user session | Denied |

## 22.5 Performance Testing

Initial staging targets:

- 100 concurrent Super Admin requests.
- 500 concurrent Business Admin requests.
- 1,000 simulated customer requests.

These are initial test scenarios, not guaranteed production capacity.

Performance should be measured through p95 latency, database load, queue latency and error rate.

---

# 23\. INFRASTRUCTURE AND DEPLOYMENT

## 23.1 Production Domains

| Application | Domain |
| --- | --- |
| Main Website | webin10.com |
| Super Admin | admin.webin10.com |
| Business Admin | app.webin10.com |
| API | api.webin10.com |

Customer mobile app will consume the same versioned API.

## 23.2 Infrastructure

- AWS ECS or EC2 for backend.
- AWS RDS PostgreSQL.
- Redis.
- AWS S3.
- CloudFront.
- Cloudflare.
- Docker.
- GitHub Actions.
- Sentry.
- OpenTelemetry.

## 23.3 Environments

- Local Development.
- Development Server.
- Staging.
- Production.

Production must use isolated credentials and databases.

## 23.4 Deployment Diagram

``` mermaid
flowchart TD
    DEV[Developer]
    GIT[GitHub]
    CI[GitHub Actions]
    TEST[Automated Tests]
    BUILD[Docker Images]
    REG[Container Registry]
    STG[Staging]
    PROD[Production]

    DEV --> GIT
    GIT --> CI
    CI --> TEST
    TEST --> BUILD
    BUILD --> REG
    REG --> STG
    STG --> PROD
```

Production deployment must require release approval and database migration checks.

---

# 24\. MONITORING AND DISASTER RECOVERY

Monitor:

- API availability.
- API response time.
- Error rate.
- Database performance.
- Redis health.
- Queue depth.
- Failed jobs.
- WhatsApp delivery.
- Payment webhook failures.
- Storage usage.

Backup strategy:

- Automated encrypted database backups.
- Point-in-time recovery where supported.
- Backup retention policy.
- Regular restore testing.
- Incident recovery documentation.

Suggested initial objective:

- Availability target: 99.9%.
- Recovery Point Objective: 15 minutes.
- Recovery Time Objective: 4 hours.

These are targets requiring infrastructure and operational validation.

---

# 25\. PRODUCTION READINESS CHECKLIST

## Super Admin

- [ ] Secure authentication.
- [ ] MFA.
- [ ] Platform roles.
- [ ] Dashboard.
- [ ] Tenant management.
- [ ] Category management.
- [ ] Module management.
- [ ] Feature flags.
- [ ] Plan management.
- [ ] Configuration engine.
- [ ] Integrations.
- [ ] Audit logs.
- [ ] Support access.
- [ ] Security testing.

## Business Admin

- [ ] Business onboarding.
- [ ] CRM.
- [ ] Staff management.
- [ ] Roles.
- [ ] Billing.
- [ ] Payments.
- [ ] Attendance.
- [ ] Memberships.
- [ ] Courses.
- [ ] Automation.
- [ ] Reports.

## Customer App

- [ ] Authentication.
- [ ] Profile.
- [ ] Business selection.
- [ ] Payments.
- [ ] Invoices.
- [ ] Attendance.
- [ ] Schedules.
- [ ] Notifications.
- [ ] Security.

## Platform Infrastructure

- [ ] Production database.
- [ ] RLS.
- [ ] Docker deployment.
- [ ] CI/CD.
- [ ] Monitoring.
- [ ] Backups.
- [ ] Disaster recovery.
- [ ] Security review.
- [ ] Load testing.

---

# 26\. ACCEPTANCE CRITERIA

The platform is not considered production-ready merely because the screens are complete.

It must satisfy the following conditions:

1. Super Admin can securely authenticate.
2. Super Admin can create and manage businesses.
3. Super Admin can manage categories and module configuration.
4. Super Admin can manage subscription plans.
5. Configuration changes are versioned and auditable.
6. Business owners can create isolated workspaces.
7. Tenant data cannot leak across businesses.
8. Business Admin permissions work correctly.
9. Customer identity is linked to the correct businesses.
10. Customer mobile app only exposes authorized information.
11. Payment records are reconciled.
12. Automation jobs are idempotent.
13. Failed jobs are recoverable.
14. Backups can be restored.
15. Monitoring and alerting work.
16. Critical security tests pass.

---

# 27\. FINAL ENGINEERING RECOMMENDATIONS

These decisions should remain architectural principles throughout development.

### 1\. Build Super Admin First

Do not begin by building CRM screens.

First build the platform's control system, tenant architecture, platform identity and configuration management.

### 2\. Avoid Early Microservices

Use a modular monolith and independently scalable background workers.

### 3\. Treat Multi-Tenancy as a Security Boundary

Every business's data must remain isolated.

### 4\. Separate Platform and Tenant Permissions

A business owner must never gain Super Admin privileges.

### 5\. Build Configuration-Driven Business Templates

Adding a new supported business category should not require rebuilding the entire platform.

### 6\. Keep Financial Records Immutable

Maintain auditable payment and invoice histories.

### 7\. Use Event-Driven Automation

Do not run notification and payment reminder operations directly inside normal API requests.

### 8\. Design for Mobile from the Beginning

Customer APIs must work independently of the mobile user interface.

### 9\. Do Not Overbuild AI Initially

First establish reliable customer, billing and automation data. Add AI only after those workflows are trustworthy.

### 10\. Prioritize Reliability Over Feature Count

A reliable payment reminder is more valuable than ten unfinished AI features.

---

# 28\. FINAL PROJECT DEVELOPMENT ORDER

``` mermaid
flowchart TD
    A[Webin10 Architecture]
    A --> B[Backend Foundation]
    B --> C[Platform Identity and Security]
    C --> D[Super Admin Backend]
    D --> E[Super Admin Frontend]
    E --> F[Super Admin Testing]
    F --> G[Business Admin Backend]
    G --> H[Business Admin Frontend]
    H --> I[Customer API]
    I --> J[Customer Mobile App]
    J --> K[Complete Integration Testing]
    K --> L[Production Deployment]
    L --> M[Scale and Expand Business Categories]
```

## FINAL PROJECT PRINCIPLE

**Webin10 is not just a CRM or WhatsApp automation tool. It is a configurable, multi-tenant Business Operating System.**

Its foundation must be designed around:

- Platform governance.
- Secure tenant isolation.
- Dynamic configuration.
- Business operations.
- Financial management.
- Event-driven automation.
- Customer experience.
- Scalable infrastructure.

**Development priority is fixed:**

1. Super Admin Panel.
2. Business Admin Panel.
3. Customer Mobile App.

Every subsequent development decision must remain consistent with this architecture unless an explicit architecture review approves a change.

**Document End — Webin10 Technical Architecture Specification v1.0**