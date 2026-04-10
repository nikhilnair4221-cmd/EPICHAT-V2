import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Navigation, ExternalLink,
  Hospital, Stethoscope, Brain, Loader, AlertCircle,
  Search, RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance (km)
// ─────────────────────────────────────────────────────────────────────────────
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache helpers — localStorage keyed by rounded coords
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_KEY = (lat, lng) =>
  `epichat_doctors_${lat.toFixed(2)}_${lng.toFixed(2)}`;

function readCache(lat, lng) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(lat, lng));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    // Cache valid for 30 minutes
    if (Date.now() - ts < 30 * 60 * 1000) return data;
  } catch (_) {}
  return null;
}

function writeCache(lat, lng, data) {
  try {
    localStorage.setItem(CACHE_KEY(lat, lng), JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Single Overpass attempt with 5-second AbortController timeout
// ─────────────────────────────────────────────────────────────────────────────
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function attemptOverpass(lat, lng, radiusM, mirrorUrl) {
  const query = `
[out:json][timeout:20];
(
  node["amenity"="hospital"](around:${radiusM},${lat},${lng});
  way["amenity"="hospital"](around:${radiusM},${lat},${lng});
  node["amenity"="clinic"](around:${radiusM},${lat},${lng});
  way["amenity"="clinic"](around:${radiusM},${lat},${lng});
  node["healthcare"="doctor"](around:${radiusM},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusM},${lat},${lng});
  node["name"~"neuro|epilep|brain",i](around:${radiusM},${lat},${lng});
);
out center 40;
  `.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // 5 s timeout

  try {
    const res = await fetch(mirrorUrl, {
      method:  'POST',
      body:    `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal:  controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse Overpass elements → doctor cards
// ─────────────────────────────────────────────────────────────────────────────
function parseOverpassElements(elements, lat, lng, radiusM) {
  return elements
    .filter(el => el.tags?.name)
    .map((el, idx) => {
      const eLat = el.lat ?? el.center?.lat;
      const eLng = el.lon  ?? el.center?.lon;
      const tags = el.tags || {};
      const amenity = tags.amenity || tags.healthcare || 'clinic';

      let type = 'hospital';
      const nameLower = (tags.name || '').toLowerCase();
      if (amenity === 'clinic' || amenity === 'doctor') type = 'clinic';
      if (nameLower.includes('neuro') || nameLower.includes('epilep') || nameLower.includes('brain')) type = 'neuro';

      const addrParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'] || tags['addr:city'],
        tags['addr:state'],
        tags['addr:postcode'],
      ].filter(Boolean);
      const address = addrParts.length
        ? addrParts.join(', ')
        : (tags['addr:full'] || 'Address not available');

      return {
        id:           el.id || idx,
        name:         tags.name,
        type,
        address,
        phone:        tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
        website:      tags.website || tags['contact:website'] || null,
        lat:          eLat,
        lng:          eLng,
        distance:     eLat != null ? distKm(lat, lng, eLat, eLng) : null,
        opening_hours: tags.opening_hours || null,
      };
    })
    .filter(d => d.lat != null && d.distance != null && d.distance <= radiusM / 1000)
    .sort((a, b) => a.distance - b.distance);
}

// ─────────────────────────────────────────────────────────────────────────────
// Overpass API — with retry + mirror + timeout + cache
// Returns: { data: [...], fromCache: bool, fromFallback: bool }
// Throws ONLY if all attempts exhausted AND no cache exists
// ─────────────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchNearbyFromOverpass(lat, lng, radiusM = 15000, onRetry = () => {}) {
  const MAX_RETRIES = 2;

  // Try each mirror, each up to MAX_RETRIES times
  for (const mirror of OVERPASS_MIRRORS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        onRetry(attempt, mirror);
        await sleep(1000 * attempt); // 1s, 2s back-off
      }
      try {
        const raw = await attemptOverpass(lat, lng, radiusM, mirror);
        const data = parseOverpassElements(raw.elements, lat, lng, radiusM);
        writeCache(lat, lng, data); // persist to cache on success
        return { data, fromCache: false, fromFallback: false };
      } catch (err) {
        const isLast = mirror === OVERPASS_MIRRORS[OVERPASS_MIRRORS.length - 1]
          && attempt === MAX_RETRIES;
        if (!isLast) continue;
        // All attempts on all mirrors exhausted — throw
        throw err;
      }
    }
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Nominatim geocode: city name → lat/lng
// ─────────────────────────────────────────────────────────────────────────────
async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'EpiChatApp/2.0' } });
  const data = await res.json();
  if (!data.length) throw new Error('City not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
}

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps links
// ─────────────────────────────────────────────────────────────────────────────
function mapsUrlCoords(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
function mapsUrlQuery(q) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const cfg = {
    hospital: { label: 'Hospital',          color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',  Icon: Hospital    },
    clinic:   { label: 'Clinic / Practice', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.35)', Icon: Stethoscope },
    neuro:    { label: 'Neurology Centre',  color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.35)', Icon: Brain       },
  };
  const { label, color, bg, border, Icon } = cfg[type] || cfg.clinic;
  return (
    <span style={{ background: bg, color, border: `1px solid ${border}`, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <Icon size={13} /> {label}
    </span>
  );
}

function DoctorCard({ doc }) {
  const mapsHref = doc.lat != null
    ? mapsUrlCoords(doc.lat, doc.lng)
    : mapsUrlQuery(doc.name + ' ' + doc.address);

  return (
    <div
      className="glass-panel"
      style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, transition: 'transform 0.25s, box-shadow 0.25s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(52,211,153,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{doc.name}</div>
        {doc.distance != null && (
          <div style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {doc.distance.toFixed(1)} km
          </div>
        )}
      </div>

      <TypeBadge type={doc.type} />

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <MapPin size={13} style={{ marginTop: 2, flexShrink: 0, color: 'var(--accent)' }} />
          <span>{doc.address}</span>
        </div>
        {doc.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Phone size={13} style={{ flexShrink: 0, color: 'var(--accent)' }} />
            <a href={`tel:${doc.phone}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{doc.phone}</a>
          </div>
        )}
        {doc.opening_hours && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            🕐 {doc.opening_hours}
          </div>
        )}
      </div>

      {/* Google Maps button */}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: 'linear-gradient(135deg,#059669,#34d399)',
          color: 'white', borderRadius: 12, padding: '11px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem',
          boxShadow: '0 4px 16px rgba(52,211,153,0.25)', transition: 'filter 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
      >
        <ExternalLink size={14} /> Open in Google Maps
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function Category3() {
  const navigate = useNavigate();

  const [geoStatus, setGeoStatus]   = useState('idle');    // idle|requesting|fetching|done|denied|error
  const [userCoords, setUserCoords]  = useState(null);
  const [locationLabel, setLocLabel] = useState('');
  const [doctors, setDoctors]        = useState([]);
  const [fetchError, setFetchError]  = useState('');
  const [retryMsg, setRetryMsg]      = useState('');   // live retry status
  const [fromCache, setFromCache]    = useState(false);
  const [filter, setFilter]          = useState('all');

  // Manual fallback
  const [manualCity, setManualCity]  = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // ── fetch from Overpass once we have coords ──────────────────────────────
  const loadDoctors = useCallback(async (lat, lng) => {
    setGeoStatus('fetching');
    setFetchError('');
    setRetryMsg('');
    setFromCache(false);

    try {
      const { data } = await fetchNearbyFromOverpass(
        lat, lng, 15000,
        (attempt, mirror) => {
          const mirrorShort = mirror.includes('kumi') ? 'mirror' : 'primary';
          setRetryMsg(`Retrying… (attempt ${attempt}/2 via ${mirrorShort} server)`);
        }
      );
      setDoctors(data);
      setGeoStatus('done');
      setRetryMsg('');
    } catch (err) {
      console.warn('Overpass failed after all retries:', err.message);

      // ── try cache first ────────────────────────────────────────────────
      const cached = readCache(lat, lng);
      if (cached && cached.length > 0) {
        // Never clear existing results — show cache with notice
        setDoctors(cached);
        setFromCache(true);
        setGeoStatus('done');
        setFetchError('Location service temporarily busy. Showing last available results.');
        setRetryMsg('');
        return;
      }

      // ── no cache — keep existing doctors visible (if any) ─────────────
      setFetchError(
        doctors.length > 0
          ? 'Location service temporarily busy. Showing previously loaded results.'
          : 'Location service temporarily busy. Enter your city below to search manually.'
      );
      // Only switch to error state if we had no doctors at all
      if (doctors.length === 0) setGeoStatus('error');
      else setGeoStatus('done');
      setRetryMsg('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── request GPS on mount ─────────────────────────────────────────────────
  useEffect(() => {
    setGeoStatus('requesting');
    if (!navigator.geolocation) { setGeoStatus('denied'); return; }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserCoords({ lat, lng });
        setLocLabel(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
        loadDoctors(lat, lng);
      },
      () => setGeoStatus('denied'),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [loadDoctors]);

  // ── manual city geocode ──────────────────────────────────────────────────
  const handleManualSearch = async () => {
    if (!manualCity.trim()) return;
    setManualLoading(true);
    setFetchError('');
    try {
      const { lat, lng, displayName } = await geocodeCity(manualCity.trim());
      setUserCoords({ lat, lng });
      setLocLabel(displayName.split(',').slice(0, 2).join(','));
      loadDoctors(lat, lng);
    } catch (err) {
      setFetchError(`Could not find "${manualCity}". Try a different city name.`);
    } finally {
      setManualLoading(false);
    }
  };

  // ── filter ───────────────────────────────────────────────────────────────
  const filtered = filter === 'all' ? doctors : doctors.filter(d => d.type === filter);

  const filterBtns = [
    { id: 'all',      label: 'All' },
    { id: 'hospital', label: 'Hospitals' },
    { id: 'neuro',    label: 'Neurology' },
    { id: 'clinic',   label: 'Clinics' },
  ];

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

      <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── STATUS BANNER ─────────────────────────────────────────────── */}
        {(geoStatus === 'requesting') && (
          <div className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>Requesting GPS permission…</span>
          </div>
        )}
        {(geoStatus === 'fetching') && (
          <div className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Loader size={18} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {retryMsg || 'Searching OpenStreetMap for hospitals & clinics within 15 km…'}
            </span>
          </div>
        )}
        {geoStatus === 'done' && (
          <div className="glass-panel" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderColor: fromCache ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)', background: fromCache ? 'rgba(245,158,11,0.04)' : 'rgba(52,211,153,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Navigation size={16} style={{ color: fromCache ? '#f59e0b' : '#34d399' }} />
              <span style={{ color: fromCache ? '#f59e0b' : '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
                📍 {locationLabel} — {doctors.length} places {fromCache ? '(📦 cached)' : 'found within 15 km'}
              </span>
            </div>
            <button
              onClick={() => userCoords && loadDoctors(userCoords.lat, userCoords.lng)}
              style={{ background: 'none', border: `1px solid ${fromCache ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)'}`, color: fromCache ? '#f59e0b' : '#34d399', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontFamily: 'inherit' }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        )}
        {/* Soft warning when using cache or service is busy — never a hard red error */}
        {fetchError && (
          <div className="glass-panel" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
            <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ color: '#f59e0b', fontSize: '0.82rem' }}>{fetchError}</span>
          </div>
        )}

        {/* ── DENIED / MANUAL FALLBACK ───────────────────────────────────── */}
        {(geoStatus === 'denied' || geoStatus === 'error') && (
          <div className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 12, fontWeight: 600 }}>
              <AlertCircle size={16} />
              {geoStatus === 'denied' ? 'Location access denied — enter your city manually' : 'Enter your city to search instead'}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="premium-input"
                placeholder="City name (e.g. Bengaluru, Chennai, Delhi…)"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                style={{ flex: 1, padding: '12px 16px' }}
              />
              <button
                className="btn-primary"
                onClick={handleManualSearch}
                disabled={manualLoading || !manualCity.trim()}
                style={{ minWidth: 110, gap: 8, display: 'flex', alignItems: 'center' }}
              >
                {manualLoading
                  ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Search size={15} />}
                {manualLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        )}
        {/* Always show manual search option if GPS denied even when there are existing results */}
        {geoStatus === 'denied' && doctors.length === 0 && null /* already shown above */}

        {/* ── FILTER PILLS ──────────────────────────────────────────────── */}
        {doctors.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {filterBtns.map(f => (
              <button
                key={f.id}
                id={`cat3-filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                style={{
                  background: filter === f.id ? 'linear-gradient(135deg,#059669,#34d399)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filter === f.id ? '#34d399' : 'var(--glass-border)'}`,
                  color: 'white', borderRadius: 20, padding: '8px 18px', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.25s',
                }}
              >
                {f.label} {filter === f.id && filtered.length > 0 ? `(${filtered.length})` : ''}
              </button>
            ))}
          </div>
        )}

        {/* ── NO RESULTS ────────────────────────────────────────────────── */}
        {geoStatus === 'done' && filtered.length === 0 && (
          <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
            <Hospital size={48} style={{ color: 'var(--text-secondary)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-secondary)' }}>
              No {filter === 'all' ? '' : filter} facilities found in this area. Try increasing the search radius or a different filter.
            </p>
          </div>
        )}

        {/* ── DOCTOR CARDS ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
          {filtered.map(doc => <DoctorCard key={doc.id} doc={doc} />)}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
