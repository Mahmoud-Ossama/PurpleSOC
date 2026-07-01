"use client";

import { useQueryState } from "nuqs";
import TimeRangeSelect from "@/components/shared/TimeRangeSelect";

export default function TrafficFilters() {
  const [srcIp,    setSrcIp]    = useQueryState("srcIp",    { defaultValue: "" });
  const [dstIp,    setDstIp]    = useQueryState("dstIp",    { defaultValue: "" });
  const [port,     setPort]     = useQueryState("port",     { defaultValue: "" });
  const [protocol, setProtocol] = useQueryState("protocol", { defaultValue: "ALL" });
  const [label,    setLabel]    = useQueryState("label",    { defaultValue: "ALL" });
  const [range,    setRange]    = useQueryState("range",    { defaultValue: "24h" });
  const [country,  setCountry]  = useQueryState("country",  { defaultValue: "" });
  const [city,     setCity]     = useQueryState("city",     { defaultValue: "" });

  const clear = () => {
    setSrcIp(""); setDstIp(""); setPort(""); setProtocol("ALL");
    setLabel("ALL"); setRange("24h"); setCountry(""); setCity("");
  };

  const inp: React.CSSProperties = {
    padding: "6px 10px", background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)", borderRadius: 4,
    color: "var(--text-primary)", fontSize: 12, fontFamily: "var(--font-body)",
    outline: "none", transition: "border-color 150ms ease",
  };
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--accent-cyan)");
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = "var(--border-subtle)");

  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap",
      padding: "12px 20px", background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-subtle)",
    }}>
      <input value={srcIp} onChange={e => setSrcIp(e.target.value)} placeholder="Src IP…" style={{ ...inp, minWidth: 130 }} onFocus={focus} onBlur={blur} />
      <input value={dstIp} onChange={e => setDstIp(e.target.value)} placeholder="Dst IP…" style={{ ...inp, minWidth: 130 }} onFocus={focus} onBlur={blur} />
      <input value={port}  onChange={e => setPort(e.target.value)}  placeholder="Port…"   style={{ ...inp, minWidth: 75, maxWidth: 80 }} onFocus={focus} onBlur={blur} type="number" />

      {/* Geo filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>GEO</span>
        <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country…" style={{ ...inp, minWidth: 120 }} onFocus={focus} onBlur={blur} />
        <input value={city}    onChange={e => setCity(e.target.value)}    placeholder="City…"    style={{ ...inp, minWidth: 110 }} onFocus={focus} onBlur={blur} />
      </div>

      <select value={protocol} onChange={e => setProtocol(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
        {["ALL","TCP","UDP","ICMP","SSH","HTTP","HTTPS"].map(p => (
          <option key={p} value={p} style={{ background: "var(--bg-overlay)" }}>{p}</option>
        ))}
      </select>

      <select value={label} onChange={e => setLabel(e.target.value)} style={{ ...inp, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
        {["ALL","ATTACK","BENIGN"].map(l => (
          <option key={l} value={l} style={{ background: "var(--bg-overlay)" }}>{l}</option>
        ))}
      </select>

      <TimeRangeSelect value={range} onChange={setRange} />

      <button onClick={clear} style={{
        padding: "6px 12px", borderRadius: 4, border: "1px solid var(--border-subtle)",
        background: "transparent", color: "var(--text-tertiary)", fontSize: 11, cursor: "pointer",
        transition: "all 150ms ease",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)"; }}
      >Clear</button>
    </div>
  );
}
