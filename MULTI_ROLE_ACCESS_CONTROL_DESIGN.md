# 🎭 MULTI-ROLE ACCESS CONTROL SYSTEM - ROBUST DESIGN

## 📋 Executive Summary

Design a **flexible, context-aware multi-role system** where:
- ✅ Single user can have MULTIPLE roles
- ✅ Roles can be DIFFERENT for each project
- ✅ User can switch between roles dynamically
- ✅ Same person can be Sales Manager in one project, Agent in another, Customer in third
- ✅ Works across projects within same tenant
- ✅ Can even work across different tenants
- ✅ Robust access control based on project-role context

**Real-World Example:**
```
Ramesh Kumar (user_id: "ramesh123")
├─ In Green Valley Project
│  └─ Role: Sales Manager (manages team, views all data)
├─ In Krishna Residency Project  
│  └─ Role: Agent (sells properties, manages leads)
├─ In Sun City Project
│  └─ Role: Customer (buying property for self)
└─ In Lake View Project (Different Tenant!)
   └─ Role: Agent (part-time work)
```

---

## 🎯 USER ROLES HIERARCHY

### System Roles (Ordered by Power Level)

1. **Tenant Admin** (Highest Power)
   - Full control over entire tenant
   - Can assign any role to any user in any project
   - Sees all data across all projects
   - Cannot be combined with other roles in same tenant

2. **Project Admin**
   - Full control over specific project(s)
   - Can assign roles within their projects
   - Sees all data in assigned projects
   - CAN have other roles in different projects

3. **Sales Manager**
   - Manages sales team in specific project
   - Views team performance and all project data
   - Can reassign leads within team
   - CAN be Agent in another project

4. **Agent** (Sales Agent)
   - Sells properties in specific project
   - Manages own leads and customers
   - Limited data access (own leads only)
   - CAN be Customer in another project

5. **Supervisor**
   - Oversees operations in specific project
   - Views reports and monitors progress
   - No direct sales capability

6. **Customer**
   - Buys/books properties
   - Views only own bookings and payments
   - Most restricted role
   - Even staff can be customers!

7. **Vendor**
   - Provides services to project
   - Submits bills and receives payments
   - Very limited access

---

## 🗄️ DATABASE SCHEMA DESIGN

### 1. **users** Collection (Identity Only)
```javascript
{
  id: "user123",
  email: "ramesh@example.com",
  name: "Ramesh Kumar",
  phone: "9999999999",
  password_hash: "...",
  
  // NO role field here! Roles are in role_assignments
  
  created_at: "2024-01-01T00:00:00Z",
  is_active: true
}
```

**Key Changes:**
- ❌ Remove `tenant_id` (user can work in multiple tenants)
- ❌ Remove `role` (user has multiple roles)
- ✅ User is just an identity
- ✅ Roles and access determined by role_assignments

---

### 2. **tenants** Collection (Existing)
```javascript
{
  id: "tenant123",
  company_name: "XYZ Real Estate",
  email: "admin@xyz.com",
  phone: "9999999999",
  address: "Hyderabad",
  subscription_plan: "enterprise",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z"
}
```

---

### 3. **roles** Collection (System Roles)
```javascript
{
  id: "role_tenant_admin",
  name: "Tenant Admin",
  slug: "tenant_admin",
  level: 1,  // Power level (1 = highest)
  permissions: [
    "manage_all_projects",
    "manage_users",
    "manage_roles",
    "view_all_data",
    "manage_billing"
  ],
  description: "Full control over tenant",
  is_system_role: true  // Cannot be deleted
}

{
  id: "role_project_admin",
  name: "Project Admin",
  slug: "project_admin",
  level: 2,
  permissions: [
    "manage_project",
    "manage_project_users",
    "view_all_project_data",
    "manage_properties"
  ],
  is_system_role: true
}

{
  id: "role_sales_manager",
  name: "Sales Manager",
  slug: "sales_manager",
  level: 3,
  permissions: [
    "view_team_data",
    "manage_team_leads",
    "view_reports",
    "reassign_leads"
  ],
  is_system_role: true
}

{
  id: "role_agent",
  name: "Agent",
  slug: "agent",
  level: 4,
  permissions: [
    "manage_own_leads",
    "create_bookings",
    "view_own_data"
  ],
  is_system_role: true
}

{
  id: "role_customer",
  name: "Customer",
  slug: "customer",
  level: 6,
  permissions: [
    "view_own_bookings",
    "make_payments",
    "view_own_properties"
  ],
  is_system_role: true
}
```

---

### 4. **role_assignments** Collection (THE KEY TABLE!)
```javascript
{
  id: "assignment123",
  user_id: "user123",           // Ramesh Kumar
  tenant_id: "tenant456",       // XYZ Real Estate
  project_id: "project789",     // Green Valley (optional: null for tenant-level roles)
  role_id: "role_sales_manager", // Sales Manager role
  
  assigned_by: "user_admin",    // Who assigned this role
  assigned_at: "2024-01-01T00:00:00Z",
  
  is_active: true,              // Can be deactivated without deleting
  
  // Optional: Time-based roles
  valid_from: "2024-01-01T00:00:00Z",
  valid_until: null,            // null = no expiry
  
  // Optional: Context metadata
  metadata: {
    reporting_to: "user_manager",  // For agent/manager hierarchy
    team_id: "team_sales_a",       // For team-based roles
    commission_percentage: 2.5,    // Role-specific settings
    target_monthly: 10             // Role-specific targets
  }
}
```

**Key Points:**
- One row = One user + One role + One project (or tenant-level)
- Same user can have MULTIPLE rows (multiple roles)
- `project_id` can be null for tenant-level roles (Tenant Admin)
- Each assignment is independent and can be activated/deactivated
- Metadata allows role-specific configurations

**Example Data:**
```javascript
// Ramesh has 4 different roles across 3 projects

// Assignment 1: Sales Manager in Green Valley
{
  id: "a1",
  user_id: "ramesh123",
  tenant_id: "tenant_xyz",
  project_id: "project_green_valley",
  role_id: "role_sales_manager",
  is_active: true
}

// Assignment 2: Agent in Krishna Residency  
{
  id: "a2",
  user_id: "ramesh123",
  tenant_id: "tenant_xyz",
  project_id: "project_krishna",
  role_id: "role_agent",
  is_active: true
}

// Assignment 3: Customer in Sun City
{
  id: "a3",
  user_id: "ramesh123",
  tenant_id: "tenant_xyz",
  project_id: "project_sun_city",
  role_id: "role_customer",
  is_active: true
}

// Assignment 4: Agent in Lake View (Different tenant!)
{
  id: "a4",
  user_id: "ramesh123",
  tenant_id: "tenant_abc",  // Different tenant!
  project_id: "project_lake_view",
  role_id: "role_agent",
  is_active: true
}
```

---

### 5. **projects** Collection (Enhanced)
```javascript
{
  id: "project123",
  project_name: "Green Valley Phase 1",
  tenant_id: "tenant456",
  
  // Primary project admin (for quick lookup)
  primary_admin_id: "user789",
  
  // Other fields
  description: "Luxury apartments",
  location: "Gachibowli",
  created_by: "user_admin",
  created_at: "2024-01-01T00:00:00Z"
}
```

**Note:** Actual project access is determined by role_assignments, not by a field in projects

---

### 6. **user_sessions** Collection (NEW - For Role Context)
```javascript
{
  id: "session123",
  user_id: "user123",
  token: "jwt_token_here",
  
  // Current active context
  active_tenant_id: "tenant456",
  active_project_id: "project789",
  active_role_id: "role_sales_manager",
  
  created_at: "2024-01-01T10:00:00Z",
  expires_at: "2024-01-02T10:00:00Z",
  
  // Session metadata
  ip_address: "192.168.1.1",
  user_agent: "Mozilla/5.0..."
}
```

**Purpose:**
- Track user's current working context
- User can switch between roles without re-login
- Security: Track active sessions per user

---

## 🔄 ROLE CONTEXT SWITCHING

### Scenario: User with Multiple Roles

**On Login:**
```
1. User logs in with email/password
2. System queries role_assignments to find all roles
3. If user has multiple roles:
   - Show "Select Your Context" screen
   - List all role-project combinations
4. User selects: "Sales Manager - Green Valley"
5. Session is created with active context
6. User proceeds to dashboard based on selected role
```

**During Session:**
```
User can switch context anytime:
- Click "Switch Role" button in header
- Select different role-project combination
- Dashboard/UI updates based on new role
- No re-login required
```

**UI Example:**
```
┌─────────────────────────────────────────┐
│  Ramesh Kumar 👤                   ⚙️   │
│  Sales Manager @ Green Valley      ▼   │
├─────────────────────────────────────────┤
│  Switch Context:                        │
│                                         │
│  ✅ Sales Manager @ Green Valley        │
│  ⭕ Agent @ Krishna Residency           │
│  ⭕ Customer @ Sun City                  │
│  ⭕ Agent @ Lake View (ABC Estates)     │
└─────────────────────────────────────────┘
```

---

## 🔐 ACCESS CONTROL LOGIC

### Permission Checking System

**Three-Layer Security:**

#### Layer 1: Role-Based Permissions
```python
# Check if role has permission
def has_permission(user_id, permission_name, tenant_id, project_id):
    # Get user's role in this context
    assignment = get_role_assignment(user_id, tenant_id, project_id)
    
    if not assignment:
        return False
    
    role = get_role(assignment.role_id)
    
    return permission_name in role.permissions
```

#### Layer 2: Project-Level Access
```python
# Check if user can access project
def can_access_project(user_id, project_id):
    # Check if user has ANY role in this project
    assignments = db.role_assignments.find({
        "user_id": user_id,
        "project_id": project_id,
        "is_active": True
    })
    
    return len(assignments) > 0
```

#### Layer 3: Data-Level Access
```python
# Check if user can access specific data
def can_access_lead(user_id, lead_id):
    lead = db.leads.find_one({"id": lead_id})
    
    # Get user's role in lead's project
    assignment = get_role_assignment(user_id, lead.tenant_id, lead.project_id)
    
    if not assignment:
        return False
    
    role = get_role(assignment.role_id)
    
    # Tenant Admin: Can see all
    if role.slug == "tenant_admin":
        return True
    
    # Project Admin: Can see all in project
    if role.slug == "project_admin":
        return True
    
    # Sales Manager: Can see team's leads
    if role.slug == "sales_manager":
        return lead.assigned_to in get_team_members(user_id)
    
    # Agent: Can see only own leads
    if role.slug == "agent":
        return lead.assigned_to == user_id
    
    return False
```

---

## 🎯 API ENDPOINT EXAMPLES

### 1. GET /api/auth/login

**Request:**
```json
{
  "email": "ramesh@example.com",
  "password": "password123"
}
```

**Response (User has multiple roles):**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com"
  },
  "contexts": [
    {
      "tenant_id": "tenant_xyz",
      "tenant_name": "XYZ Real Estate",
      "project_id": "project_green_valley",
      "project_name": "Green Valley",
      "role_id": "role_sales_manager",
      "role_name": "Sales Manager"
    },
    {
      "tenant_id": "tenant_xyz",
      "tenant_name": "XYZ Real Estate",
      "project_id": "project_krishna",
      "project_name": "Krishna Residency",
      "role_id": "role_agent",
      "role_name": "Agent"
    },
    {
      "tenant_id": "tenant_xyz",
      "tenant_name": "XYZ Real Estate",
      "project_id": "project_sun_city",
      "project_name": "Sun City",
      "role_id": "role_customer",
      "role_name": "Customer"
    }
  ],
  "message": "Please select your context"
}
```

---

### 2. POST /api/auth/select-context

**Request:**
```json
{
  "tenant_id": "tenant_xyz",
  "project_id": "project_green_valley",
  "role_id": "role_sales_manager"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "session": {
    "user_id": "user123",
    "active_tenant_id": "tenant_xyz",
    "active_project_id": "project_green_valley",
    "active_role_id": "role_sales_manager",
    "permissions": [
      "view_team_data",
      "manage_team_leads",
      "view_reports"
    ]
  }
}
```

---

### 3. POST /api/auth/switch-context

**Request:**
```json
{
  "tenant_id": "tenant_xyz",
  "project_id": "project_krishna",
  "role_id": "role_agent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Context switched to Agent @ Krishna Residency",
  "session": {
    "active_role": "Agent",
    "active_project": "Krishna Residency"
  }
}
```

---

### 4. GET /api/projects

**Depends on Current Context:**

**If Tenant Admin:**
```javascript
// Returns all projects in tenant
const projects = await db.projects.find({
  tenant_id: session.active_tenant_id
})
```

**If Project Admin:**
```javascript
// Returns projects where user is Project Admin
const assignments = await db.role_assignments.find({
  user_id: user_id,
  tenant_id: session.active_tenant_id,
  role_id: "role_project_admin",
  is_active: true
})

const project_ids = assignments.map(a => a.project_id)

const projects = await db.projects.find({
  id: {"$in": project_ids}
})
```

**If Sales Manager / Agent / Customer:**
```javascript
// Returns projects where user has ANY role
const assignments = await db.role_assignments.find({
  user_id: user_id,
  tenant_id: session.active_tenant_id,
  is_active: true
})

const project_ids = assignments.map(a => a.project_id)

const projects = await db.projects.find({
  id: {"$in": project_ids}
})
```

---

### 5. GET /api/leads

**Access Based on Role:**

**Tenant Admin:**
```javascript
// All leads in tenant
const leads = await db.leads.find({
  tenant_id: session.active_tenant_id
})
```

**Project Admin:**
```javascript
// All leads in assigned projects
const leads = await db.leads.find({
  project_id: session.active_project_id
})
```

**Sales Manager:**
```javascript
// Team's leads only
const team_members = await get_team_members(user_id, session.active_project_id)
const leads = await db.leads.find({
  project_id: session.active_project_id,
  assigned_to: {"$in": team_members}
})
```

**Agent:**
```javascript
// Own leads only
const leads = await db.leads.find({
  project_id: session.active_project_id,
  assigned_to: user_id
})
```

**Customer:**
```javascript
// No access to leads
return []
```

---

## 👥 ROLE ASSIGNMENT WORKFLOWS

### Workflow 1: Tenant Admin Assigns Role

**Steps:**
```
1. Tenant Admin goes to "Manage Users"
2. Selects user "Ramesh Kumar"
3. Clicks "Assign Role"
4. Selects:
   - Project: Green Valley
   - Role: Sales Manager
5. Submits

Backend:
- Creates role_assignment with:
  - user_id = ramesh123
  - tenant_id = tenant_xyz
  - project_id = project_green_valley
  - role_id = role_sales_manager
  - assigned_by = admin_id
  - is_active = true
```

---

### Workflow 2: Project Admin Assigns Role in Their Project

**Steps:**
```
1. Project Admin (Priya) in "Krishna Residency" project
2. Goes to "Team Management"
3. Selects user "Ramesh Kumar"
4. Clicks "Add to Team"
5. Selects Role: Agent
6. Submits

Backend Validation:
- Check: Is Priya Project Admin of Krishna Residency? ✅
- Check: Can Project Admin assign Agent role? ✅
- Create role_assignment
```

---

### Workflow 3: User Requests Access to Project

**Steps:**
```
1. Ramesh goes to "Browse Projects" (public)
2. Sees "Lake View" project (different tenant)
3. Clicks "Join as Agent"
4. Fills request form
5. Submits

Backend:
- Creates access_request with:
  - user_id = ramesh123
  - tenant_id = tenant_abc
  - project_id = lake_view
  - requested_role = agent
  - status = pending

6. Tenant Admin of Lake View gets notification
7. Reviews request and approves
8. role_assignment is created
9. Ramesh gets notification and can access
```

---

## 🎨 UI/UX DESIGN

### 1. Context Selector (Header Component)

```
┌────────────────────────────────────────────────┐
│  🏢 RETOERP                                    │
│                                                │
│  👤 Ramesh Kumar                          🔔 ⚙️│
│  Sales Manager @ Green Valley            [▼] │
├────────────────────────────────────────────────┤
│  ⚡ Quick Switch Context                      │
│                                                │
│  Current Tenant: XYZ Real Estate               │
│                                                │
│  ✅ 👔 Sales Manager @ Green Valley           │
│     • Manage team                             │
│     • View reports                            │
│                                                │
│  ⭕ 👤 Agent @ Krishna Residency              │
│     • Manage leads                            │
│     • Create bookings                         │
│                                                │
│  ⭕ 🏠 Customer @ Sun City                    │
│     • View my property                        │
│     • Make payments                           │
│                                                │
│  ────────────────────────────                 │
│  Other Tenants:                               │
│                                                │
│  ⭕ 👤 Agent @ Lake View (ABC Estates)        │
│                                                │
│  [Manage All Roles] [Logout]                  │
└────────────────────────────────────────────────┘
```

---

### 2. Dashboard (Context-Aware)

**A. When Sales Manager @ Green Valley:**
```
┌────────────────────────────────────────────────┐
│  📊 Sales Manager Dashboard                    │
│  Green Valley Project                          │
├────────────────────────────────────────────────┤
│                                                │
│  Team Performance Today:                       │
│  • Total Team: 5 agents                       │
│  • Team Leads: 45                             │
│  • Team Conversions: 8                        │
│  • Team Target: 60% achieved                  │
│                                                │
│  [View Team] [Assign Leads] [Reports]         │
│                                                │
│  My Personal Stats:                           │
│  • My Leads: 12                               │
│  • My Conversions: 3                          │
│                                                │
│  Recent Team Activity:                        │
│  • Suresh closed a deal (₹50L)                │
│  • Priya added 3 new leads                    │
└────────────────────────────────────────────────┘
```

**B. When Agent @ Krishna Residency:**
```
┌────────────────────────────────────────────────┐
│  📊 Agent Dashboard                            │
│  Krishna Residency Project                     │
├────────────────────────────────────────────────┤
│                                                │
│  My Leads: 12                                 │
│  My Bookings: 2                               │
│  My Target: 5/month (40% achieved)            │
│                                                │
│  [Add Lead] [My Properties] [Commission]      │
│                                                │
│  Today's Follow-ups (5):                      │
│  • Call Ramesh (Hot lead - 3BHK)              │
│  • Site visit with Priya (2 PM)               │
│  • Send payment link to Suresh                │
│                                                │
│  ℹ️ Note: You are viewing as Agent            │
└────────────────────────────────────────────────┘
```

**C. When Customer @ Sun City:**
```
┌────────────────────────────────────────────────┐
│  🏠 My Property Dashboard                      │
│  Sun City Project                              │
├────────────────────────────────────────────────┤
│                                                │
│  My Booking:                                  │
│  • Plot A-105, 1500 sq.ft                     │
│  • Total Cost: ₹65,00,000                     │
│  • Paid: ₹15,00,000 (23%)                     │
│  • Next Payment: ₹5,00,000 (Due: Dec 15)     │
│                                                │
│  [Make Payment] [View Agreement] [Contact]    │
│                                                │
│  Construction Updates:                        │
│  • Foundation work: 100% ✅                   │
│  • Structure work: 60% 🚧                     │
│  • Expected possession: Dec 2025              │
│                                                │
│  [View Photos] [Site Visit Request]           │
│                                                │
│  ℹ️ Note: You are viewing as Customer         │
└────────────────────────────────────────────────┘
```

---

### 3. Role Management Page (Tenant Admin)

```
┌──────────────────────────────────────────────────┐
│  Manage User Roles                               │
│  User: Ramesh Kumar (ramesh@example.com)         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Current Role Assignments (3):                   │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 👔 Sales Manager                           │ │
│  │ Project: Green Valley                      │ │
│  │ Assigned: Jan 15, 2024 by Admin           │ │
│  │ Status: ✅ Active                          │ │
│  │ [View Details] [Deactivate] [Remove]      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 👤 Agent                                   │ │
│  │ Project: Krishna Residency                 │ │
│  │ Assigned: Jan 20, 2024 by Priya (PA)      │ │
│  │ Status: ✅ Active                          │ │
│  │ [View Details] [Deactivate] [Remove]      │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ 🏠 Customer                                │ │
│  │ Project: Sun City                          │ │
│  │ Booking: Plot A-105                        │ │
│  │ Status: ✅ Active                          │ │
│  │ [View Booking] [Payment History]          │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  [+ Assign New Role]                            │
└──────────────────────────────────────────────────┘
```

---

### 4. Assign Role Modal

```
┌──────────────────────────────────────────────────┐
│  Assign Role to Ramesh Kumar                     │
│                                             [×]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Select Project *                                │
│  [Select Project ▼]                             │
│    • Green Valley                                │
│    • Krishna Residency                           │
│    • Sun City                                    │
│    • Lake View                                   │
│    • (Create New Project)                        │
│                                                  │
│  Select Role *                                   │
│  [Select Role ▼]                                │
│    • Project Admin                               │
│    • Sales Manager                               │
│    • Agent                                       │
│    • Supervisor                                  │
│                                                  │
│  Role Settings (Optional):                       │
│                                                  │
│  Reports To (For Agent/Sales Manager):           │
│  [Select Manager ▼]                             │
│                                                  │
│  Commission % (For Agent):                       │
│  [2.5_____] %                                   │
│                                                  │
│  Monthly Target (For Agent):                     │
│  [10______] units                               │
│                                                  │
│  Valid Until (Optional):                         │
│  [No Expiry ▼]                                  │
│    • No Expiry                                   │
│    • 3 Months                                    │
│    • 6 Months                                    │
│    • 1 Year                                      │
│    • Custom Date                                 │
│                                                  │
│  ℹ️ This user will be able to switch to this    │
│     role anytime from their dashboard.          │
│                                                  │
│  [Cancel] [Assign Role]                         │
└──────────────────────────────────────────────────┘
```

---

## 🔒 SECURITY & VALIDATION

### 1. Prevent Conflicting Roles

**Rule:** User cannot have conflicting high-power roles in same project

```python
def validate_role_assignment(user_id, tenant_id, project_id, new_role_id):
    # Get user's existing roles in this project
    existing = db.role_assignments.find({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "project_id": project_id,
        "is_active": True
    })
    
    new_role = get_role(new_role_id)
    
    for assignment in existing:
        existing_role = get_role(assignment.role_id)
        
        # Check conflicts
        if new_role.slug == "tenant_admin":
            raise Exception("Tenant Admin cannot have other roles in same tenant")
        
        if existing_role.slug == "tenant_admin":
            raise Exception("User is already Tenant Admin")
        
        if new_role.slug == "project_admin" and existing_role.slug == "project_admin":
            raise Exception("User is already Project Admin of this project")
    
    return True
```

---

### 2. Permission Inheritance

**Rule:** Higher roles inherit lower role permissions

```python
def get_effective_permissions(user_id, tenant_id, project_id):
    # Get all roles user has in this context
    assignments = db.role_assignments.find({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "project_id": project_id,
        "is_active": True
    })
    
    all_permissions = set()
    
    for assignment in assignments:
        role = get_role(assignment.role_id)
        all_permissions.update(role.permissions)
    
    # If user has tenant_admin role at tenant level, they have ALL permissions
    tenant_admin = db.role_assignments.find_one({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role_id": "role_tenant_admin",
        "project_id": None,  # Tenant-level
        "is_active": True
    })
    
    if tenant_admin:
        return ["*"]  # All permissions
    
    return list(all_permissions)
```

---

### 3. Cross-Tenant Security

**Rule:** User can work in multiple tenants, but data is strictly isolated

```python
# Every API call must validate tenant context
@router.get("/api/leads")
async def get_leads(session: dict = Depends(get_current_session)):
    # Get leads ONLY from active tenant
    leads = await db.leads.find({
        "tenant_id": session["active_tenant_id"],  # CRITICAL!
        "project_id": session["active_project_id"]
    })
    
    # Apply role-based filtering
    filtered_leads = filter_by_role(leads, session)
    
    return filtered_leads
```

---

## 🧪 TEST SCENARIOS

### Test Case 1: User with Multiple Roles Logs In
```
Given: Ramesh has 3 roles (Sales Manager, Agent, Customer)
When: Ramesh logs in
Then:
  - Login succeeds
  - System shows "Select Context" screen
  - Lists all 3 role-project combinations
  - User must select one to proceed
  - After selection, dashboard reflects selected role
```

---

### Test Case 2: User Switches Role Context
```
Given: Ramesh is logged in as "Sales Manager @ Green Valley"
When: Ramesh clicks "Switch Context" and selects "Agent @ Krishna Residency"
Then:
  - Context switches without re-login
  - Dashboard changes to Agent view
  - Navigation menu updates (shows agent-specific options)
  - Data access changes (sees only agent-level data)
  - Header shows "Agent @ Krishna Residency"
```

---

### Test Case 3: Access Control - Sales Manager Views Team Data
```
Given: Ramesh is "Sales Manager @ Green Valley"
  And: Green Valley has agents: Suresh, Priya, Vijay
When: Ramesh goes to "Team Leads" page
Then:
  - Sees leads assigned to Suresh, Priya, Vijay
  - Sees own leads
  - Does NOT see leads from other projects
  - Can reassign leads within team
```

---

### Test Case 4: Access Control - Agent Cannot See Other Agent's Leads
```
Given: Ramesh is "Agent @ Krishna Residency"
  And: Suresh is also "Agent @ Krishna Residency"
When: Ramesh goes to "Leads" page
Then:
  - Sees only own leads
  - Does NOT see Suresh's leads
  - Cannot access Suresh's lead detail page
  - Gets 403 if tries to access Suresh's lead via URL
```

---

### Test Case 5: Cross-Tenant Access
```
Given: Ramesh works in 2 tenants:
  - XYZ Real Estate (tenant_xyz)
  - ABC Estates (tenant_abc)
When: Ramesh is in "Agent @ Lake View (ABC Estates)" context
Then:
  - Sees ONLY ABC Estates data
  - Cannot access XYZ Real Estate data
  - Projects list shows only ABC Estates projects
  - Leads list shows only ABC Estates leads
  - Switching to XYZ role changes all data access
```

---

### Test Case 6: Tenant Admin Assigns Conflicting Role
```
Given: Ramesh is already "Sales Manager @ Green Valley"
When: Tenant Admin tries to assign "Agent @ Green Valley" to Ramesh
Then:
  - System allows it (not a conflict - different hierarchy levels)
  - Ramesh now has 2 roles in same project
  - Ramesh can switch between them
  - Effective permissions = Union of both roles
```

---

### Test Case 7: User as Both Agent and Customer
```
Given: Ramesh is "Agent @ Krishna Residency"
  And: Ramesh wants to buy property in "Sun City"
When: Ramesh books Plot A-105 in Sun City
Then:
  - System automatically creates "Customer" role assignment
  - Ramesh now has 2 roles:
    - Agent @ Krishna Residency (work)
    - Customer @ Sun City (personal)
  - When in Customer context, Ramesh sees only customer dashboard
  - Data is completely separated
```

---

## 📊 PERFORMANCE OPTIMIZATION

### 1. Caching User Roles
```python
# Cache user's roles in Redis for fast access
@cache(key="user_roles:{user_id}", ttl=300)  # 5 minutes
async def get_user_roles(user_id):
    assignments = await db.role_assignments.find({
        "user_id": user_id,
        "is_active": True
    }).to_list()
    
    return assignments

# Invalidate cache when roles change
async def assign_role(user_id, ...):
    # ... create assignment ...
    cache.delete(f"user_roles:{user_id}")
```

---

### 2. Database Indexes
```javascript
// Critical indexes for performance
db.role_assignments.createIndex({ 
  "user_id": 1, 
  "tenant_id": 1, 
  "is_active": 1 
})

db.role_assignments.createIndex({ 
  "user_id": 1, 
  "project_id": 1, 
  "is_active": 1 
})

db.role_assignments.createIndex({ 
  "project_id": 1, 
  "role_id": 1, 
  "is_active": 1 
})

// For quick role lookups
db.roles.createIndex({ "slug": 1 })

// For session management
db.user_sessions.createIndex({ "token": 1 })
db.user_sessions.createIndex({ "expires_at": 1 })
```

---

### 3. Efficient Permission Checks
```python
# Don't query database for every permission check
# Load permissions once in session

class SessionManager:
    def create_session(self, user_id, tenant_id, project_id, role_id):
        # Load all permissions upfront
        permissions = self.get_effective_permissions(
            user_id, tenant_id, project_id
        )
        
        session = {
            "user_id": user_id,
            "active_tenant_id": tenant_id,
            "active_project_id": project_id,
            "active_role_id": role_id,
            "permissions": permissions,  # Pre-loaded!
            "expires_at": datetime.now() + timedelta(hours=24)
        }
        
        return session
    
    def has_permission(self, session, permission_name):
        # Fast in-memory check, no database query
        return permission_name in session["permissions"]
```

---

## 🔄 MIGRATION PLAN (From Current System)

### Current State
- Users have `tenant_id` and `role` field
- Projects have `project_admin_id` field
- Simple one-role-per-user system

### Migration Steps

**Step 1: Create New Collections**
```python
# Create roles collection with system roles
await db.roles.insert_many([
    {
        "id": "role_tenant_admin",
        "name": "Tenant Admin",
        "slug": "tenant_admin",
        "level": 1,
        "permissions": [...],
        "is_system_role": True
    },
    # ... other roles
])

# Create role_assignments collection (empty initially)
# Will populate in Step 3
```

**Step 2: Migrate Existing Users**
```python
# For each existing user
users = await db.users.find({}).to_list()

for user in users:
    # Create role assignment based on existing role
    if user.get("role") == "tenant_admin":
        await db.role_assignments.insert_one({
            "id": generate_id(),
            "user_id": user["id"],
            "tenant_id": user["tenant_id"],
            "project_id": None,  # Tenant-level
            "role_id": "role_tenant_admin",
            "assigned_by": "system_migration",
            "assigned_at": datetime.now(),
            "is_active": True
        })
    
    elif user.get("role") == "project_admin":
        # Find all projects assigned to this user
        projects = await db.projects.find({
            "project_admin_id": user["id"]
        }).to_list()
        
        for project in projects:
            await db.role_assignments.insert_one({
                "id": generate_id(),
                "user_id": user["id"],
                "tenant_id": project["tenant_id"],
                "project_id": project["id"],
                "role_id": "role_project_admin",
                "assigned_by": "system_migration",
                "assigned_at": datetime.now(),
                "is_active": True
            })
```

**Step 3: Update Backend Code**
```python
# Update all APIs to use role_assignments instead of user.role
# Update authentication to support context selection
# Update permission checks to use new system
```

**Step 4: Deploy & Test**
```python
# Deploy new code
# Test all scenarios
# Monitor for issues
```

**Step 5: Cleanup (After 1 Month)**
```python
# Remove old fields
await db.users.update_many({}, {"$unset": {"role": "", "tenant_id": ""}})
await db.projects.update_many({}, {"$unset": {"project_admin_id": ""}})
```

---

## ❓ QUESTIONS FOR APPROVAL

Please review and confirm:

### 1. Role System Design
- ✅ Multi-role per user approach correct?
- ✅ 6 system roles sufficient? (Tenant Admin, Project Admin, Sales Manager, Agent, Supervisor, Customer, Vendor)
- ❓ Need more roles? (e.g., Marketing Manager, Finance Manager?)

### 2. Database Schema
- ✅ Remove `tenant_id` and `role` from users collection?
- ✅ Use `role_assignments` as source of truth?
- ✅ Add `user_sessions` for context tracking?

### 3. Context Switching
- ✅ Show context selector on login if multiple roles?
- ✅ Allow switching during session?
- ✅ UI design in header acceptable?

### 4. Access Control
- ✅ Three-layer security (role, project, data) correct?
- ✅ Higher roles inherit lower permissions?
- ✅ Cross-tenant isolation strict enough?

### 5. Features
- ✅ Same user can be agent in one project, customer in another?
- ✅ Same user can work across multiple tenants?
- ❓ Should we limit number of roles per user?
- ❓ Should roles expire automatically after certain period?

### 6. Implementation
- ❓ Migration plan acceptable?
- ❓ 6-8 week timeline okay?
- ❓ Start immediately after approval?

---

## 🎯 NEXT STEPS

After your approval:
1. ✅ Create roles collection with system roles
2. ✅ Create role_assignments collection structure
3. ✅ Implement context selection on login
4. ✅ Update all APIs with multi-role access control
5. ✅ Create role management pages
6. ✅ Migrate existing users to new system
7. ✅ Test all scenarios thoroughly
8. ✅ Deploy to production

---

**Document Prepared By:** Agent E1
**Date:** November 28, 2024
**Status:** Awaiting Client Approval ⏳
**Complexity:** High (Multi-role, multi-tenant, multi-project)
