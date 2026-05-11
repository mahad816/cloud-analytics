from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
import json
import os
import uuid
import pandas as pd
from typing import Optional, List
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./analytics.db")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Cloud Analytics Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column("s3_key", String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    processing_result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

class DatasetResponse(BaseModel):
    id: int
    filename: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    row_count: Optional[int]
    column_count: Optional[int]
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True

class AnalysisResult(BaseModel):
    id: int
    filename: str
    status: str
    row_count: Optional[int]
    column_count: Optional[int]
    processing_result: Optional[str]
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime]

Base.metadata.create_all(bind=engine)


def analyze_dataset(df: pd.DataFrame) -> dict:
    """Create a small, dashboard-friendly summary for a CSV file."""
    analysis = {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": {},
        "statistics": {},
        "missing_data": {},
        "correlation_matrix": {},
    }
    analysis["columns"] = list(df.columns)
    numeric_cols = df.select_dtypes(include=["number"]).columns
    if len(numeric_cols) > 0:
        analysis["statistics"] = df[numeric_cols].describe().to_dict()
        if len(numeric_cols) > 1:
            analysis["correlation_matrix"] = df[numeric_cols].corr().to_dict()
    analysis["missing_data"] = df.isnull().sum().to_dict()
    analysis["dtypes"] = df.dtypes.apply(str).to_dict()
    categorical_cols = df.select_dtypes(include=["object"]).columns
    analysis["categorical_summary"] = {}
    for col in categorical_cols:
        analysis["categorical_summary"][col] = df[col].value_counts().head(10).to_dict()
    return analysis


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api", "timestamp": datetime.utcnow()}

@app.post("/upload", response_model=DatasetResponse)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    filename = Path(file.filename or "").name
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    dataset_id = str(uuid.uuid4())

    try:
        content = await file.read()
        local_file_path = UPLOAD_DIR / f"{dataset_id}_{filename}"
        with open(local_file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    db_dataset = Dataset(
        filename=filename,
        file_path=str(local_file_path),
        status="processing",
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    try:
        df = pd.read_csv(local_file_path)
        analysis = analyze_dataset(df)
        db_dataset.row_count = analysis["shape"]["rows"]
        db_dataset.column_count = analysis["shape"]["columns"]
        db_dataset.processing_result = json.dumps(analysis, default=str)
        db_dataset.status = "completed"
        db_dataset.completed_at = datetime.utcnow()
    except Exception as e:
        db_dataset.status = "failed"
        db_dataset.error_message = str(e)

    db.commit()
    db.refresh(db_dataset)
    return db_dataset

@app.get("/datasets", response_model=List[DatasetResponse])
def get_datasets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).offset(skip).limit(limit).all()
    return datasets

@app.get("/datasets/{dataset_id}", response_model=AnalysisResult)
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@app.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    local_file_path = Path(dataset.file_path)
    try:
        uploads_root = UPLOAD_DIR.resolve()
        resolved_path = local_file_path.resolve()
        if resolved_path.is_file() and uploads_root in resolved_path.parents:
            resolved_path.unlink()
    except Exception:
        pass
    
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted successfully"}

@app.get("/datasets/{dataset_id}/download")
def download_results(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset or dataset.status != "completed":
        raise HTTPException(status_code=404, detail="Results not available")
    if dataset.processing_result:
        return json.loads(dataset.processing_result)

    raise HTTPException(status_code=404, detail="Results not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
