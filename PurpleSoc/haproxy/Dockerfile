FROM haproxy:2.4

# التبديل إلى المستخدم الجذر لتثبيت الحزم
USER root

# تثبيت Lua + cjson + openssl
RUN apt-get update && \
    apt-get install -y lua5.3 lua-cjson openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# نسخ ملفات الإعدادات و entrypoint
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
COPY log_json.lua /usr/local/etc/haproxy/log_json.lua

# توليد شهادة SSL تلقائيًا ودمجها
RUN mkdir -p /etc/ssl/certs /etc/ssl/private && \
    openssl req -x509 -nodes -days 365 \
        -subj "/CN=localhost" \
        -newkey rsa:2048 \
        -keyout /etc/ssl/private/mykey.pem \
        -out /etc/ssl/certs/mycert.pem && \
    cat /etc/ssl/certs/mycert.pem /etc/ssl/private/mykey.pem > /etc/ssl/haproxy.pem

EXPOSE 443 514

CMD ["sh", "-c", "haproxy -f /usr/local/etc/haproxy/haproxy.cfg -db"]
