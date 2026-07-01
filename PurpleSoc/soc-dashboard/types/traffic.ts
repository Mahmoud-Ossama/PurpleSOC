export interface TrafficRecord {
  _id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: number;
  timestamp: string;
  label: string; // "0" = BENIGN, "1" = ATTACK
}

export type TrafficLabel = "ATTACK" | "BENIGN";

export function getProtocolName(protocol: number): string {
  const protocols: Record<number, string> = {
    1: "ICMP",
    6: "TCP",
    17: "UDP",
    22: "SSH",
    80: "HTTP",
    443: "HTTPS",
  };
  return protocols[protocol] ?? `PROTO ${protocol}`;
}

export function getLabelDisplay(label: string): TrafficLabel {
  return label === "1" || label === "ATTACK" ? "ATTACK" : "BENIGN";
}
