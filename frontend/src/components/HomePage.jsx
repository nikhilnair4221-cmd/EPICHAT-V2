import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Activity, Zap, Heart, ShieldAlert, HeartPulse,
  ArrowRight, ChevronDown, Phone, Mail, AlertTriangle,
  Eye, Moon, Sun, Clock
} from 'lucide-react';
import { ThemeToggleSwitch } from './ThemeToggle';

// ─── Live theme hook (reacts to MutationObserver on <html data-theme>) ───────
function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark')
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme; // 'dark' | 'light'
}

// ─── Section data ─────────────────────────────────────────────────────────────
const SEIZURE_TYPES = [
  { icon: Zap,         name: 'Focal Seizures',            color: '#818cf8', bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.22)', desc: 'Originate in one specific area of the brain. May cause unusual sensations or movements on one side of the body without loss of consciousness.' },
  { icon: Activity,    name: 'Tonic-Clonic (Grand Mal)',  color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.22)',   desc: 'The most recognized seizure type. Stiffening phase (tonic) followed by rhythmic jerking (clonic) and temporary loss of consciousness.' },
  { icon: Eye,         name: 'Absence Seizures',          color: '#eab308', bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.22)',   desc: 'Brief lapses in awareness that look like staring spells. Common in children. Last only a few seconds but may occur dozens of times a day.' },
  { icon: Moon,        name: 'Myoclonic Seizures',        color: '#c084fc', bg: 'rgba(192,132,252,0.10)',border: 'rgba(192,132,252,0.22)', desc: 'Sudden, brief muscle jerks or twitches. Often occur in the morning and can affect one or both sides of the body simultaneously.' },
  { icon: ShieldAlert, name: 'Atonic Seizures',           color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)',  desc: '"Drop attacks" — sudden loss of muscle tone causing collapse. High injury risk without protective headgear.' },
];

const EPILEPSY_FACTS = [
  { icon: Brain,         title: 'What is Epilepsy?',  color: '#818cf8', desc: 'Epilepsy is a chronic neurological disorder characterised by recurrent, unprovoked seizures caused by abnormal electrical activity in the brain. It affects over 50 million people worldwide.' },
  { icon: Zap,           title: 'Causes',             color: '#c084fc', desc: 'Causes include genetic factors, brain injuries, strokes, tumours, infections like meningitis, and prenatal brain damage. In ~50% of cases, no cause is identified (idiopathic epilepsy).' },
  { icon: AlertTriangle, title: 'Common Triggers',    color: '#eab308', desc: 'Sleep deprivation, missed medications, stress, flashing lights, alcohol use, fever, and hormonal changes can trigger seizures in susceptible individuals.' },
  { icon: Activity,      title: 'Why EEG Monitoring?',color: '#34d399', desc: 'EEG records brain electrical activity to detect seizure patterns, classify epilepsy type, and guide treatment decisions. Regular monitoring significantly improves patient outcomes.' },
];

const FIRST_AID_STEPS = [
  { num: '01', title: 'Stay Calm & Time It',    icon: Clock,         desc: 'Stay with the person and start timing the seizure immediately. Most seizures end within 1–3 minutes on their own.' },
  { num: '02', title: 'Keep Them Safe',          icon: ShieldAlert,   desc: 'Clear the area of hard or sharp objects. Cushion their head with something soft. Remove glasses if possible.' },
  { num: '03', title: 'Turn to Their Side',      icon: Heart,         desc: 'Gently turn the person onto their side (recovery position) to prevent choking on fluids.' },
  { num: '04', title: 'Do NOT Restrain',         icon: AlertTriangle, desc: 'Never hold the person down or put anything in their mouth. People cannot swallow their tongues — this is a common myth.' },
  { num: '05', title: 'Seek Help if Prolonged',  icon: Phone,         desc: 'Call emergency services if the seizure lasts more than 5 minutes, another follows immediately, or the person is injured or does not regain consciousness.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ tag, title, subtitle, dark }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <div style={{
        display: 'inline-block',
        background: dark ? 'rgba(129,140,248,0.12)' : 'rgba(99,102,241,0.09)',
        border: dark ? '1px solid rgba(129,140,248,0.3)' : '1px solid rgba(99,102,241,0.22)',
        borderRadius: 20, padding: '5px 16px',
        fontSize: '0.78rem', fontWeight: 700,
        color: dark ? '#818cf8' : '#6366f1',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: '1rem',
      }}>{tag}</div>
      <h2 className="title" style={{
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.75rem',
        color: dark ? '#f8fafc' : '#0f172a',
      }}>{title}</h2>
      {subtitle && (
        <p style={{ color: dark ? '#94a3b8' : '#475569', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const dark     = theme === 'dark';

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // ── Dynamic colours based on theme ────────────────────────────────────────
  const heroBg = dark
    ? 'radial-gradient(ellipse at 50% 20%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(192,132,252,0.12) 0%, transparent 50%)'
    : 'linear-gradient(160deg, #ffffff 0%, #eef1ff 50%, #f5f7ff 100%)';

  const sectionAltBg = dark ? 'rgba(0,0,0,0.22)' : 'rgba(241,244,255,0.8)';
  const navBg        = dark ? 'rgba(7,9,18,0.88)'  : 'rgba(255,255,255,0.88)';
  const navBorder    = dark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.12)';
  const textPrimary  = dark ? '#f8fafc' : '#0f172a';
  const textSecondary= dark ? '#94a3b8' : '#475569';
  const ctaBg        = dark
    ? 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(192,132,252,0.14) 100%)'
    : 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(124,58,237,0.08) 100%)';
  const ctaBorder    = dark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.18)';
  const footerBg     = dark ? 'rgba(0,0,0,0.35)'       : 'rgba(241,244,255,0.95)';
  const footerBorder = dark ? 'rgba(255,255,255,0.05)'  : 'rgba(99,102,241,0.1)';
  const orbOpacity   = dark ? 1 : 0.4;

  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden', fontFamily: 'Inter, sans-serif', background: 'var(--bg-dark)' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${navBorder}`,
        transition: 'background 0.35s ease, border-color 0.35s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="white" />
          </div>
          <span className="title" style={{ fontSize: '1.3rem', fontWeight: 700, color: textPrimary, textShadow: dark ? '0 0 20px rgba(129,140,248,0.4)' : 'none' }}>EpiChat</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['About', 'First Aid'].map(label => (
            <button key={label}
              onClick={() => scrollTo(label === 'About' ? 'about' : 'first-aid')}
              style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', padding: '8px 12px', borderRadius: 8, transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = textSecondary}
            >{label}</button>
          ))}
          {/* Theme toggle — inline in navbar, no floating position */}
          <ThemeToggleSwitch />
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '10px 22px', fontSize: '0.9rem', marginLeft: 4 }}>
            Login <ArrowRight size={15} style={{ marginLeft: 6 }} />
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 5% 80px',
        background: heroBg, position: 'relative',
        transition: 'background 0.4s ease',
      }}>
        {/* Floating orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(192,132,252,0.1)', filter: 'blur(70px)', opacity: orbOpacity, animation: 'floatOrb 8s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(129,140,248,0.08)', filter: 'blur(80px)', opacity: orbOpacity, animation: 'floatOrb 10s ease-in-out infinite alternate-reverse', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 780 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: dark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
            border: dark ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(99,102,241,0.2)',
            borderRadius: 24, padding: '6px 18px', marginBottom: '1.5rem',
            fontSize: '0.82rem', fontWeight: 700,
            color: dark ? '#818cf8' : '#6366f1',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }} />
            AI-Powered Neural Diagnostics
          </div>

          <h1 className="title" style={{
            fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05,
            marginBottom: '1.2rem', letterSpacing: '-2px',
            color: textPrimary, textShadow: dark ? '0 0 40px rgba(129,140,248,0.3)' : 'none',
          }}>
            Epi<span className="gradient-animate">Chat</span>
          </h1>

          <p style={{ fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)', color: textSecondary, lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: 580, margin: '0 auto 2.5rem' }}>
            AI-Powered Epilepsy Detection & Guidance Platform.<br />
            Upload EEG files, detect seizure risk in real-time, and get instant AI guidance.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: 16 }}>
              Get Started <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
            <button className="btn-secondary" onClick={() => scrollTo('about')} style={{ padding: '16px 32px', fontSize: '1.05rem', borderRadius: 16 }}>
              Learn More <ChevronDown size={18} style={{ marginLeft: 8 }} />
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[{ val: '50M+', label: 'People with Epilepsy' }, { val: 'EEGNet', label: 'AI Detection Model' }, { val: '< 5 min', label: 'Analysis Time' }].map(({ val, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>{val}</div>
                <div style={{ fontSize: '0.82rem', color: textSecondary, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div onClick={() => scrollTo('about')} style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', cursor: 'pointer', animation: 'bounce 2s ease-in-out infinite', color: textSecondary }}>
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ── ABOUT EPILEPSY ──────────────────────────────────────────────── */}
      <section id="about" style={{ padding: '100px 5%', background: sectionAltBg, transition: 'background 0.35s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader tag="Understanding Epilepsy" title="What You Need to Know" subtitle="Epilepsy is one of the most common neurological disorders. Understanding it is the first step toward better management." dark={dark} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {EPILEPSY_FACTS.map(({ icon: Icon, title, color, desc }) => (
              <div key={title} className="glass-panel" style={{ padding: '28px 24px', transition: 'transform 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${color}22, ${color}44)`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon size={26} style={{ color }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12, color: textPrimary }}>{title}</h3>
                <p style={{ color: textSecondary, lineHeight: 1.7, fontSize: '0.88rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEIZURE TYPES ───────────────────────────────────────────────── */}
      <section id="seizures" style={{ padding: '100px 5%', background: dark ? 'transparent' : '#f5f7ff', transition: 'background 0.35s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionHeader tag="Seizure Classification" title="Types of Seizures" subtitle="Seizures vary widely in their presentation. EpiChat's AI classifies EEG recordings across multiple seizure phenotypes." dark={dark} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
            {SEIZURE_TYPES.map(({ icon: Icon, name, color, bg, border, desc }) => (
              <div key={name} className="glass-panel" style={{ padding: '24px 20px', background: bg, border: `1px solid ${border}`, transition: 'transform 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                <Icon size={32} style={{ color, marginBottom: 14 }} />
                <h4 style={{ fontWeight: 700, color: textPrimary, marginBottom: 10, fontSize: '0.97rem' }}>{name}</h4>
                <p style={{ color: textSecondary, lineHeight: 1.65, fontSize: '0.84rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIRST AID ───────────────────────────────────────────────────── */}
      <section id="first-aid" style={{ padding: '100px 5%', background: sectionAltBg, transition: 'background 0.35s ease' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionHeader tag="Emergency Response" title="Seizure First Aid" subtitle="Knowing what to do during a seizure can save a life. Follow these steps." dark={dark} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FIRST_AID_STEPS.map(({ num, title, icon: Icon, desc }, i) => (
              <div key={num} className="glass-panel" style={{ padding: '20px 26px', display: 'flex', alignItems: 'flex-start', gap: 20, animation: `slideUp 0.5s ${i * 0.07}s ease both` }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: dark ? 'rgba(129,140,248,0.3)' : 'rgba(99,102,241,0.25)', fontFamily: 'Outfit, sans-serif', lineHeight: 1, minWidth: 40, flexShrink: 0 }}>{num}</div>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: dark ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(192,132,252,0.2))' : 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(124,58,237,0.12))', border: `1px solid ${dark ? 'rgba(129,140,248,0.2)' : 'rgba(99,102,241,0.18)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5, color: textPrimary }}>{title}</div>
                  <p style={{ color: textSecondary, lineHeight: 1.65, fontSize: '0.9rem', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 5%', textAlign: 'center', background: ctaBg, borderTop: `1px solid ${ctaBorder}`, borderBottom: `1px solid ${ctaBorder}`, transition: 'background 0.35s ease' }}>
        <h2 className="title" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 800, marginBottom: '1rem', color: textPrimary, textShadow: dark ? '0 0 30px rgba(129,140,248,0.25)' : 'none' }}>
          Ready to Get Started?
        </h2>
        <p style={{ color: textSecondary, fontSize: '1.1rem', marginBottom: '2rem' }}>Create a free account and upload your first EEG file today.</p>
        <button className="btn-primary" onClick={() => navigate('/login')} style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: 16 }}>
          Get Started <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </button>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ padding: '48px 5% 36px', borderTop: `1px solid ${footerBorder}`, background: footerBg, transition: 'background 0.35s ease' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={18} color="white" />
            </div>
            <span className="title" style={{ fontWeight: 700, fontSize: '1.1rem', color: textPrimary }}>EpiChat</span>
          </div>

          <div style={{ background: dark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: textSecondary, fontSize: '0.83rem', lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: '#f59e0b' }}>Medical Disclaimer:</strong> EpiChat is an AI-assisted educational tool and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified neurologist. In an emergency, call your local services immediately.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ color: textSecondary, fontSize: '0.82rem', margin: 0 }}>© 2026 EpiChat · AI-Powered Epilepsy Management Platform</p>
            <a href="mailto:support@epichat.ai" style={{ color: textSecondary, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
              <Mail size={14} /> support@epichat.ai
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(10px); }
        }
      `}</style>
    </div>
  );
}
