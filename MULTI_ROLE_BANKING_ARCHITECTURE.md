# RETOERP Multi-Role Architecture & Project-Level Banking System

## 📋 Overview

This document describes the comprehensive multi-role architecture and project-level banking system implemented in RETOERP.

### Key Features
- ✅ Flexible multi-role system: Same user can have different roles in different projects/tenants
- ✅ Project-specific bank accounts with role-based access control
- ✅ Support for one-one, one-many, many-many, many-one relationships
- ✅ Context-aware permissions and metadata
- ✅ Tenant Admin and Project Admin hierarchy

---

## 🏗️ Architecture Design

### Role Assignment System

The system uses a flexible role assignment model where:
- **User Identity**: `user_id` remains constant across all contexts
- **Context**: Defined by `tenant_id + project_id`
- **Role**: Each context can have multiple role assignments
- **Metadata**: Each role assignment has its own context-specific data

```
User (Ramu)
  ├─ Tenant1
  │    ├─ ProjectA
  │    │    ├─ Agent Role (commission: 5%)
  │    │    └─ Customer Role (property_ids: [...])
  │    └─ ProjectB
  │         └─ Supervisor Role (commission: 7%)
  └─ Tenant2
       └─ ProjectX
            └─ Customer Role (property_ids: [...])
```

### Database Schema

#### Enhanced `project_staff` Collection
```javascript
{
  "id": "uuid",
  "user_id": "user123",              // User's unique ID
  "tenant_id": "tenant1",            // Which tenant
  "project_id": "projectA",          // Which project (null for tenant-level)
  "role_id": "role_agent_id",        // Reference to roles collection
  "role_name": "agent",              // Cached: agent, customer, supervisor, etc.
  
  // Context-specific metadata
  "context_metadata": {
    "commission_percentage": 5.0,    // For agents/supervisors
    "property_ids": ["prop1"],       // For customers
    "team_size": 5,                  // For supervisors
    "permissions": [...]             // Custom permissions
  },
  
  // Legacy fields (for backward compatibility)
  "commission_rate": 0.0,
  "can_create_staff": false,
  "can_view_all_projects": false,    // True for tenant_admin
  
  "status": "active",
  "assigned_by": "admin_user_id",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z",
  "deleted_at": null
}
```

#### Updated `bank_accounts` Collection
```javascript
{
  "id": "uuid",
  "tenant_id": "tenant1",
  "project_id": "projectA",          // ⭐ NEW: Bank accounts are project-specific
  "account_number": "123456789",
  "account_name": "Project A Operating Account",
  "account_type": "current",         // cash, current, savings, fd
  "bank_name": "HDFC Bank",
  "branch": "Banjara Hills",
  "ifsc_code": "HDFC0001234",
  "account_holder_name": "ABC Developers",
  "opening_balance": 100000.0,
  "current_balance": 150000.0,
  "available_balance": 145000.0,
  "is_primary_online": true,
  "is_active": true,
  "notes": "Primary account for Project A",
  "created_by": "user_id",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": null,
  "deleted_at": null
}
```

---

## 🔐 Access Control Rules

### Tenant Admin
- **Scope**: Full access across ALL projects in their tenant
- **Banking**: Can create, view, update, delete bank accounts in ANY project
- **Role Management**: Can assign/remove roles to any user in tenant
- **Identification**: 
  - Has `can_view_all_projects = true` in role assignment
  - OR has `role_name = "tenant_admin"` or `"admin"`
  - OR has `role_slug = "tenant_admin"` in users.role_id

### Project Admin
- **Scope**: Access limited to assigned project(s) only
- **Banking**: Can create, view, update, delete bank accounts ONLY in their assigned project(s)
- **Role Management**: Cannot assign roles (tenant admin only)
- **Identification**: 
  - Has `role_name = "project_admin"` for specific project_id

### Other Roles (Agent, Customer, Supervisor, Staff, Vendor)
- **Scope**: View-only access to bank accounts in projects where they have roles
- **Banking**: Can view bank accounts but cannot create/modify
- **Use Case**: Viewing payment instructions, bank details for transactions

---

## 🚀 API Endpoints

### Role Assignment APIs

#### 1. Assign Role to User
```http
POST /api/role-assignments/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user123",
  "tenant_id": "tenant1",
  "project_id": "projectA",      // null for tenant-level roles
  "role_id": "role_agent_id",
  "role_name": "agent",
  "context_metadata": {
    "commission_percentage": 5.0,
    "team": "Team Alpha"
  }
}

Response:
{
  "success": true,
  "message": "Role 'agent' assigned successfully to user in project projectA",
  "assignment": { ... }
}
```

**Access**: Tenant Admin only

#### 2. Get User's Role Assignments
```http
GET /api/role-assignments/user/{user_id}?tenant_id=tenant1&project_id=projectA
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user_id": "user123",
  "total_assignments": 3,
  "assignments": [
    {
      "id": "assign1",
      "project_id": "projectA",
      "project_name": "Green Valley Apartments",
      "role_name": "agent",
      "context_metadata": { "commission_percentage": 5.0 }
    },
    ...
  ]
}
```

**Access**: Tenant Admin or self (can view own assignments)

#### 3. Get Project's Role Assignments
```http
GET /api/role-assignments/project/{project_id}/users?role_name=agent
Authorization: Bearer <token>

Response:
{
  "success": true,
  "project_id": "projectA",
  "total_assignments": 5,
  "assignments": [
    {
      "user_id": "user123",
      "user_name": "Ramu Kumar",
      "user_phone": "9876543210",
      "role_name": "agent",
      "context_metadata": { "commission_percentage": 5.0 }
    },
    ...
  ]
}
```

**Access**: Tenant Admin or Project Admin

#### 4. Get My Contexts
```http
GET /api/role-assignments/my-contexts
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user_id": "user123",
  "total_contexts": 4,
  "contexts": [
    {
      "tenant_id": "tenant1",
      "tenant_name": "ABC Developers",
      "project_id": "projectA",
      "project_name": "Green Valley",
      "roles": [
        {"role_name": "agent", "context_metadata": {...}},
        {"role_name": "customer", "context_metadata": {...}}
      ]
    },
    ...
  ]
}
```

**Access**: Any authenticated user (shows their own contexts)

#### 5. Remove Role Assignment
```http
DELETE /api/role-assignments/assignment/{assignment_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Role assignment removed successfully"
}
```

**Access**: Tenant Admin only

---

### Bank Account APIs (Updated)

#### 1. Create Bank Account
```http
POST /api/bank-accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenant_id": "tenant1",
  "project_id": "projectA",      // ⭐ REQUIRED
  "account_number": "123456789",
  "account_name": "Project A Account",
  "account_type": "current",
  "bank_name": "HDFC Bank",
  "branch": "Banjara Hills",
  "ifsc_code": "HDFC0001234",
  "account_holder_name": "ABC Developers",
  "opening_balance": 100000.0,
  "is_primary_online": true,
  "is_active": true,
  "notes": "Primary account"
}

Response:
{
  "success": true,
  "message": "Bank account created successfully for project Green Valley",
  "account_id": "acc123",
  "project_id": "projectA"
}
```

**Access**: 
- ✅ Tenant Admin (any project)
- ✅ Project Admin (their assigned projects only)
- ❌ Others

#### 2. Get Bank Accounts
```http
GET /api/bank-accounts?project_id=projectA&include_inactive=false
Authorization: Bearer <token>

Response:
{
  "success": true,
  "accounts": [
    {
      "id": "acc123",
      "project_id": "projectA",
      "project_name": "Green Valley",
      "account_number": "123456789",
      "current_balance": 150000.0,
      ...
    }
  ],
  "cash_accounts": [...],
  "bank_accounts": [...],
  "summary": {
    "total_accounts": 5,
    "total_balance": 500000.0,
    "cash_balance": 50000.0,
    "bank_balance": 450000.0
  },
  "access_level": "tenant_admin",    // or "project_level"
  "accessible_projects": ["projectA", "projectB"]  // or "all"
}
```

**Access**: 
- Tenant Admin: See ALL accounts across all projects
- Project Admin: See only accounts in their assigned projects
- Others: See accounts in projects where they have ANY role

**Query Parameters**:
- `project_id` (optional): Filter by specific project
- `include_inactive` (optional): Include inactive accounts

#### 3. Get Single Bank Account
```http
GET /api/bank-accounts/{account_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "account": {
    "id": "acc123",
    "project_id": "projectA",
    "project_name": "Green Valley",
    ...
  },
  "transactions": [...],
  "pending_cheques": [...],
  "pending_cheques_amount": 10000.0
}
```

**Access**: Same as "Get Bank Accounts"

#### 4. Update Bank Account
```http
PUT /api/bank-accounts/{account_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "account_name": "Updated Name",
  "is_primary_online": true
}

Response:
{
  "success": true,
  "message": "Account updated successfully"
}
```

**Access**: 
- ✅ Tenant Admin (any account)
- ✅ Project Admin (accounts in their projects only)
- ❌ Others

#### 5. Delete Bank Account
```http
DELETE /api/bank-accounts/{account_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Access**: Same as Update
**Note**: Cannot delete accounts with non-zero balance

#### 6. Get Primary Online Account for Project
```http
GET /api/bank-accounts/primary-online/{project_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "account": {
    "id": "acc123",
    "project_id": "projectA",
    "is_primary_online": true,
    ...
  }
}
```

**Usage**: For payment gateway integration (gets the account to receive online payments)

---

## 🎯 Use Case Examples

### Example 1: User "Ramu" with Multiple Roles

**Scenario**:
- Ramu is an agent in Tenant1-ProjectA (5% commission)
- Ramu bought a property in Tenant1-ProjectA (customer)
- Ramu is a supervisor in Tenant1-ProjectB (7% commission)
- Ramu bought a property in Tenant2-ProjectX (customer)

**Implementation**:

1. **Assign Agent Role (ProjectA)**:
```bash
POST /api/role-assignments/assign
{
  "user_id": "ramu123",
  "tenant_id": "tenant1",
  "project_id": "projectA",
  "role_id": "<agent_role_id>",
  "role_name": "agent",
  "context_metadata": {"commission_percentage": 5.0}
}
```

2. **Assign Customer Role (ProjectA)**:
```bash
POST /api/role-assignments/assign
{
  "user_id": "ramu123",
  "tenant_id": "tenant1",
  "project_id": "projectA",
  "role_id": "<customer_role_id>",
  "role_name": "customer",
  "context_metadata": {"property_ids": ["prop101"]}
}
```

3. **Assign Supervisor Role (ProjectB)**:
```bash
POST /api/role-assignments/assign
{
  "user_id": "ramu123",
  "tenant_id": "tenant1",
  "project_id": "projectB",
  "role_id": "<supervisor_role_id>",
  "role_name": "supervisor",
  "context_metadata": {"commission_percentage": 7.0}
}
```

4. **Assign Customer Role (Tenant2-ProjectX)**:
```bash
POST /api/role-assignments/assign
{
  "user_id": "ramu123",
  "tenant_id": "tenant2",
  "project_id": "projectX",
  "role_id": "<customer_role_id>",
  "role_name": "customer",
  "context_metadata": {"property_ids": ["prop999"]}
}
```

**Banking Access**:
- When Ramu logs in and views bank accounts:
  - For ProjectA: Can see accounts (has agent + customer roles)
  - For ProjectB: Can see accounts (has supervisor role)
  - For Tenant2-ProjectX: Can see accounts (has customer role)

### Example 2: Tenant Admin vs Project Admin

**Tenant Admin (Rajesh)**:
```bash
# Can see ALL bank accounts across ALL projects
GET /api/bank-accounts
# Returns accounts from ProjectA, ProjectB, ProjectC, etc.

# Can create account in ANY project
POST /api/bank-accounts
{
  "tenant_id": "tenant1",
  "project_id": "projectC",    // Any project
  ...
}
```

**Project Admin (Suresh) - Assigned to ProjectA only**:
```bash
# Can only see accounts in ProjectA
GET /api/bank-accounts?project_id=projectA
# Returns ONLY ProjectA accounts

# Can create account ONLY in ProjectA
POST /api/bank-accounts
{
  "tenant_id": "tenant1",
  "project_id": "projectA",    // Only assigned project
  ...
}
# ✅ Success

# Trying to create in ProjectB
POST /api/bank-accounts
{
  "tenant_id": "tenant1",
  "project_id": "projectB",    // Not assigned
  ...
}
# ❌ 403 Forbidden: "You don't have permission..."
```

---

## 🔧 Backend Components

### 1. RoleContextService (`services/role_context_service.py`)

Core service managing role context and permissions:

```python
from services.role_context_service import RoleContextService

# Check if user is tenant admin
is_admin = await RoleContextService.is_tenant_admin(user_id, tenant_id)

# Check if user is project admin
is_proj_admin = await RoleContextService.is_project_admin(user_id, tenant_id, project_id)

# Get user's roles in a project
roles = await RoleContextService.get_user_roles_in_project(user_id, tenant_id, project_id)

# Get all projects user has access to
projects = await RoleContextService.get_user_projects(user_id, tenant_id)

# Check if user has specific role in project
has_role = await RoleContextService.has_role_in_project(
    user_id, tenant_id, project_id, ["agent", "supervisor"]
)
```

### 2. Enhanced Models

**`models/project_staff.py`**:
- Flexible role assignment model
- Supports context_metadata for role-specific data
- Multiple roles per user in same project

**`models/bank_account.py`**:
- Added `project_id` field (required)
- Bank accounts are now project-specific

### 3. Updated Routes

**`routes/bank_accounts.py`**:
- All endpoints now enforce project-level access control
- Tenant Admin: Full access
- Project Admin: Limited to assigned projects
- Others: View-only in projects with roles

**`routes/role_assignments.py`** (NEW):
- Manage role assignments
- Query user contexts
- Admin-only operations

---

## 🚦 Migration Guide

### For Existing Bank Accounts

If you have existing bank accounts without `project_id`, you need to:

1. **Identify Default Project**: Choose a default project for each tenant
2. **Update Accounts**: Add `project_id` to existing accounts

```javascript
// MongoDB migration script
db.bank_accounts.find({"project_id": {$exists: false}}).forEach(function(account) {
  // Get tenant's first project
  var project = db.projects.findOne({
    "tenant_id": account.tenant_id,
    "deleted_at": null
  });
  
  if (project) {
    db.bank_accounts.updateOne(
      {"id": account.id},
      {"$set": {"project_id": project.id}}
    );
  }
});
```

### For Existing Users

1. **Tenant Admins**: Ensure they have proper role assignment with `can_view_all_projects: true`
2. **Project Staff**: Migrate to new role assignment system if needed

```javascript
// Example: Migrate existing project_staff to new system
db.project_staff.find({}).forEach(function(assignment) {
  // Ensure role_name is set
  if (!assignment.role_name) {
    db.project_staff.updateOne(
      {"id": assignment.id},
      {"$set": {
        "role_name": assignment.role || "staff",
        "context_metadata": {
          "commission_percentage": assignment.commission_rate || 0
        }
      }}
    );
  }
});
```

---

## 📊 Testing Checklist

### Role Assignment Testing
- [ ] Assign multiple roles to same user in same project
- [ ] Assign roles to user across multiple projects
- [ ] Assign roles to user across multiple tenants
- [ ] Verify role_name and context_metadata are saved correctly
- [ ] Test tenant admin access control
- [ ] Test project admin access control

### Banking System Testing
- [ ] Tenant Admin: Create bank accounts in multiple projects
- [ ] Project Admin: Create account in assigned project (should succeed)
- [ ] Project Admin: Try to create account in non-assigned project (should fail with 403)
- [ ] Tenant Admin: View all bank accounts (should see all projects)
- [ ] Project Admin: View bank accounts (should see only assigned projects)
- [ ] User with multiple project roles: View accounts (should see all their projects)
- [ ] Update/Delete: Test access control for both Tenant and Project admins
- [ ] Primary online account: Verify per-project (not tenant-wide)

### Edge Cases
- [ ] User with no role assignments: Should see empty bank accounts
- [ ] User with customer-only role: Should have view-only access
- [ ] Soft-deleted role assignments: Should not grant access
- [ ] Inactive users: Should not have access
- [ ] Cross-tenant access attempts: Should be blocked

---

## 🎓 Best Practices

1. **Role Assignment**:
   - Always set meaningful `context_metadata` for each role
   - Use `role_name` for quick filtering (don't rely only on role_id)
   - Soft delete instead of hard delete to maintain audit trail

2. **Banking**:
   - Always create accounts with specific `project_id`
   - Set `is_primary_online` per project, not globally
   - Check access control in every endpoint

3. **Access Control**:
   - Check tenant admin first (they have universal access)
   - Then check project admin for project-specific operations
   - Finally check for any role in project for view operations

4. **Context Metadata**:
   - Store project-specific data: `commission_percentage`, `team_size`, etc.
   - Don't store sensitive data in metadata (use separate secure fields)
   - Keep metadata JSON-serializable

---

## 🐛 Troubleshooting

### Issue: User can't see bank accounts

**Check**:
1. Does user have any role assignment in the project?
   ```bash
   GET /api/role-assignments/user/{user_id}?project_id={project_id}
   ```
2. Is the role assignment active (deleted_at = null)?
3. Is the user's account active?

### Issue: Project Admin can see accounts from other projects

**Check**:
1. Does the user have `can_view_all_projects: true`? (This makes them Tenant Admin)
2. Check role_name - should be "project_admin", not "tenant_admin"
3. Verify project_id in role assignment matches expected project

### Issue: Role assignment not working

**Check**:
1. Is role_id valid and exists in roles collection?
2. Is tenant_id correct?
3. For project-level roles, is project_id provided?
4. Check for duplicate assignments (same user + tenant + project + role)

---

## 📝 Summary

This implementation provides:

✅ **Flexible Multi-Role System**: Same user can have different roles across projects/tenants  
✅ **Project-Level Banking**: Bank accounts are project-specific with proper access control  
✅ **Hierarchical Access**: Tenant Admin > Project Admin > Other Roles  
✅ **Context-Aware Metadata**: Each role can have custom data (commission%, permissions, etc.)  
✅ **Scalable Architecture**: Supports complex real-world scenarios  
✅ **Audit Trail**: Soft deletes and timestamps for all changes  

**Next Steps**:
1. Update frontend UI to support project selection for bank accounts
2. Test thoroughly with multiple user scenarios
3. Migrate existing data if needed
4. Train users on new multi-role capabilities
