import React, { useMemo } from 'react';

const HYD_RECS = [
  { name: "Nizam's Institute of Medical Sciences (NIMS)", dept: 'Neurology', area: 'Punjagutta, Hyderabad' },
  { name: 'KIMS Hospitals', dept: 'Epileptology / Neurology', area: 'Minister Road, Secunderabad' },
  { name: 'Care Hospitals', dept: 'Neurology Department', area: 'Banjara Hills, Hyderabad' },
  { name: 'Yashoda Hospitals', dept: 'Epilepsy / Neurology', area: 'Somajiguda, Hyderabad' },
];

function mapsUrl(query) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function RecommendedSpecialists({ resultLabel }) {
  const urgent = resultLabel === 'Ictal' || resultLabel === 'Pre-ictal';
  const bannerStyle = urgent
    ? { border: '1px solid rgba(255,42,42,0.35)', background: 'rgba(255,42,42,0.08)' }
    : { border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.06)' };

  const bannerText = urgent
    ? 'Seizure Risk Detected — consult a neurologist immediately.'
    : 'No seizure detected — regular monitoring recommended.';

  const titleColor = urgent ? '#ff2a2a' : '#22c55e';

  const cards = useMemo(() => HYD_RECS, []);

  return (
    <div className="glass-panel" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div className="neon-text" style={{ fontWeight: 700 }}>Suggested specialists / hospitals</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Hyderabad (editable)</div>
      </div>

      <div style={{ ...bannerStyle, borderRadius: 14, padding: 12, marginTop: 12 }}>
        <div style={{ color: titleColor, fontWeight: 800 }}>{bannerText}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
          This is guidance only, not a medical diagnosis.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
        {cards.map((c) => (
          <div key={c.name} className="glass-panel" style={{ padding: 14, border: '1px solid rgba(0,255,255,0.12)' }}>
            <div className="neon-text" style={{ fontWeight: 800 }}>{c.name}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{c.dept}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{c.area}</div>
            <a className="btn-secondary" style={{ marginTop: 12, display: 'inline-block', width: '100%', textAlign: 'center', textDecoration: 'none' }} href={mapsUrl(`${c.name} ${c.area}`)} target="_blank" rel="noreferrer">
              Get Directions
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

