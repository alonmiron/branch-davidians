"""
Routes for viewing and downloading the legal file archives.
"""
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cc_file_archive import CcFileArchive
from app.schemas.cc_schemas import CcFileArchiveResponse

router = APIRouter()


@router.get("", response_model=List[CcFileArchiveResponse])
def list_archives(
    file_type: Optional[str] = Query(None, description="'batch_export' or 'result_import'"),
    year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(CcFileArchive)
    if file_type:
        q = q.filter(CcFileArchive.file_type == file_type)
    if year:
        q = q.filter(CcFileArchive.year == year)
    return q.order_by(CcFileArchive.created_at.desc()).all()


@router.get("/{archive_id}", response_model=CcFileArchiveResponse)
def get_archive(archive_id: int, db: Session = Depends(get_db)):
    a = db.query(CcFileArchive).filter(CcFileArchive.id == archive_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Archive not found")
    return a


@router.get("/{archive_id}/download")
def download_archive(archive_id: int, db: Session = Depends(get_db)):
    a = db.query(CcFileArchive).filter(CcFileArchive.id == archive_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Archive not found")

    if a.file_path and os.path.exists(a.file_path):
        return FileResponse(
            a.file_path,
            media_type="text/csv",
            filename=a.filename,
        )

    if a.file_content:
        return PlainTextResponse(
            content=a.file_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={a.filename}"},
        )

    raise HTTPException(status_code=404, detail="File content not available")


@router.get("/{archive_id}/view")
def view_archive(archive_id: int, db: Session = Depends(get_db)):
    """Return raw CSV text for in-browser viewing."""
    a = db.query(CcFileArchive).filter(CcFileArchive.id == archive_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Archive not found")

    content = ""
    if a.file_path and os.path.exists(a.file_path):
        content = open(a.file_path, encoding="utf-8").read()
    elif a.file_content:
        content = a.file_content

    return PlainTextResponse(content=content, media_type="text/plain")


@router.delete("/{archive_id}")
def delete_archive(archive_id: int, db: Session = Depends(get_db)):
    a = db.query(CcFileArchive).filter(CcFileArchive.id == archive_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Archive not found")
    db.delete(a)
    db.commit()
    return {"message": "Archive record deleted"}
