import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, ExternalLink, Hospital, Stethoscope,
  Brain, Loader, AlertCircle, Navigation,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps search link generators
// ─────────────────────────────────────────────────────────────────────────────
function gmapsSearchUrl(query, lat, lng, zoom = 14) {
  const q = encodeURIComponent(query);
  return `https://www.google.com/maps/search/${q}/@${lat},${lng},${zoom}z`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search category definitions
// ─────────────────────────────────────────────────────────────────────────────
const SEARCH_CATEGORIES = [
  {
    id: 'neurologist',
    label: 'Nearby Neurologists',
    subtitle: 'Find specialist brain & nerve doctors in your area',
    query: 'neurologist',
    Icon: Brain,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.10)',
    border: 'rgba(192,132,252,0.30)',
    btnGradient: 'linear-gradient(135deg,#7c3aed,#c084fc)',
    btnShadow: 'rgba(192,132,252,0.30)',
    emoji: '🧠',
  },
  {
    id: 'hospital',
    label: 'Nearby Hospitals',
    subtitle: 'Find hospitals and emergency care centres near you',
    query: 'hospital',
    Icon: Hospital,
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.30)',
    btnGradient: 'linear-gradient(135deg,#059669,#34d399)',
    btnShadow: 'rgba(52,211,153,0.28)',
    emoji: '🏥',
  },
  {
    id: 'epilepsy',
    label: 'Epilepsy Specialists',
    subtitle: 'Find epilepsy & seizure disorder clinics near you',
    query: 'epilepsy specialist',
    Icon: Stethoscope,
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.10)',
    border: 'rgba(129,140,248,0.30)',
    btnGradient: 'linear-gradient(135deg,#4f46e5,#818cf8)',
    btnShadow: 'rgba(129,140,248,0.28)',
    emoji: '⚡',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Search card component
// ─────────────────────────────────────────────────────────────────────────────
function SearchCard({ cat, lat, lng }) {
  const href = gmapsSearchUrl(cat.query, lat, lng);
  const { Icon } = cat;

  return (
    <div
      className="glass-panel"
      style={{
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        border: `1px solid ${cat.border}`,
        background: cat.bg,
        transition: 'transform 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 20px 48px ${cat.btnShadow}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: `linear-gradient(135deg,${cat.color}22,${cat.color}44)`,
          border: `1px solid ${cat.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={26} style={{ color: cat.color }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {cat.emoji} {cat.label}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
            {cat.subtitle}
          </div>
        </div>
      </div>

      {/* Location pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
        borderRadius: 10, padding: '8px 12px', fontSize: '0.8rem',
        color: 'var(--text-secondary)',
      }}>
        <MapPin size={13} style={{ color: cat.color, flexShrink: 0 }} />
        <span>Searching near <strong style={{ color: 'var(--text-primary)' }}>{lat.toFixed(4)}°N, {lng.toFixed(4)}°E</strong></span>
      </div>

      {/* Open Maps button */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: cat.btnGradient,
          color: 'white',
          borderRadius: 12,
          padding: '13px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: `0 4px 18px ${cat.btnShadow}`,
          transition: 'filter 0.2s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
      >
        <ExternalLink size={16} />
        Open in Google Maps
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function Category3() {
  const navigate = useNavigate();

  const [geoStatus, setGeoStatus] = useState('idle'); // idle | requesting | done | denied
  const [coords, setCoords]       = useState(null);   // { lat, lng }

  // ── Request GPS on mount ─────────────────────────────────────────────────
  useEffect(() => {
    setGeoStatus('requesting');
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('done');
      },
      () => setGeoStatus('denied'),
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, []);

  // ── Retry ────────────────────────────────────────────────────────────────
  const retry = () => {
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('done');
      },
      () => setGeoStatus('denied'),
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="app-canvas flex-col">
      <div className="orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
      <div className="orb orb-blue" style={{ bottom: '-10%', right: '-5%' }} />

      {/* NAV */}
      <nav className="dashboard-nav glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapPin size={24} className="neon-icon" />
          <h1 className="title neon-text" style={{ fontSize: '1.4rem', margin: 0 }}>Nearby Doctors</h1>
        </div>
        <button className="btn-secondary nav-btn" id="cat3-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} style={{ marginRight: 8 }} /> Back to Dashboard
        </button>
      </nav>

      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── INFORMATION BANNER ──────────────────────────────────────── */}
        <div className="glass-panel" style={{
          padding: '18px 22px',
          borderColor: 'rgba(129,140,248,0.25)',
          background: 'rgba(99,102,241,0.05)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: '#818cf8' }}>
            🗺️ Find Medical Specialists Near You
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            We use your GPS location to generate direct Google Maps search links — no API, no data shared, fully private.
            Click any card below to open a live search of nearby specialists.
          </p>
        </div>

        {/* ── GPS STATUS ──────────────────────────────────────────────── */}
        {geoStatus === 'requesting' && (
          <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Loader size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Requesting your location…</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
                Please allow location access in your browser to generate personalised search links.
              </div>
            </div>
          </div>
        )}

        {geoStatus === 'done' && coords && (
          <div className="glass-panel" style={{
            padding: '12px 18px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 10,
            borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} style={{ color: '#34d399' }} />
              <span style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
                📍 Location detected — {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
              </span>
            </div>
            <button
              onClick={retry}
              style={{
                background: 'none', border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399', borderRadius: 8, padding: '5px 12px',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              🔄 Re-detect
            </button>
          </div>
        )}

        {geoStatus === 'denied' && (
          <div className="glass-panel" style={{
            padding: 20, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontWeight: 700, marginBottom: 10 }}>
              <AlertCircle size={18} /> Location Access Denied
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 14 }}>
              Your browser blocked location access. You can still use the links below — they will open Google Maps and let you set your location manually inside the app.
            </p>
            <button className="btn-secondary" onClick={retry} style={{ gap: 8, display: 'flex', alignItems: 'center' }}>
              🔄 Try Again
            </button>

            {/* Fallback: show generic links without coordinates */}
            <div style={{ marginTop: 20 }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 12 }}>
                Or use these general search links (no coordinates):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SEARCH_CATEGORIES.map(cat => (
                  <a
                    key={cat.id}
                    href={`https://www.google.com/maps/search/${encodeURIComponent(cat.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 12,
                      background: cat.bg, border: `1px solid ${cat.border}`,
                      color: cat.color, textDecoration: 'none',
                      fontWeight: 600, fontSize: '0.88rem',
                      transition: 'filter 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                  >
                    <ExternalLink size={15} />
                    {cat.emoji} {cat.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SEARCH CARDS — shown when location is available ─────────── */}
        {geoStatus === 'done' && coords && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {SEARCH_CATEGORIES.map(cat => (
              <SearchCard key={cat.id} cat={cat} lat={coords.lat} lng={coords.lng} />
            ))}
          </div>
        )}

        {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
        <div className="glass-panel" style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ℹ️ How This Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { step: '1', text: 'Your browser reads your GPS coordinates' },
              { step: '2', text: 'We embed them into a Google Maps search URL' },
              { step: '3', text: 'Google Maps shows real-time nearby results' },
              { step: '4', text: 'No data leaves your device to our servers' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#4f46e5,#818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: 'white',
                }}>
                  {step}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
