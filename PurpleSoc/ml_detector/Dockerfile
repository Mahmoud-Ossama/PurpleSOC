# استخدم Python 3.10 رسمي
FROM python:3.12-slim

# تحديث الحزم الأساسية (بدون أدوات التقاط الترافيك)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# تثبيت مكتبات بايثون المطلوبة فقط
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    joblib \
    tensorflow \
    pymongo \
    fastapi \
    scikit-learn \
    "pydantic>=2.0" \
    uvicorn

# تعيين مجلد العمل
WORKDIR /app

# نسخ السكربت
COPY detector.py .

# الأمر الافتراضي لتشغيل FastAPI عبر uvicorn
CMD ["uvicorn", "detector:app", "--host", "0.0.0.0", "--port", "5000"]
