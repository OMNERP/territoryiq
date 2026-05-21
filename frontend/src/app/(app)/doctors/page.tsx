'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput, FilterChips, Badge, Avatar, EmptyState } from '@/components/ui/index';
import { doctorApi } from '@/services/api';
import { Doctor } from '@/types';
import { cn, fmt, coverageColor } from '@/lib/utils';

const SPECIALTIES = [
  { value: 'all',           label: 'All' },
  { value: 'Cardiologist',  label: '❤️ Cardiology' },
  { value: 'Neurologist',   label: '🧠 Neurology' },
  { value: 'Diabetologist', label: '💉 Diabetology' },
  { value: 'Orthopedic',    label: '🦴 Orthopedic' },
  { value: 'General Physician', label: '🩺 GP / FP' },
];

const PRIORITY_FILTERS = [
  { value: 'all', label: 'All Priority' },
  { value: 'high', label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

const PRIORITY_CLASS: Record<string, string> = {
  high: 'tag-red', medium: 'tag-amber', low: 'tag-green',
};
const SPEC_CLASS: Record<string, string> = {
  'Cardiologist': 'tag-red',
  'Neurologist':  'tag-purple',
  'Diabetologist':'tag-green',
  'Orthopedic':   'tag-cyan',
  'General Physician': 'tag-amber',
};

const DEMO_DOCTORS: Doctor[] = [
  { id:'1', name:'Dr. Manoj Kapoor',   specialty:'Cardiologist',     qualification:'MBBS, MD',  clinicHospital:'Lilavati Hospital',     city:'Mumbai',    priority:'high',   potentialScore:9.2, lastVisitDate:'2026-05-16', mrName:'Rajesh Kumar',  visitFrequencyDays:14, isActive:true },
  { id:'2', name:'Dr. Sunita Reddy',   specialty:'Neurologist',      qualification:'MD, DM',    clinicHospital:'Fortis Hospital',        city:'Bangalore', priority:'medium', potentialScore:7.8, lastVisitDate:'2026-05-18', mrName:'Sunita Gupta',  visitFrequencyDays:21, isActive:true },
  { id:'3', name:'Dr. Prashant Vyas',  specialty:'Diabetologist',    qualification:'MBBS, DNB', clinicHospital:'Apollo Clinic',          city:'Delhi',     priority:'high',   potentialScore:8.9, lastVisitDate:'2026-05-13', mrName:'Arjun Mehta',   visitFrequencyDays:14, isActive:true },
  { id:'4', name:'Dr. Kavya Rao',      specialty:'Orthopedic',       qualification:'MS, MCh',   clinicHospital:'Rainbow Hospital',       city:'Hyderabad', priority:'low',    potentialScore:6.4, lastVisitDate:'2026-05-17', mrName:'Kavita Rao',    visitFrequencyDays:30, isActive:true },
  { id:'5', name:'Dr. Ravi Menon',     specialty:'General Physician',qualification:'MBBS',      clinicHospital:'Primary Care Clinic',    city:'Chennai',   priority:'medium', potentialScore:5.1, lastVisitDate:'2026-05-11', mrName:'Vikram Nair',   visitFrequencyDays:21, isActive:true },
  { id:'6', name:'Dr. Anita Patel',    specialty:'Cardiologist',     qualification:'MBBS, MD',  clinicHospital:'Sterling Hospital',      city:'Ahmedabad', priority:'high',   potentialScore:8.7, lastVisitDate:'2026-05-15', mrName:'Rajesh Kumar',  visitFrequencyDays:14, isActive:true },
  { id:'7', name:'Dr. Suresh Nambiar', specialty:'Neurologist',      qualification:'MBBS, MD',  clinicHospital:'Medicover Hospital',     city:'Hyderabad', priority:'medium', potentialScore:7.3, lastVisitDate:'2026-05-14', mrName:'Kavita Rao',    visitFrequencyDays:21, isActive:true },
  { id:'8', name:'Dr. Meena Krishnan', specialty:'Diabetologist',    qualification:'MD',        clinicHospital:'Manipal Hospital',       city:'Bangalore', priority:'medium', potentialScore:6.8, lastVisitDate:'2026-05-17', mrName:'Sunita Gupta',  visitFrequencyDays:21, isActive:true },
];

function PotentialBar({ score }: { score: number }) {
  const color = score >= 8 ? '#34c97e' : score >= 6 ? '#f5a623' : '#f05b5b';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-bg-4 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score * 10}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{Number(score || 0).toFixed(1)}</span>
    </div>
  );
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(DEMO_DOCTORS);
  const [search, setSearch]   = useState('');
  const [specialty, setSpec]  = useState('all');
  const [priority, setPriority] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    doctorApi.list({ limit: 50 })
      .then(({ data }) => { if (data.doctors?.length) setDoctors(data.doctors); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors.filter((d) => {
    const s = search.toLowerCase();
    const matchSearch = (d?.name || '').toLowerCase().includes(s) || (d?.city || '').toLowerCase().includes(s) || (d?.clinicHospital || '').toLowerCase().includes(s);
    const matchSpec = specialty === 'all' || d.specialty === specialty;
    const matchPriority = priority === 'all' || d.priority === priority;
    return matchSearch && matchSpec && matchPriority;
  });

  const high   = doctors.filter(d => d.priority === 'high').length;
  const medium = doctors.filter(d => d.priority === 'medium').length;
  const low    = doctors.filter(d => d.priority === 'low').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Doctor CRM"
        subtitle="Relationship management and prescription potential tracking"
        actions={<button className="btn-primary">+ Add Doctor</button>}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Doctors', value: doctors.length, color: 'text-accent' },
          { label: 'High Priority', value: high,           color: 'text-danger' },
          { label: 'Medium',        value: medium,         color: 'text-warning' },
          { label: 'Low',           value: low,            color: 'text-success' },
          { label: 'Visited 30d',   value: doctors.filter(d => d.lastVisitDate).length, color: 'text-info' },
          { label: 'Overdue',       value: 7,              color: 'text-danger' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <p className={cn('font-display text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-[11px] text-text-3 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search doctor, clinic, city..." className="w-64" />
          </div>
          <div className="flex gap-4 flex-wrap">
            <FilterChips options={SPECIALTIES}      value={specialty} onChange={setSpec}     />
            <div className="w-px bg-white/[0.06]" />
            <FilterChips options={PRIORITY_FILTERS} value={priority}  onChange={setPriority} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Doctor', 'Specialty', 'Location', 'Priority', 'Last Visit', 'Potential', 'MR Assigned', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={d.name} id={d.id} size="sm" />
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-[11px] text-text-3">{d.qualification || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', SPEC_CLASS[d.specialty] || 'tag-gray')}>{d.specialty}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">
                    <p>{d.clinicHospital || '—'}</p>
                    <p className="text-text-3 text-xs">{d.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', PRIORITY_CLASS[d.priority])}>{d.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-3">{d.lastVisitDate ? fmt(d.lastVisitDate) : 'Never'}</td>
                  <td className="px-4 py-3"><PotentialBar score={d.potentialScore || d.potential_score || 0} /></td>
                  <td className="px-4 py-3 text-sm text-text-2">{d.mrName || d.mr_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-accent text-xs hover:underline">View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState title="No doctors found" desc="Try adjusting filters" />}
        </div>
      </div>
    </div>
  );
}
