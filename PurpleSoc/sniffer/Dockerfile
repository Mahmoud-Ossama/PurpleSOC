FROM python:3.12-slim

# أدوات أساسية
RUN apt-get update && apt-get install -y \
    git \
    tcpdump \
    iproute2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# استنساخ المشروع
RUN git clone https://github.com/boss-error/cicflowmeter .

# تثبيت CICFlowMeter مباشرة عبر pip
RUN pip install --upgrade pip
RUN pip install .

# مجلد لحفظ النتائج
VOLUME ["/app/captures"]
ENTRYPOINT ["bash", "-c", "\
    echo '=== واجهات الشبكة ==='; \
    ip link; \
    echo '=== عناوين IP ==='; \
    ip addr; \
    echo '=== تشغيل CICFlowMeter ==='; \
    cicflowmeter -i eth0 -u http://ml_detector:5000/predict \
"]
