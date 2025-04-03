# This is the prepended comment
# ===============================================================================
# GoFreeLab Proprietary
# -------------------------------------------------------------------------------
# Project Name    : Eduvocate
# File Name       : health.py
# Author          : ameen ahsan
# Created Date    : 2025-02-24
# Version         : 1.0
# -------------------------------------------------------------------------------
# Copyright (c) 2025 GoFreeLab. All rights reserved.
# This source code and all its contents are the proprietary property of GoFreeLab.
# Unauthorized copying, sharing, or distribution of this code, in whole or in part,
# via any medium is strictly prohibited without prior written permission from GoFreeLab.
# This software is for use only by employees, contractors, or partners of GoFreeLab
# with explicit authorization. For questions or permissions, please contact: info@gofreelab.com
# ===============================================================================
# routers/v1/health.py

from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check_v1():
    return {"status": "ok", "version": "v1"}
