# 🏗️ PROJECT LEVEL ACCESS CONTROL SYSTEM - DESIGN DOCUMENT

## 📋 Executive Summary

Design a hierarchical project management system where:
- **Tenants** have full control over all projects and can create Project Admins
- **Project Admins** can only see and manage assigned projects
- Projects can be created by either Tenant or Project Admin
- Clear access boundaries and permissions

---

## 🎯 USER ROLES & HIERARCHY

```
┌─────────────────────────────────────┐
│         TENANT ADMIN                │
│   (Full access to everything)       │
│                                     │
│  • Create Project Admins            │
│  • Create Projects                  │
│  • Assign Projects to Admins        │
│  • View ALL projects                │
│  • Manage ALL data                  │
└──────────┬──────────────────────────┘
           │
           │ creates & assigns
           │
           ▼
┌─────────────────────────────────────┐
│       PROJECT ADMIN                 │
│   (Limited to assigned projects)    │
│                                     │
│  • Create own projects              │
│  • View assigned projects ONLY      │
│  • Manage assigned project data     │
│  • Cannot see other admins' data    │
└─────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA DESIGN

### 1. **users** Collection (Existing - Enhanced)
```javascript
{
  id: "user123",
  email: "admin@example.com",
  name: "Project Admin Name",
  phone: "9999999999",
  tenant_id: "tenant123",
  role: "project_admin",  // New: tenant_admin, project_admin, agent, etc.
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  created_by: "tenant_admin_id"  // Who created this user
}
```

**New Field:**
- `role`: Distinguishes between tenant_admin and project_admin

---

### 2. **projects** Collection (Enhanced)
```javascript
{
  id: "project123",
  project_name: "Green Valley Phase 1",
  tenant_id: "tenant123",
  
  // NEW FIELDS FOR ACCESS CONTROL
  created_by: "user456",           // User who created this project
  project_admin_id: "user789",     // Assigned Project Admin (can be creator or assigned later)
  
  // Existing fields
  description: "Luxury apartments",
  location: "Gachibowli",
  city: "Hyderabad",
  state: "Telangana",
  total_units: 100,
  available_units: 75,
  sold_units: 20,
  blocked_units: 5,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z"
}
```

**New Fields:**
- `created_by`: User ID who created the project
- `project_admin_id`: User ID of the assigned Project Admin

**Access Rules:**
- Tenant Admin can see ALL projects where `tenant_id` matches
- Project Admin can see ONLY projects where `project_admin_id` = their user ID

---

### 3. **properties** Collection (Enhanced)
```javascript
{
  id: "property123",
  project_id: "project123",
  tenant_id: "tenant123",
  
  // Access is inherited from project
  // If user can access project, they can access its properties
  
  property_number: "A-101",
  area: 1200,
  price: 5000000,
  status_id: "status123",
  created_at: "2024-01-01T00:00:00Z"
}
```

**Access Rules:**
- User can access property IF they can access its parent project

---

### 4. **project_assignments** Collection (NEW - Optional but Recommended)
```javascript
{
  id: "assignment123",
  project_id: "project123",
  user_id: "user789",
  role: "project_admin",
  assigned_by: "tenant_admin_id",
  assigned_at: "2024-01-01T00:00:00Z",
  is_active: true
}
```

**Purpose:**
- Track assignment history
- Support multiple admins per project (future enhancement)
- Audit trail of who assigned whom

**Note:** For MVP, we can use `project_admin_id` in projects collection directly. This collection is for future scalability.

---

## 🔐 ACCESS CONTROL LOGIC

### Scenario 1: Tenant Admin Creates Project

**Flow:**
```
1. Tenant Admin logs in
2. Goes to "Create Project" page
3. Fills project details
4. Selects "Assign to Project Admin" (dropdown of project admins)
5. Submits

Backend:
- Creates project with:
  - tenant_id = tenant's ID
  - created_by = tenant admin's ID
  - project_admin_id = selected project admin's ID
```

**Result:**
- Tenant Admin can see this project in their projects list
- Assigned Project Admin can see this project in their projects list
- Other Project Admins CANNOT see this project

---

### Scenario 2: Project Admin Creates Project

**Flow:**
```
1. Project Admin logs in
2. Goes to "Create Project" page
3. Fills project details
4. Submits (no assignment needed - auto-assigned)

Backend:
- Creates project with:
  - tenant_id = project admin's tenant
  - created_by = project admin's ID
  - project_admin_id = project admin's ID (self-assigned)
```

**Result:**
- Project Admin can see and manage this project
- Tenant Admin can see this project (sees all projects)
- Other Project Admins CANNOT see this project

---

### Scenario 3: Tenant Admin Reassigns Project

**Flow:**
```
1. Tenant Admin goes to project details
2. Clicks "Reassign Project Admin"
3. Selects new Project Admin
4. Confirms

Backend:
- Updates project:
  - project_admin_id = new admin's ID
  - updated_at = current timestamp
```

**Result:**
- Old Project Admin loses access to this project
- New Project Admin gains access to this project
- Tenant Admin maintains access (always has access)

---

## 🔒 API ENDPOINT ACCESS RULES

### 1. GET /api/projects (List All Projects)

**Tenant Admin:**
```javascript
// Returns all projects for tenant
const projects = await db.projects.find({
  tenant_id: user.tenant_id,
  deleted_at: null
}).to_list()
```

**Project Admin:**
```javascript
// Returns only assigned projects
const projects = await db.projects.find({
  tenant_id: user.tenant_id,
  project_admin_id: user.id,
  deleted_at: null
}).to_list()
```

---

### 2. POST /api/projects (Create Project)

**Tenant Admin:**
```javascript
// Can create project and assign to any project admin
{
  ...projectData,
  tenant_id: user.tenant_id,
  created_by: user.id,
  project_admin_id: req.body.project_admin_id || user.id  // Can assign to others
}
```

**Project Admin:**
```javascript
// Can only create project for themselves
{
  ...projectData,
  tenant_id: user.tenant_id,
  created_by: user.id,
  project_admin_id: user.id  // Always self-assigned
}
```

---

### 3. GET /api/projects/:projectId (Get Project Details)

**Access Check:**
```javascript
// Check if user can access this project
const project = await db.projects.find_one({
  id: projectId,
  tenant_id: user.tenant_id,
  deleted_at: null
})

if (!project) {
  throw HTTPException(404, "Project not found")
}

// Additional check for Project Admin
if (user.role === "project_admin" && project.project_admin_id !== user.id) {
  throw HTTPException(403, "Access denied. Not your project.")
}

return project
```

---

### 4. PUT /api/projects/:projectId (Update Project)

**Same access rules as GET project**

**Additional rule for reassignment:**
```javascript
// Only Tenant Admin can change project_admin_id
if (req.body.project_admin_id && user.role !== "tenant_admin") {
  throw HTTPException(403, "Only Tenant Admin can reassign projects")
}
```

---

### 5. GET /api/properties (List Properties)

**Tenant Admin:**
```javascript
// Can see all properties in all projects
const properties = await db.properties.find({
  tenant_id: user.tenant_id,
  deleted_at: null
}).to_list()
```

**Project Admin:**
```javascript
// Can only see properties in their assigned projects
// Step 1: Get assigned project IDs
const projects = await db.projects.find({
  tenant_id: user.tenant_id,
  project_admin_id: user.id,
  deleted_at: null
}, {"_id": 0, "id": 1}).to_list()

const projectIds = [p.id for p in projects]

// Step 2: Get properties only from those projects
const properties = await db.properties.find({
  project_id: {"$in": projectIds},
  deleted_at: null
}).to_list()
```

---

## 👥 USER MANAGEMENT

### Creating Project Admin (Tenant Admin Only)

**Flow:**
```
1. Tenant Admin goes to "Settings" → "Project Admins"
2. Clicks "Add Project Admin"
3. Fills form:
   - Name
   - Email
   - Phone
   - Password
4. Submits

Backend:
- Creates user with:
  - tenant_id = tenant admin's tenant
  - role = "project_admin"
  - created_by = tenant admin's ID
  - is_active = true
```

**UI Location:**
```
Dashboard → Settings → User Management → Project Admins
```

---

### Managing Project Admins

**Tenant Admin Can:**
- ✅ Create Project Admins
- ✅ View all Project Admins
- ✅ Edit Project Admin details
- ✅ Deactivate/Activate Project Admins
- ✅ Delete Project Admins (if no projects assigned)
- ✅ View projects assigned to each admin
- ✅ Reassign projects between admins

**Project Admin Can:**
- ✅ View own profile
- ✅ Update own password
- ❌ Cannot create other users
- ❌ Cannot see other project admins

---

## 🎨 UI/UX DESIGN

### 1. Tenant Admin Dashboard

```
┌─────────────────────────────────────────────┐
│  📊 Tenant Admin Dashboard                  │
├─────────────────────────────────────────────┤
│                                             │
│  Total Projects: 25                         │
│  Project Admins: 5                          │
│  Total Properties: 450                      │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Recent Projects                      │  │
│  │  ────────────────────────────────────│  │
│  │  Green Valley (Admin: Ramesh)        │  │
│  │  Krishna Residency (Admin: Priya)    │  │
│  │  Sun City (Admin: Self)              │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [View All Projects] [Manage Admins]       │
└─────────────────────────────────────────────┘
```

---

### 2. Project Admin Dashboard

```
┌─────────────────────────────────────────────┐
│  📊 Project Admin Dashboard (Ramesh)        │
├─────────────────────────────────────────────┤
│                                             │
│  My Projects: 3                             │
│  Total Properties: 85                       │
│  Active Leads: 12                           │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  My Projects                          │  │
│  │  ────────────────────────────────────│  │
│  │  ✅ Green Valley (50 units)          │  │
│  │  ✅ Lake View (20 units)             │  │
│  │  ✅ Garden Heights (15 units)        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [Create New Project]                       │
│                                             │
│  ℹ️ Note: You can only see your assigned   │
│     projects. Contact tenant for access.   │
└─────────────────────────────────────────────┘
```

---

### 3. Projects List Page (Tenant Admin View)

```
┌─────────────────────────────────────────────────┐
│  Projects (25)                    [+ New Project]│
├─────────────────────────────────────────────────┤
│                                                 │
│  [All] [My Projects] [Unassigned]              │
│  [Filter by Admin ▼] [Search...]              │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Green Valley                              │ │
│  │ Admin: Ramesh Kumar                       │ │
│  │ Location: Gachibowli                      │ │
│  │ 50 units • 35 available • 15 sold         │ │
│  │ [View] [Reassign Admin]                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Krishna Residency                         │ │
│  │ Admin: Priya Reddy                        │ │
│  │ Location: Kukatpally                      │ │
│  │ 30 units • 20 available • 10 sold         │ │
│  │ [View] [Reassign Admin]                   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Sun City                                  │ │
│  │ Admin: Self (You)                         │ │
│  │ Location: Madhapur                        │ │
│  │ 40 units • 30 available • 10 sold         │ │
│  │ [View] [Edit]                             │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### 4. Projects List Page (Project Admin View)

```
┌─────────────────────────────────────────────────┐
│  My Projects (3)                  [+ New Project]│
├─────────────────────────────────────────────────┤
│                                                 │
│  [Search...]                                    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Green Valley                              │ │
│  │ Location: Gachibowli                      │ │
│  │ 50 units • 35 available • 15 sold         │ │
│  │ [View] [Edit]                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Lake View                                 │ │
│  │ Location: Kondapur                        │ │
│  │ 20 units • 18 available • 2 sold          │ │
│  │ [View] [Edit]                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Garden Heights                            │ │
│  │ Location: Miyapur                         │ │
│  │ 15 units • 10 available • 5 sold          │ │
│  │ [View] [Edit]                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ℹ️ You're viewing only projects assigned to   │
│     you. Total projects in system may be more. │
└─────────────────────────────────────────────────┘
```

---

### 5. Create Project Form (Tenant Admin)

```
┌─────────────────────────────────────────────────┐
│  Create New Project                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Project Name *                                 │
│  [Green Valley Phase 2____________]            │
│                                                 │
│  Description                                    │
│  [Luxury apartments with...________]           │
│                                                 │
│  Location *                                     │
│  [Near Forum Mall__________________]           │
│                                                 │
│  City *          State *                        │
│  [Hyderabad____] [Telangana________]           │
│                                                 │
│  📋 Assign Project Admin *                      │
│  [Select Project Admin ▼]                      │
│    • Ramesh Kumar                               │
│    • Priya Reddy                                │
│    • Vikram Singh                               │
│    • Assign to me (Tenant Admin)                │
│                                                 │
│  ℹ️ The selected admin will have full access    │
│     to manage this project and its properties.  │
│                                                 │
│  [Cancel] [Create Project]                      │
└─────────────────────────────────────────────────┘
```

---

### 6. Create Project Form (Project Admin)

```
┌─────────────────────────────────────────────────┐
│  Create New Project                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Project Name *                                 │
│  [Green Valley Phase 2____________]            │
│                                                 │
│  Description                                    │
│  [Luxury apartments with...________]           │
│                                                 │
│  Location *                                     │
│  [Near Forum Mall__________________]           │
│                                                 │
│  City *          State *                        │
│  [Hyderabad____] [Telangana________]           │
│                                                 │
│  ✅ This project will be assigned to you        │
│                                                 │
│  [Cancel] [Create Project]                      │
└─────────────────────────────────────────────────┘
```

---

### 7. Manage Project Admins Page (Tenant Admin Only)

```
┌─────────────────────────────────────────────────┐
│  Project Admins (5)                [+ Add Admin] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Search...] [Filter: All ▼]                   │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Ramesh Kumar                           │ │
│  │    ramesh@example.com • 9999999991        │ │
│  │    Projects: 3 • Active                   │ │
│  │    [View Projects] [Edit] [Deactivate]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Priya Reddy                            │ │
│  │    priya@example.com • 9999999992         │ │
│  │    Projects: 2 • Active                   │ │
│  │    [View Projects] [Edit] [Deactivate]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Vikram Singh                           │ │
│  │    vikram@example.com • 9999999993        │ │
│  │    Projects: 1 • Active                   │ │
│  │    [View Projects] [Edit] [Deactivate]    │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### 8. Project Admin Details Modal

```
┌─────────────────────────────────────────────────┐
│  Project Admin: Ramesh Kumar                     │
│                                            [×]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  📧 Email: ramesh@example.com                   │
│  📱 Phone: 9999999991                           │
│  📅 Joined: Jan 15, 2024                        │
│  ✅ Status: Active                              │
│                                                 │
│  ────────────────────────────────────────      │
│                                                 │
│  Assigned Projects (3):                         │
│                                                 │
│  1. Green Valley - Gachibowli                   │
│     50 units • ₹25Cr value                      │
│     [View] [Reassign]                           │
│                                                 │
│  2. Lake View - Kondapur                        │
│     20 units • ₹15Cr value                      │
│     [View] [Reassign]                           │
│                                                 │
│  3. Garden Heights - Miyapur                    │
│     15 units • ₹8Cr value                       │
│     [View] [Reassign]                           │
│                                                 │
│  ────────────────────────────────────────      │
│                                                 │
│  Total Value Managed: ₹48 Crores               │
│                                                 │
│  [Edit Profile] [Deactivate] [Close]           │
└─────────────────────────────────────────────────┘
```

---

## 🔄 IMPLEMENTATION PHASES

### Phase 1: Database & Backend (Week 1)
- [ ] Add `role` field to users collection
- [ ] Add `created_by` and `project_admin_id` to projects collection
- [ ] Update project creation API with access control
- [ ] Update project list API with filtering logic
- [ ] Create user management APIs (CRUD for project admins)
- [ ] Add reassignment API endpoint
- [ ] Write access control middleware

### Phase 2: Tenant Admin UI (Week 2)
- [ ] Create "Manage Project Admins" page
- [ ] Add "Add Project Admin" form
- [ ] Update "Create Project" form with admin assignment
- [ ] Add "Reassign Project Admin" functionality
- [ ] Update Projects list to show assigned admin
- [ ] Add filter by admin in projects page

### Phase 3: Project Admin UI (Week 3)
- [ ] Update Projects list to show only assigned projects
- [ ] Update Dashboard to show limited data
- [ ] Update "Create Project" form (no assignment dropdown)
- [ ] Add notice/info messages about access restrictions
- [ ] Test access boundaries

### Phase 4: Navigation & Guards (Week 4)
- [ ] Update navigation menu based on role
- [ ] Add route guards (prevent unauthorized access)
- [ ] Add permission checks in components
- [ ] Hide/show features based on role
- [ ] Add error messages for access denied

### Phase 5: Testing & Polish (Week 5)
- [ ] Test all access scenarios
- [ ] Test edge cases (reassignment, deletion, etc.)
- [ ] Add audit logs
- [ ] Performance optimization
- [ ] Documentation

---

## 🧪 TEST SCENARIOS

### Test Case 1: Tenant Admin Creates Project Admin
```
Given: Logged in as Tenant Admin
When: I create a new project admin "Ramesh"
Then: 
  - New user "Ramesh" is created with role "project_admin"
  - Ramesh can login to the system
  - Ramesh sees empty projects list initially
  - Ramesh can create new projects
```

### Test Case 2: Tenant Admin Creates Project and Assigns
```
Given: Logged in as Tenant Admin
  And: Project Admin "Ramesh" exists
When: I create project "Green Valley" and assign to Ramesh
Then:
  - Project is created with project_admin_id = Ramesh's ID
  - Ramesh can see "Green Valley" in his projects list
  - Other project admins cannot see "Green Valley"
  - I (Tenant Admin) can see "Green Valley" in my projects list
```

### Test Case 3: Project Admin Creates Project
```
Given: Logged in as Project Admin "Ramesh"
When: I create project "Lake View"
Then:
  - Project is created with project_admin_id = my ID
  - I can see and manage "Lake View"
  - Tenant Admin can see "Lake View"
  - Other project admins cannot see "Lake View"
  - Project shows me as the creator and admin
```

### Test Case 4: Tenant Admin Reassigns Project
```
Given: Logged in as Tenant Admin
  And: Project "Green Valley" is assigned to Ramesh
  And: Project Admin "Priya" exists
When: I reassign "Green Valley" from Ramesh to Priya
Then:
  - Ramesh loses access to "Green Valley"
  - Ramesh cannot see "Green Valley" in his list
  - Priya gains access to "Green Valley"
  - Priya can see and manage "Green Valley"
  - All properties in "Green Valley" are now managed by Priya
```

### Test Case 5: Access Control - Project Admin Tries to Access Other's Project
```
Given: Logged in as Project Admin "Ramesh"
  And: Project "Sun City" is assigned to "Priya"
When: I try to access /projects/sun-city-id
Then:
  - I get "403 Forbidden" error
  - Error message: "Access denied. This project is not assigned to you."
  - I'm redirected back to my projects list
```

### Test Case 6: Access Control - Project Admin Tries to See All Properties
```
Given: Logged in as Project Admin "Ramesh"
  And: I have 2 assigned projects (50 properties total)
  And: Tenant has 5 total projects (200 properties total)
When: I go to Properties page
Then:
  - I see only 50 properties from my 2 projects
  - I don't see properties from other 3 projects
  - Properties are filtered automatically by backend
```

### Test Case 7: Tenant Admin Views All
```
Given: Logged in as Tenant Admin
  And: System has 5 projects (3 assigned to Ramesh, 2 to Priya)
When: I go to Projects page
Then:
  - I see all 5 projects
  - Each project shows assigned admin name
  - I can filter by admin
  - I can reassign any project
```

---

## 🚨 EDGE CASES & SOLUTIONS

### Edge Case 1: Deleting Project Admin with Assigned Projects
**Problem:** What happens to projects if we delete a project admin?

**Solution:**
```
Option 1 (Recommended): Prevent deletion
- Show error: "Cannot delete admin with assigned projects"
- Show list of assigned projects
- Ask to reassign projects first

Option 2: Auto-reassign to Tenant Admin
- All projects get reassigned to Tenant Admin
- Send notification to Tenant Admin
- Log the reassignment for audit
```

### Edge Case 2: Deactivating Project Admin
**Problem:** Should deactivated admin's projects still be accessible?

**Solution:**
```
- Deactivated admin cannot login
- Projects remain assigned (data not lost)
- Tenant Admin can reassign projects to active admin
- Reactivating admin restores access to same projects
```

### Edge Case 3: Project Admin Changes Tenant
**Problem:** What if somehow project admin changes tenant?

**Solution:**
```
- Project admins are locked to their tenant
- Cannot change tenant_id field
- If needed, create new admin in new tenant
- Projects cannot be transferred between tenants
```

### Edge Case 4: Multiple Admins Per Project (Future)
**Problem:** What if client wants 2 admins for same project?

**Solution:**
```
Current: Use project_admin_id (single admin)

Future Enhancement:
- Create project_assignments collection
- Allow multiple assignments per project
- Track primary vs secondary admin
- Update access control to check assignments table
```

---

## 📊 DATABASE QUERIES PERFORMANCE

### Optimizing Queries for Project Admin

**Current Approach (Less Efficient):**
```python
# Get all projects, filter in code
all_projects = await db.projects.find({"tenant_id": tenant_id})
my_projects = [p for p in all_projects if p.project_admin_id == user_id]
```

**Optimized Approach (Recommended):**
```python
# Filter at database level
my_projects = await db.projects.find({
  "tenant_id": tenant_id,
  "project_admin_id": user_id,
  "deleted_at": None
}).to_list()
```

**Index Recommendations:**
```javascript
// MongoDB indexes for performance
db.projects.createIndex({ "tenant_id": 1, "project_admin_id": 1 })
db.projects.createIndex({ "tenant_id": 1, "deleted_at": 1 })
db.properties.createIndex({ "project_id": 1, "deleted_at": 1 })
db.users.createIndex({ "tenant_id": 1, "role": 1, "is_active": 1 })
```

---

## 🔐 SECURITY CONSIDERATIONS

### 1. API Level Security
```python
# Every API endpoint must check access
@router.get("/api/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    # Always check tenant_id first
    project = await db.projects.find_one({
        "id": project_id,
        "tenant_id": user["tenant_id"]
    })
    
    if not project:
        raise HTTPException(404, "Project not found")
    
    # Additional check for project admin
    if user["role"] == "project_admin" and project["project_admin_id"] != user["id"]:
        raise HTTPException(403, "Access denied")
    
    return project
```

### 2. Frontend Level Security (Not Enough!)
```javascript
// Hide UI elements based on role
{user.role === 'tenant_admin' && (
  <Button>Reassign Project</Button>
)}

// But ALWAYS enforce on backend too!
// Frontend security is for UX, not actual security
```

### 3. Audit Logging
```python
# Log all sensitive operations
audit_log = {
    "action": "reassign_project",
    "user_id": user["id"],
    "project_id": project_id,
    "old_admin": old_admin_id,
    "new_admin": new_admin_id,
    "timestamp": datetime.now(timezone.utc).isoformat()
}
await db.audit_logs.insert_one(audit_log)
```

---

## ❓ QUESTIONS FOR APPROVAL

Please review and confirm:

### 1. Database Schema
- ✅ Add `role` field to users collection?
- ✅ Add `project_admin_id` to projects collection?
- ✅ Add `created_by` for tracking?

### 2. Access Rules
- ✅ Tenant Admin sees ALL projects?
- ✅ Project Admin sees ONLY assigned projects?
- ✅ Project Admin can create projects (auto-assigned)?

### 3. UI/UX
- ✅ Separate dashboards for Tenant vs Project Admin?
- ✅ Show "Manage Project Admins" page to Tenant only?
- ✅ Show info messages about access restrictions?

### 4. Features
- ✅ Reassign projects between admins?
- ✅ Prevent deleting admin with projects?
- ❓ Should we add project_assignments table now or later?
- ❓ Should project admin be able to view other admins' names?

### 5. Implementation
- ❓ Start with Phase 1 immediately after approval?
- ❓ 5-week timeline acceptable?
- ❓ Any modifications needed to the design?

---

## 🎯 NEXT STEPS

After your approval:
1. ✅ Implement database changes
2. ✅ Update backend APIs with access control
3. ✅ Create user management pages
4. ✅ Update project pages with role-based UI
5. ✅ Test all scenarios thoroughly
6. ✅ Deploy to production

---

**Document Prepared By:** Agent E1
**Date:** November 28, 2024
**Status:** Awaiting Client Approval ⏳
