from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

from models.bank_account import BankAccountCreate, BankAccountUpdate, BankAccount
from middleware.auth import get_current_user

router = APIRouter()

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
DB_NAME = os.getenv('DB_NAME')
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

@router.post("/bank-accounts", response_model=dict)
async def create_bank_account(
    account: BankAccountCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new bank account or cash account"""
    
    # Generate account ID
    account_id = str(uuid.uuid4())
    
    # If account_number is "1111111", it's cash account
    is_cash = account.account_number == "1111111"
    
    # If marking as primary online, unmark others
    if account.is_primary_online:
        await db.bank_accounts.update_many(
            {"tenant_id": account.tenant_id, "deleted_at": None},
            {"$set": {"is_primary_online": False}}
        )
    
    account_data = {
        "id": account_id,
        "account_number": account.account_number,
        "account_name": account.account_name,
        "account_type": account.account_type,
        "bank_name": account.bank_name if not is_cash else "Cash",
        "branch": account.branch,
        "ifsc_code": account.ifsc_code,
        "account_holder_name": account.account_holder_name,
        "opening_balance": account.opening_balance,
        "current_balance": account.opening_balance,
        "available_balance": account.opening_balance,
        "is_primary_online": account.is_primary_online,
        "is_active": account.is_active,
        "notes": account.notes,
        "tenant_id": account.tenant_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
        "deleted_at": None,
        "created_by": current_user["id"]
    }
    
    await db.bank_accounts.insert_one(account_data)
    
    return {
        "success": True,
        "message": f"{'Cash account' if is_cash else 'Bank account'} created successfully",
        "account_id": account_id
    }


@router.get("/bank-accounts", response_model=dict)
async def get_bank_accounts(
    tenant_id: Optional[str] = None,
    include_inactive: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get all bank accounts for tenant"""
    
    if not tenant_id:
        tenant_id = current_user.get("tenant_id")
    
    query = {
        "tenant_id": tenant_id,
        "deleted_at": None
    }
    
    if not include_inactive:
        query["is_active"] = True
    
    accounts = await db.bank_accounts.find(
        query,
        {"_id": 0}
    ).sort("account_number", 1).to_list(length=None)
    
    # Calculate totals
    total_balance = sum(acc["current_balance"] for acc in accounts)
    total_available = sum(acc["available_balance"] for acc in accounts)
    
    # Separate cash and bank accounts
    cash_accounts = [acc for acc in accounts if acc["account_number"] == "1111111"]
    bank_accounts = [acc for acc in accounts if acc["account_number"] != "1111111"]
    
    return {
        "success": True,
        "accounts": accounts,
        "cash_accounts": cash_accounts,
        "bank_accounts": bank_accounts,
        "summary": {
            "total_accounts": len(accounts),
            "total_balance": total_balance,
            "total_available": total_available,
            "cash_balance": sum(acc["current_balance"] for acc in cash_accounts),
            "bank_balance": sum(acc["current_balance"] for acc in bank_accounts)
        }
    }


@router.get("/bank-accounts/{account_id}", response_model=dict)
async def get_bank_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get bank account details"""
    
    account = await db.bank_accounts.find_one(
        {"id": account_id, "deleted_at": None},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Get recent transactions
    transactions = await db.transactions.find(
        {
            "$or": [
                {"from_account_id": account_id},
                {"to_account_id": account_id}
            ],
            "deleted_at": None
        },
        {"_id": 0}
    ).sort("transaction_date", -1).limit(50).to_list(length=50)
    
    # Get pending cheques
    pending_cheques = await db.cheques.find(
        {
            "account_id": account_id,
            "status": "pending",
            "deleted_at": None
        },
        {"_id": 0}
    ).sort("expected_clearing_date", 1).to_list(length=None)
    
    return {
        "success": True,
        "account": account,
        "transactions": transactions,
        "pending_cheques": pending_cheques,
        "pending_cheques_amount": sum(ch["cheque_amount"] for ch in pending_cheques)
    }


@router.get("/bank-accounts/shareable/{account_id}", response_model=dict)
async def get_shareable_bank_details(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get bank account details in shareable format for customers"""
    
    account = await db.bank_accounts.find_one(
        {"id": account_id, "deleted_at": None, "is_active": True},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Return only necessary details
    shareable_details = {
        "account_holder_name": account.get("account_holder_name", account["account_name"]),
        "account_number": account["account_number"],
        "bank_name": account.get("bank_name", "Cash"),
        "branch": account.get("branch"),
        "ifsc_code": account.get("ifsc_code")
    }
    
    return {
        "success": True,
        "bank_details": shareable_details,
        "formatted_text": f"""
Bank Details for Payment:

Account Holder: {shareable_details['account_holder_name']}
Account Number: {shareable_details['account_number']}
Bank Name: {shareable_details['bank_name']}
Branch: {shareable_details['branch'] or 'N/A'}
IFSC Code: {shareable_details['ifsc_code'] or 'N/A'}

Please use the above details for payment.
        """.strip()
    }


@router.put("/bank-accounts/{account_id}", response_model=dict)
async def update_bank_account(
    account_id: str,
    account_update: BankAccountUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update bank account details"""
    
    account = await db.bank_accounts.find_one(
        {"id": account_id, "deleted_at": None}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = {k: v for k, v in account_update.dict(exclude_unset=True).items()}
    
    # If marking as primary online, unmark others
    if update_data.get("is_primary_online"):
        await db.bank_accounts.update_many(
            {"tenant_id": account["tenant_id"], "id": {"$ne": account_id}, "deleted_at": None},
            {"$set": {"is_primary_online": False}}
        )
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.bank_accounts.update_one(
            {"id": account_id},
            {"$set": update_data}
        )
    
    return {
        "success": True,
        "message": "Account updated successfully"
    }


@router.delete("/bank-accounts/{account_id}", response_model=dict)
async def delete_bank_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete bank account"""
    
    account = await db.bank_accounts.find_one(
        {"id": account_id, "deleted_at": None}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Check if account has balance
    if account["current_balance"] != 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete account with non-zero balance (₹{account['current_balance']:,.2f})"
        )
    
    await db.bank_accounts.update_one(
        {"id": account_id},
        {"$set": {
            "deleted_at": datetime.now(timezone.utc),
            "is_active": False
        }}
    )
    
    return {
        "success": True,
        "message": "Account deleted successfully"
    }


@router.get("/bank-accounts/primary-online/{tenant_id}", response_model=dict)
async def get_primary_online_account(
    tenant_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get primary account for online payment gateway"""
    
    account = await db.bank_accounts.find_one(
        {
            "tenant_id": tenant_id,
            "is_primary_online": True,
            "is_active": True,
            "deleted_at": None
        },
        {"_id": 0}
    )
    
    if not account:
        # Return first active bank account
        account = await db.bank_accounts.find_one(
            {
                "tenant_id": tenant_id,
                "account_number": {"$ne": "1111111"},
                "is_active": True,
                "deleted_at": None
            },
            {"_id": 0}
        )
    
    if not account:
        raise HTTPException(
            status_code=404,
            detail="No active bank account found for online payments"
        )
    
    return {
        "success": True,
        "account": account
    }
