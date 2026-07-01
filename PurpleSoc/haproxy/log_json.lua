local cjson = require("cjson")

core.register_action("log_to_json", { "http-req" }, function(txn)

    -- الوقت
    local time = os.date("%Y-%m-%d %H:%M:%S")

    -- IP الخاص بالعميل
    local src_ip = txn.f:src() or ""

    -- headers
    local host = txn.f:req_fhdr("host") or ""

    -- تحديد البروتوكول
    local scheme = "http://"
    if txn.f:ssl_fc() then
        scheme = "https://"
    end

    -- بناء الرابط
    local path = txn.f:path() or ""
    local ver = txn.f:req_ver() or "1.1"
    local url = scheme .. host .. path .. " HTTP/" .. ver

    local log_data = {

        ["time"] = time,
        ["source_ip"] = src_ip,

        ["method"] = txn.f:method() or "",
        ["user-agent"] = txn.f:req_fhdr("user-agent") or "",
        ["pragma"] = txn.f:req_fhdr("pragma") or "",
        ["cache-control"] = txn.f:req_fhdr("cache-control") or "",
        ["accept"] = txn.f:req_fhdr("accept") or "",
        ["accept-encoding"] = txn.f:req_fhdr("accept-encoding") or "",
        ["accept-charset"] = txn.f:req_fhdr("accept-charset") or "",
        ["accept-language"] = txn.f:req_fhdr("accept-language") or "",
        ["host"] = host,
        ["cookie"] = txn.f:req_fhdr("cookie") or "",
        ["content-type"] = txn.f:req_fhdr("content-type") or "",
        ["connection"] = txn.f:req_fhdr("connection") or "",
        ["content-length"] = txn.f:req_fhdr("content-length") or "",
        ["content"] = txn.f:req_body() or "",
        ["url"] = url
    }

    local success, json_str = pcall(cjson.encode, log_data)

    if success then
        core.log(core.info, json_str)
    else
        core.log(core.err, "Lua JSON encode error")
    end
end)
