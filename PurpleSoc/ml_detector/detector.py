from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import pandas as pd

import pandas as pd
import joblib
from tensorflow.keras.models import load_model
from pymongo import MongoClient

app = FastAPI()
client = MongoClient("mongodb://admin:adminpassword@mongo:27017")
db = client.ids_db
collection = db.traffic_logs
model = load_model("/models/ids_deep_learning_model.h5")
scaler = joblib.load("/models/ids_scaler_top20.pkl")
top_20_features = joblib.load("/models/top_20_features.pkl")
# نموذج البيانات المتوقع من CICFlowMeter
class FlowData(BaseModel):
    src_ip: Optional[str]
    dst_ip: Optional[str]
    src_port: Optional[int]
    dst_port: Optional[int]
    protocol: Optional[int]
    timestamp: Optional[str]
    flow_duration: Optional[float]
    flow_byts_s: Optional[float]
    flow_pkts_s: Optional[float]
    fwd_pkts_s: Optional[float]
    bwd_pkts_s: Optional[float]
    tot_fwd_pkts: Optional[int]
    tot_bwd_pkts: Optional[int]
    totlen_fwd_pkts: Optional[int]
    totlen_bwd_pkts: Optional[int]
    fwd_pkt_len_max: Optional[int]
    fwd_pkt_len_min: Optional[int]
    fwd_pkt_len_mean: Optional[float]
    fwd_pkt_len_std: Optional[float]
    bwd_pkt_len_max: Optional[int]
    bwd_pkt_len_min: Optional[int]
    bwd_pkt_len_mean: Optional[float]
    bwd_pkt_len_std: Optional[float]
    pkt_len_max: Optional[int]
    pkt_len_min: Optional[int]
    pkt_len_mean: Optional[float]
    pkt_len_std: Optional[float]
    pkt_len_var: Optional[float]
    fwd_header_len: Optional[int]
    bwd_header_len: Optional[int]
    fwd_seg_size_min: Optional[int]
    fwd_act_data_pkts: Optional[int]
    flow_iat_mean: Optional[float]
    flow_iat_max: Optional[float]
    flow_iat_min: Optional[float]
    flow_iat_std: Optional[float]
    fwd_iat_tot: Optional[float]
    fwd_iat_max: Optional[float]
    fwd_iat_min: Optional[float]
    fwd_iat_mean: Optional[float]
    fwd_iat_std: Optional[float]
    bwd_iat_tot: Optional[float]
    bwd_iat_max: Optional[float]
    bwd_iat_min: Optional[float]
    bwd_iat_mean: Optional[float]
    bwd_iat_std: Optional[float]
    fwd_psh_flags: Optional[int]
    bwd_psh_flags: Optional[int]
    fwd_urg_flags: Optional[int]
    bwd_urg_flags: Optional[int]
    fin_flag_cnt: Optional[int]
    syn_flag_cnt: Optional[int]
    rst_flag_cnt: Optional[int]
    psh_flag_cnt: Optional[int]
    ack_flag_cnt: Optional[int]
    urg_flag_cnt: Optional[int]
    ece_flag_cnt: Optional[int]
    down_up_ratio: Optional[float]
    pkt_size_avg: Optional[float]
    init_fwd_win_byts: Optional[int]
    init_bwd_win_byts: Optional[int]
    active_max: Optional[float]
    active_min: Optional[float]
    active_mean: Optional[float]
    active_std: Optional[float]
    idle_max: Optional[float]
    idle_min: Optional[float]
    idle_mean: Optional[float]
    idle_std: Optional[float]
    fwd_byts_b_avg: Optional[float]
    fwd_pkts_b_avg: Optional[float]
    bwd_byts_b_avg: Optional[float]
    bwd_pkts_b_avg: Optional[float]
    fwd_blk_rate_avg: Optional[float]
    bwd_blk_rate_avg: Optional[float]
    fwd_seg_size_avg: Optional[float]
    bwd_seg_size_avg: Optional[float]
    cwr_flag_count: Optional[int]
    subflow_fwd_pkts: Optional[int]
    subflow_bwd_pkts: Optional[int]
    subflow_fwd_byts: Optional[int]
    subflow_bwd_byts: Optional[int]

# القاموس لإعادة تسمية الأعمدة
csv_to_analysis_map = {
    'dst_port': 'Destination Port',
    'flow_duration': 'Flow Duration',
    'tot_fwd_pkts': 'Total Fwd Packets',
    'tot_bwd_pkts': 'Total Backward Packets',
    'totlen_fwd_pkts': 'Total Length of Fwd Packets',
    'totlen_bwd_pkts': 'Total Length of Bwd Packets',
    'fwd_pkt_len_max': 'Fwd Packet Length Max',
    'fwd_pkt_len_min': 'Fwd Packet Length Min',
    'fwd_pkt_len_mean': 'Fwd Packet Length Mean',
    'fwd_pkt_len_std': 'Fwd Packet Length Std',
    'bwd_pkt_len_max': 'Bwd Packet Length Max',
    'bwd_pkt_len_min': 'Bwd Packet Length Min',
    'bwd_pkt_len_mean': 'Bwd Packet Length Mean',
    'bwd_pkt_len_std': 'Bwd Packet Length Std',
    'flow_byts_s': 'Flow Bytes/s',
    'flow_pkts_s': 'Flow Packets/s',
    'flow_iat_mean': 'Flow IAT Mean',
    'flow_iat_std': 'Flow IAT Std',
    'flow_iat_max': 'Flow IAT Max',
    'flow_iat_min': 'Flow IAT Min',
    'fwd_iat_tot': 'Fwd IAT Total',
    'fwd_iat_mean': 'Fwd IAT Mean',
    'fwd_iat_std': 'Fwd IAT Std',
    'fwd_iat_max': 'Fwd IAT Max',
    'fwd_iat_min': 'Fwd IAT Min',
    'bwd_iat_tot': 'Bwd IAT Total',
    'bwd_iat_mean': 'Bwd IAT Mean',
    'bwd_iat_std': 'Bwd IAT Std',
    'bwd_iat_max': 'Bwd IAT Max',
    'bwd_iat_min': 'Bwd IAT Min',
    'fwd_psh_flags': 'Fwd PSH Flags',
    'bwd_psh_flags': 'Bwd PSH Flags',
    'fwd_urg_flags': 'Fwd URG Flags',
    'bwd_urg_flags': 'Bwd URG Flags',
    'fwd_header_len': 'Fwd Header Length',
    'bwd_header_len': 'Bwd Header Length',
    'fwd_pkts_s': 'Fwd Packets/s',
    'bwd_pkts_s': 'Bwd Packets/s',
    'pkt_len_min': 'Min Packet Length',
    'pkt_len_max': 'Max Packet Length',
    'pkt_len_mean': 'Packet Length Mean',
    'pkt_len_std': 'Packet Length Std',
    'pkt_len_var': 'Packet Length Variance',
    'fin_flag_cnt': 'FIN Flag Count',
    'syn_flag_cnt': 'SYN Flag Count',
    'rst_flag_cnt': 'RST Flag Count',
    'psh_flag_cnt': 'PSH Flag Count',
    'ack_flag_cnt': 'ACK Flag Count',
    'urg_flag_cnt': 'URG Flag Count',
    'cwe_flag_cnt': 'CWE Flag Count', 
    'ece_flag_cnt': 'ECE Flag Count',
    'down_up_ratio': 'Down/Up Ratio',
    'pkt_size_avg': 'Average Packet Size',
    'fwd_seg_size_avg': 'Avg Fwd Segment Size',
    'bwd_seg_size_avg': 'Avg Bwd Segment Size',
    'init_fwd_win_byts': 'Init_Win_bytes_forward',
    'init_bwd_win_byts': 'Init_Win_bytes_backward',
    'fwd_act_data_pkts': 'act_data_pkt_fwd',
    'fwd_seg_size_min': 'min_seg_size_forward',
    'active_mean': 'Active Mean',
    'active_std': 'Active Std',
    'active_max': 'Active Max',
    'active_min': 'Active Min',
    'idle_mean': 'Idle Mean',
    'idle_std': 'Idle Std',
    'idle_max': 'Idle Max',
    'idle_min': 'Idle Min',
    'fwd_byts_b_avg': 'Fwd Avg Bytes/Bulk',
    'fwd_pkts_b_avg': 'Fwd Avg Packets/Bulk',
    'fwd_blk_rate_avg': 'Fwd Avg Bulk Rate',
    'bwd_byts_b_avg': 'Bwd Avg Bytes/Bulk',
    'bwd_pkts_b_avg': 'Bwd Avg Packets/Bulk',
    'bwd_blk_rate_avg': 'Bwd Avg Bulk Rate',
    'subflow_fwd_pkts': 'Subflow Fwd Packets',
    'subflow_fwd_byts': 'Subflow Fwd Bytes',
    'subflow_bwd_pkts': 'Subflow Bwd Packets',
    'subflow_bwd_byts': 'Subflow Bwd Bytes'
}


def _normalize_timestamp(raw_ts: Optional[str]) -> datetime:
    if not raw_ts:
        return datetime.utcnow()

    value = str(raw_ts).strip()
    if not value:
        return datetime.utcnow()

    # Handle common timestamp formats emitted by flow tools.
    candidates = [
        value,
        value.replace("Z", "+00:00"),
        value.replace("/", "-"),
    ]

    for item in candidates:
        try:
            return datetime.fromisoformat(item)
        except ValueError:
            pass

    for fmt in ("%Y-%m-%d %H:%M:%S", "%d-%m-%Y %H:%M:%S", "%m-%d-%Y %H:%M:%S"):
        try:
            return datetime.strptime(value.replace("/", "-"), fmt)
        except ValueError:
            pass

    return datetime.utcnow()


def _normalize_label(raw_label) -> int:
    value = raw_label

    # model output can be nested arrays/lists for a single-row prediction
    while isinstance(value, (list, tuple)) and value:
        value = value[0]

    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass

    try:
        return int(value)
    except (TypeError, ValueError):
        return 0

@app.post("/predict")
async def predict(flow: FlowData):
    data_dict = flow.model_dump()
    print("وصلت بيانات CICFlowMeter:")
    
    try:
        # تحويل dict لصف واحد
        df = pd.DataFrame([data_dict])
        df.rename(columns=csv_to_analysis_map, inplace=True)
        df.columns = df.columns.str.strip()
        data = df[top_20_features]
        scaled = scaler.transform(data)
        pred = model.predict(scaled)
        labels = (pred > 0.5).astype(int)
        df['label'] = labels
        records = df[['src_ip', 'dst_ip', 'src_port', 'Destination Port', 'protocol', 'timestamp', 'label']].to_dict(orient='records')
        for record in records:
            record['dst_port'] = record.pop('Destination Port')
            record['label'] = _normalize_label(record.get('label'))
            record['timestamp'] = _normalize_timestamp(record.get('timestamp'))

            
        collection.insert_many(records)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"status": "received"}
