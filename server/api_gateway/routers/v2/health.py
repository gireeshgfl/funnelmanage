# routers/v2/health.py

from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check_v2():
    return {"status": "ok", "version": "v2", "additional_info": "All systems operational"}
