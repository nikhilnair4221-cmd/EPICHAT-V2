import React from 'react';

const EXAMPLE_DOCTORS = [
  { name: 'Dr. Sudhir Kumar', specialization: 'Neurologist', hospital: 'Indraprastha Apollo Hospitals', city: 'New Delhi' },
  { name: 'Dr. Chandrashekhar Meshram', specialization: 'Neurologist', hospital: 'Neurology (Example Provider)', city: 'Nagpur' },
  { name: 'Dr. Vikram Huded', specialization: 'Neurology', hospital: 'Narayana Health City', city: 'Bengaluru' },
  { name: 'Dr. Lakshminarayana Bhatt', specialization: 'Consultant Neurologist', hospital: 'Manipal Hospitals', city: 'Bengaluru' },
  { name: 'Dr. Rupam Borgohain', specialization: 'Senior Neurologist', hospital: "Nizam's Institute of Medical Sciences (NIMS)", city: 'Hyderabad' },
  { name: 'Dr. Sita Jayalakshmi', specialization: 'Epileptology', hospital: 'KIMS Hospitals', city: 'Hyderabad' },
  { name: 'Dr. Subhash Kaul', specialization: 'Neurology', hospital: "Nizam's Institute of Medical Sciences (NIMS)", city: 'Hyderabad' },
];

export default function DoctorProfiles() {
  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
        <h2 className="title neon-text" style={{ margin: 0, fontSize: '1.2rem' }}>Example Neurology Team</h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Display-only (not verified)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 }}>
        {EXAMPLE_DOCTORS.map((d) => (
          <div key={d.name} className="glass-panel" style={{ padding: 14, border: '1px solid rgba(0,255,255,0.12)' }}>
            <div className="neon-text" style={{ fontWeight: 700 }}>{d.name}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 6 }}>{d.specialization}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{d.hospital}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{d.city}</div>
            <button className="btn-secondary" style={{ marginTop: 12, width: '100%' }} type="button">
              View Patient Reports
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

