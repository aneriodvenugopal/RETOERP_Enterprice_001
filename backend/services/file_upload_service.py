"""
File Upload Service
Handles file uploads for:
- Customer Documents (Aadhaar, PAN, Photos)
- Property Media (Images, Videos)
- Agreements & Contracts
- Payment Proofs
"""

import os
import uuid
import aiofiles
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path
from PIL import Image
import io

# Upload configuration
UPLOAD_BASE_DIR = "/app/uploads"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
CHUNK_SIZE = 1024 * 1024  # 1MB chunks

# Allowed file types by category
ALLOWED_TYPES = {
    "image": {
        "mimes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
        "extensions": ["jpg", "jpeg", "png", "webp", "gif"],
        "max_size": 10 * 1024 * 1024  # 10MB
    },
    "document": {
        "mimes": [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ],
        "extensions": ["pdf", "doc", "docx", "xls", "xlsx"],
        "max_size": 20 * 1024 * 1024  # 20MB
    },
    "video": {
        "mimes": ["video/mp4", "video/webm", "video/quicktime"],
        "extensions": ["mp4", "webm", "mov"],
        "max_size": 100 * 1024 * 1024  # 100MB
    }
}

# Upload categories/contexts
UPLOAD_CONTEXTS = {
    "customer_document": "customers",
    "property_media": "properties",
    "agreement": "agreements",
    "payment_proof": "payments",
    "project_media": "projects",
    "profile": "profiles",
    "general": "general"
}


def get_file_category(content_type: str, extension: str) -> Optional[str]:
    """Determine file category from content type or extension"""
    for category, config in ALLOWED_TYPES.items():
        if content_type in config["mimes"] or extension.lower() in config["extensions"]:
            return category
    return None


def validate_file(content_type: str, extension: str, file_size: int) -> dict:
    """Validate file type and size"""
    category = get_file_category(content_type, extension)
    
    if not category:
        return {
            "valid": False,
            "error": f"File type not allowed. Supported: images (jpg, png), documents (pdf, doc), videos (mp4)"
        }
    
    max_size = ALLOWED_TYPES[category]["max_size"]
    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        return {
            "valid": False,
            "error": f"File too large. Maximum size for {category}s: {max_mb}MB"
        }
    
    return {"valid": True, "category": category}


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename preserving extension"""
    extension = original_filename.split(".")[-1] if "." in original_filename else ""
    unique_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"{timestamp}_{unique_id}.{extension}" if extension else f"{timestamp}_{unique_id}"


def get_upload_path(context: str, tenant_id: str, filename: str) -> str:
    """Get full upload path for file"""
    context_dir = UPLOAD_CONTEXTS.get(context, "general")
    upload_dir = os.path.join(UPLOAD_BASE_DIR, context_dir, tenant_id)
    os.makedirs(upload_dir, exist_ok=True)
    return os.path.join(upload_dir, filename)


async def save_file(file_content: bytes, file_path: str) -> bool:
    """Save file to disk asynchronously"""
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        return True
    except Exception as e:
        print(f"Error saving file: {e}")
        return False


async def generate_thumbnail(file_path: str, thumb_path: str, size: tuple = (300, 300)) -> bool:
    """Generate thumbnail for image"""
    try:
        with Image.open(file_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Convert RGBA to RGB for JPEG
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            img.save(thumb_path, "JPEG", quality=85)
        return True
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False


def get_file_url(context: str, tenant_id: str, filename: str) -> str:
    """Generate URL for accessing file"""
    return f"/api/files/{context}/{tenant_id}/{filename}"


def delete_file(file_path: str) -> bool:
    """Delete file from disk"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False


class FileUploadService:
    """Main file upload service class"""
    
    def __init__(self, db):
        self.db = db
    
    async def upload_file(
        self,
        file_content: bytes,
        original_filename: str,
        content_type: str,
        context: str,
        tenant_id: str,
        uploaded_by: str,
        related_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Upload a file and store metadata in database
        
        Args:
            file_content: Raw file bytes
            original_filename: Original filename
            content_type: MIME type
            context: Upload context (customer_document, property_media, etc.)
            tenant_id: Tenant ID
            uploaded_by: User ID who uploaded
            related_id: Related entity ID (customer_id, property_id, etc.)
            metadata: Additional metadata
        
        Returns:
            dict with upload result
        """
        # Validate file
        extension = original_filename.split(".")[-1] if "." in original_filename else ""
        validation = validate_file(content_type, extension, len(file_content))
        
        if not validation["valid"]:
            return {"success": False, "error": validation["error"]}
        
        # Generate unique filename
        unique_filename = generate_unique_filename(original_filename)
        
        # Get upload path
        file_path = get_upload_path(context, tenant_id, unique_filename)
        
        # Save file
        saved = await save_file(file_content, file_path)
        if not saved:
            return {"success": False, "error": "Failed to save file"}
        
        # Generate thumbnail for images
        thumbnail_url = None
        if validation["category"] == "image":
            thumb_filename = f"thumb_{unique_filename}"
            thumb_path = get_upload_path(context, tenant_id, thumb_filename)
            if await generate_thumbnail(file_path, thumb_path):
                thumbnail_url = get_file_url(context, tenant_id, thumb_filename)
        
        # Generate file URL
        file_url = get_file_url(context, tenant_id, unique_filename)
        
        # Store metadata in database
        file_record = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "filename": unique_filename,
            "original_filename": original_filename,
            "content_type": content_type,
            "category": validation["category"],
            "context": context,
            "file_size": len(file_content),
            "file_url": file_url,
            "thumbnail_url": thumbnail_url,
            "file_path": file_path,
            "related_id": related_id,
            "metadata": metadata or {},
            "uploaded_by": uploaded_by,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "deleted_at": None
        }
        
        await self.db.files.insert_one(file_record)
        
        return {
            "success": True,
            "file_id": file_record["id"],
            "file_url": file_url,
            "thumbnail_url": thumbnail_url,
            "filename": unique_filename,
            "original_filename": original_filename,
            "file_size": len(file_content),
            "category": validation["category"]
        }
    
    async def get_files(
        self,
        tenant_id: str,
        context: Optional[str] = None,
        related_id: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Get files with optional filters"""
        query = {"tenant_id": tenant_id, "deleted_at": None}
        
        if context:
            query["context"] = context
        if related_id:
            query["related_id"] = related_id
        if category:
            query["category"] = category
        
        files = await self.db.files.find(query, {"_id": 0}).sort("uploaded_at", -1).limit(limit).to_list(limit)
        return files
    
    async def delete_file(self, file_id: str, tenant_id: str) -> dict:
        """Soft delete file"""
        file_record = await self.db.files.find_one(
            {"id": file_id, "tenant_id": tenant_id},
            {"_id": 0}
        )
        
        if not file_record:
            return {"success": False, "error": "File not found"}
        
        # Soft delete in database
        await self.db.files.update_one(
            {"id": file_id},
            {"$set": {"deleted_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Optionally delete physical file
        # delete_file(file_record["file_path"])
        
        return {"success": True, "message": "File deleted"}
    
    async def get_file_by_id(self, file_id: str, tenant_id: str) -> Optional[dict]:
        """Get single file by ID"""
        return await self.db.files.find_one(
            {"id": file_id, "tenant_id": tenant_id, "deleted_at": None},
            {"_id": 0}
        )
