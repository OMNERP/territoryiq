'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput, FilterChips, Avatar, EmptyState } from '@/components/ui/index';
import { customerApi } from '@/services/api';
import { Customer } from '@/types';
import { cn, fmt, fmtCurrency } from '@/lib/utils';

const TYPE_FILTERS = [
  { value: 'all',                 label: 'All' },
  { value: 'pharmacy',            label: '💊 Pharmacy' },
  { value: 'clinic',              label: '🏥 Clinic' },
  { value: 'hospital',            label: '🏨 Hospital' },
  { value: 'healthcare_retailer', label: '🛒 Retailer' },
];

const TYPE_CLASS: Record<string, string> = {
  pharmacy:            'tag-blue',
  clinic:              'tag-purple',
  hospital:            'tag-cyan',
  healthcare_retailer: 'tag-amber',
};

const TYPE_ICON: Record<string, string> = {
  pharmacy:            '💊',
  clinic:              '🏥',
  hospital:            '🏨',
  healthcare_retailer: '🛒',
};

const DEMO: Customer[] = [
  { id:'1', name:'MedPlus Pharmacy Bandra',      customerType:'pharmacy',            city:'Mumbai',    contactPerson:'Ramesh Gupta', phone:'9800201001', visitFrequencyDays:7,  monthlyBusinessPotential:85000, lastVisitDate:'2026-05-17', mrName:'Rajesh Kumar',  isActive:true },
  { id:'2', name:'Apollo Pharmacy Andheri',      customerType:'pharmacy',            city:'Mumbai',    contactPerson:'Sita Rao',     phone:'9800202002', visitFrequencyDays:7,  monthlyBusinessPotential:92000, lastVisitDate:'2026-05-18', mrName:'Rajesh Kumar',  isActive:true },
  { id:'3', name:'Koramangala Clinic',           customerType:'clinic',              city:'Bangalore', contactPerson:'Dr. Priya',    phone:'9800203003', visitFrequencyDays:14, monthlyBusinessPotential:65000, lastVisitDate:'2026-05-16', mrName:'Sunita Gupta',  isActive:true },
  { id:'4', name:'Fortis Hospital Pharmacy',     customerType:'hospital',            city:'Bangalore', contactPerson:'Raj Sharma',   phone:'9800204004', visitFrequencyDays:14, monthlyBusinessPotential:180000,lastVisitDate:'2026-05-15', mrName:'Sunita Gupta',  isActive:true },
  { id:'5', name:'AIIMS Trauma Pharmacy',        customerType:'hospital',            city:'Delhi',     contactPerson:'Meena Lal',    phone:'9800206006', visitFrequencyDays:14, monthlyBusinessPotential:250000,lastVisitDate:'2026-05-14', mrName:'Arjun Mehta',   isActive:true },
  { id:'6', name:'LifeCare Pharmacy Pune',       customerType:'pharmacy',            city:'Pune',      contactPerson:'Abhay Joshi',  phone:'9800207007', visitFrequencyDays:7,  monthlyBusinessPotential:68000, lastVisitDate:'2026-05-18', mrName:'Priya Sharma',  isActive:true },
  { id:'7', name:'Global Health Clinic Chennai', customerType:'clinic',              city:'Chennai',   contactPerson:'Saranya M',    phone:'9800208008', visitFrequencyDays:14, monthlyBusinessPotential:55000, lastVisitDate:'2026-05-12', mrName:'Vikram Nair',   isActive:true },
  { id:'8', name:'Sun Pharma Retailer Hyd',      customerType:'healthcare_retailer', city:'Hyderabad', contactPerson:'Kiran Reddy',  phone:'9800209009', visitFrequencyDays:10, monthlyBusinessPotential:45000, lastVisitDate:'2026-05-16', mrName:'Kavita Rao',    isActive:true },
  { id:'9', name:'Wellness Forever Mumbai',      customerType:'pharmacy',            city:'Mumbai',    contactPerson:'Farida Khan',  phone:'9800210010', visitFrequencyDays:7,  monthlyBusinessPotential:78000, lastVisitDate:'2026-05-17', mrName:'Rajesh Kumar',  isActive:true },
  { id:'10',name:'Netmeds Delhi Connaught',      customerType:'pharmacy',            city:'Delhi',     contactPerson:'Vikrant Singh',phone:'9800205005', visitFrequencyDays:7,  monthlyBusinessPotential:74000, lastVisitDate:'2026-05-15', mrName:'Arjun Mehta',   isActive:true },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(DEMO);
  const [search, setSearch]       = useState('');
  const [typeFilter, setType]     = useState('all');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    customerApi.list({ limit: 50 })
      .then(({ data }) => { if (data.customers?.length) setCustomers(data.customers); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch = (c?.name || '').toLowerCase().includes(s) || (c?.city || '').toLowerCase().includes(s);
    const matchType   = typeFilter === 'all' || c.customerType === typeFilter;
    return matchSearch && matchType;
  });

  const totalPotential = customers.reduce((s, c) => s + (c.monthlyBusinessPotential || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customer Management"
        subtitle="Pharmacies, clinics, hospitals, and retailers"
        actions={<button className="btn-primary">+ Add Customer</button>}
      />

      {/* Type summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { type: 'all',                 label: 'Total',    icon: '📦' },
          { type: 'pharmacy',            label: 'Pharmacy', icon: '💊' },
          { type: 'clinic',              label: 'Clinics',  icon: '🏥' },
          { type: 'hospital',            label: 'Hospitals',icon: '🏨' },
          { type: 'healthcare_retailer', label: 'Retailers',icon: '🛒' },
        ].map((t) => {
          const count = t.type === 'all' ? customers.length : customers.filter(c => c.customerType === t.type).length;
          return (
            <div key={t.type} className="card p-3 text-center cursor-pointer hover:border-accent/30 transition-colors" onClick={() => setType(t.type)}>
              <p className="text-xl mb-1">{t.icon}</p>
              <p className="font-display text-lg font-bold">{count}</p>
              <p className="text-[11px] text-text-3">{t.label}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly potential banner */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-success/15 rounded-lg flex items-center justify-center text-xl flex-shrink-0">💰</div>
        <div>
          <p className="text-sm text-text-3">Total Monthly Business Potential</p>
          <p className="font-display text-2xl font-bold text-success">{fmtCurrency(totalPotential)}</p>
        </div>
        <div className="ml-auto text-xs text-text-3">Across {customers.length} active customers</div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or city..." className="w-64" />
          <FilterChips options={TYPE_FILTERS} value={typeFilter} onChange={setType} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Customer', 'Type', 'City', 'Contact', 'Visit Freq', 'Monthly Potential', 'Last Visit', 'MR', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.8px] text-text-3 px-4 py-3 border-b border-white/[0.06]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{TYPE_ICON[c.customerType] || '📦'}</span>
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('tag', TYPE_CLASS[c.customerType] || 'tag-gray')}>
                      {(c.customerType || '').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">{c.city || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{c.contactPerson || '—'}</p>
                    <p className="text-xs text-text-3">{c.phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">Every {c.visitFrequencyDays || c.visit_frequency_days}d</td>
                  <td className="px-4 py-3 text-sm font-medium text-success">
                    {fmtCurrency(c.monthlyBusinessPotential || c.monthly_business_potential || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-3">
                    {c.lastVisitDate ? fmt(c.lastVisitDate || c.last_visit_date) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-2">{c.mrName || c.mr_name || '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-accent text-xs hover:underline">View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState title="No customers found" />}
        </div>
      </div>
    </div>
  );
}
