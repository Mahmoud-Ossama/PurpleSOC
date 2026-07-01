export interface LogHeaders {
  pragma?: string;
  cache_control?: string;       // Python stores with underscore
  accept?: string;
  accept_encoding?: string;
  accept_charset?: string;
  accept_language?: string;
  cookie?: string;
  content_type?: string;
  connection?: string;
  content_length?: string;
  content?: string;
}

export interface LogEntry {
  _id: string;
  decoded_data: string;         // raw JSON string from HAProxy
  report_id?: string;
  received_at: string;
  analyzed: boolean;
  source_ip: string;
  method: string;
  url: string;
  user_agent: string;
  host: string;
  headers: LogHeaders;
}

export interface DecodedLogData {
  time?: string;
  source_ip?: string;
  method?: string;
  "user-agent"?: string;
  pragma?: string;
  "cache-control"?: string;
  accept?: string;
  "accept-encoding"?: string;
  "accept-charset"?: string;
  "accept-language"?: string;
  host?: string;
  cookie?: string;
  "content-type"?: string;
  connection?: string;
  "content-length"?: string;
  content?: string;
  url?: string;
}
