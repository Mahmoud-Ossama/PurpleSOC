"use client";

/**
 * Dynamic country flag renderer.
 * Uses i18n-iso-countries to map any country name → ISO-3166-1 alpha-2 code,
 * then react-country-flag to render a real SVG/emoji flag.
 * Zero hardcoded values — works for all ~250 countries.
 */
import React from "react";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ReactCountryFlag from "react-country-flag";

// Register English locale once
countries.registerLocale(enLocale);

/** Convert any country name to ISO-3166-1 alpha-2 code */
export function getCountryCode(name: string): string | null {
  if (!name) return null;

  // Direct lookup
  const code = countries.getAlpha2Code(name, "en");
  if (code) return code;

  // Fuzzy: try trimmed lowercase
  const lower = name.trim().toLowerCase();
  const all = countries.getNames("en");
  for (const [iso, cName] of Object.entries(all)) {
    if (cName.toLowerCase().includes(lower) || lower.includes(cName.toLowerCase())) {
      return iso;
    }
  }

  return null;
}

interface FlagProps {
  country: string;          // Full country name e.g. "United States"
  size?: number;            // px, default 18
  showCode?: boolean;
  style?: React.CSSProperties;
}

export default function CountryFlag({ country, size = 18, showCode = false, style }: FlagProps) {
  const code = getCountryCode(country);

  if (!code) {
    return (
      <span style={{ fontSize: size * 0.9, lineHeight: 1, ...style }} title={country}>
        🌐
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ...style }} title={country}>
      <ReactCountryFlag
        countryCode={code}
        svg
        style={{ width: size, height: size * 0.75, borderRadius: 2 }}
        title={country}
      />
      {showCode && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: Math.max(9, size * 0.6),
          color: "var(--text-tertiary)",
          letterSpacing: "0.04em",
        }}>
          {code}
        </span>
      )}
    </span>
  );
}
