"""
Role Context Service - Manages context-aware role assignments and permissions.

This service handles the flexible multi-role architecture where:
- Same user can have multiple roles in the same project
- Same user can have roles across multiple projects and tenants
- Role assignments are context-specific with metadata (commission%, permissions, etc.)
"""

import os
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


class RoleContextService:
    """Service for managing context-aware role assignments"""
    
    @staticmethod
    async def get_user_roles_in_project(
        user_id: str,
        tenant_id: str,
        project_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all roles a user has in a specific project context.
        
        Args:
            user_id: The user's ID
            tenant_id: The tenant ID
            project_id: The project ID (None for tenant-level roles)
        
        Returns:
            List of role assignments with metadata
            
        Example:
            roles = await get_user_roles_in_project("ramu", "tenant1", "projectA")
            # Returns: [
            #   {role_name: "agent", commission_percentage: 5.0, ...},
            #   {role_name: "customer", property_ids: ["p1"], ...}
            # ]
        """
        query = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "status": "active",
            "deleted_at": None
        }
        
        if project_id:
            query["project_id"] = project_id
        
        role_assignments = await db.project_staff.find(query, {"_id": 0}).to_list(length=None)
        return role_assignments
    
    @staticmethod
    async def get_tenant_level_roles(user_id: str, tenant_id: str) -> List[Dict[str, Any]]:
        """
        Get user's tenant-level roles (project_id is None).
        These roles typically grant access across all projects.
        
        Example: Tenant Admin role
        """
        query = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "project_id": None,
            "status": "active",
            "deleted_at": None
        }
        
        role_assignments = await db.project_staff.find(query, {"_id": 0}).to_list(length=None)
        return role_assignments
    
    @staticmethod
    async def is_tenant_admin(user_id: str, tenant_id: str) -> bool:
        """
        Check if user has tenant admin role (can access all projects).
        
        Tenant admin is identified by:
        1. can_view_all_projects = True, OR
        2. role_name = "tenant_admin", OR
        3. project_id is None and role allows full access
        """
        # Check for tenant-level role with full access
        tenant_role = await db.project_staff.find_one({
            "user_id": user_id,
            "tenant_id": tenant_id,
            "status": "active",
            "deleted_at": None,
            "$or": [
                {"can_view_all_projects": True},
                {"role_name": "tenant_admin"},
                {"role_name": "admin"}
            ]
        }, {"_id": 0})
        
        if tenant_role:
            return True
        
        # Also check the main users table for backward compatibility
        user = await db.users.find_one({
            "id": user_id,
            "tenant_id": tenant_id,
            "deleted_at": None
        }, {"_id": 0})
        
        if user:
            # Get user's primary role
            role = await db.roles.find_one({"id": user.get("role_id")}, {"_id": 0})
            if role and role.get("slug") in ["tenant_admin", "super_admin"]:
                return True
        
        return False
    
    @staticmethod
    async def is_project_admin(user_id: str, tenant_id: str, project_id: str) -> bool:
        """
        Check if user has project admin role for a specific project.
        """
        project_role = await db.project_staff.find_one({
            "user_id": user_id,
            "tenant_id": tenant_id,
            "project_id": project_id,
            "status": "active",
            "deleted_at": None,
            "$or": [
                {"role_name": "project_admin"},
                {"role_name": "admin"}
            ]
        }, {"_id": 0})
        
        return project_role is not None
    
    @staticmethod
    async def has_role_in_project(
        user_id: str,
        tenant_id: str,
        project_id: str,
        required_roles: List[str]
    ) -> bool:
        """
        Check if user has any of the required roles in a project.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            project_id: Project ID
            required_roles: List of role names (e.g., ["agent", "supervisor"])
        
        Returns:
            True if user has at least one of the required roles
        """
        # First check if user is tenant admin (has access to all projects)
        if await RoleContextService.is_tenant_admin(user_id, tenant_id):
            return True
        
        # Check for project-specific roles
        role_assignment = await db.project_staff.find_one({
            "user_id": user_id,
            "tenant_id": tenant_id,
            "project_id": project_id,
            "role_name": {"$in": required_roles},
            "status": "active",
            "deleted_at": None
        }, {"_id": 0})
        
        return role_assignment is not None
    
    @staticmethod
    async def get_user_projects(user_id: str, tenant_id: str) -> List[str]:
        """
        Get all project IDs where user has any role assignment.
        
        Returns:
            List of project IDs
        """
        # If user is tenant admin, they have access to ALL projects
        if await RoleContextService.is_tenant_admin(user_id, tenant_id):
            # Return all projects in the tenant
            projects = await db.projects.find(
                {"tenant_id": tenant_id, "deleted_at": None},
                {"_id": 0, "id": 1}
            ).to_list(length=None)
            return [p["id"] for p in projects]
        
        # Otherwise, return only projects where user has explicit role assignments
        role_assignments = await db.project_staff.find({
            "user_id": user_id,
            "tenant_id": tenant_id,
            "project_id": {"$ne": None},
            "status": "active",
            "deleted_at": None
        }, {"_id": 0, "project_id": 1}).to_list(length=None)
        
        project_ids = list(set([ra["project_id"] for ra in role_assignments if ra.get("project_id")]))
        return project_ids
    
    @staticmethod
    async def get_all_contexts_for_user(user_id: str) -> List[Dict[str, Any]]:
        """
        Get all tenant/project combinations where user has any role.
        Useful for multi-tenant users.
        
        Returns:
            List of context dictionaries with tenant_id, project_id, roles
        """
        role_assignments = await db.project_staff.find({
            "user_id": user_id,
            "status": "active",
            "deleted_at": None
        }, {"_id": 0}).to_list(length=None)
        
        # Group by tenant and project
        contexts = {}
        for assignment in role_assignments:
            tenant_id = assignment["tenant_id"]
            project_id = assignment.get("project_id", "tenant_level")
            key = f"{tenant_id}:{project_id}"
            
            if key not in contexts:
                contexts[key] = {
                    "tenant_id": tenant_id,
                    "project_id": project_id if project_id != "tenant_level" else None,
                    "roles": []
                }
            
            contexts[key]["roles"].append({
                "role_id": assignment["role_id"],
                "role_name": assignment.get("role_name"),
                "context_metadata": assignment.get("context_metadata", {})
            })
        
        return list(contexts.values())
    
    @staticmethod
    async def create_role_assignment(
        user_id: str,
        tenant_id: str,
        role_id: str,
        role_name: str,
        project_id: Optional[str] = None,
        context_metadata: Optional[Dict[str, Any]] = None,
        assigned_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new role assignment for a user.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            role_id: Role ID from roles collection
            role_name: Role name (agent, customer, supervisor, etc.)
            project_id: Project ID (None for tenant-level roles)
            context_metadata: Role-specific data (commission%, permissions, etc.)
            assigned_by: User ID who created this assignment
        
        Returns:
            Created assignment document
        """
        from datetime import datetime, timezone
        import uuid
        
        assignment = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "tenant_id": tenant_id,
            "project_id": project_id,
            "role_id": role_id,
            "role_name": role_name,
            "context_metadata": context_metadata or {},
            "commission_rate": context_metadata.get("commission_percentage", 0.0) if context_metadata else 0.0,
            "can_create_staff": False,
            "can_view_all_projects": role_name in ["tenant_admin", "admin"],
            "status": "active",
            "assigned_by": assigned_by,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "deleted_at": None
        }
        
        await db.project_staff.insert_one(assignment)
        return assignment
