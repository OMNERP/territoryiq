'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchInput, FilterChips, EmptyState } from '@/components/ui/index';
import { productApi } from '@/services/api';
import { Product } from '@/types';
import { cn } from '@/lib/utils';
import { ProductPerformanceChart } from '@/components/charts/index';

const CAT_FILTERS = [
  { value: 'all',          label: 'All' },
  { value: 'Cardiology',   label: '❤️ Cardiology' },
  { value: 'Neurology',    label: '🧠 Neurology' },
  { value: 'Diabetology',  label: '💉 Diabetology' },
  { value: 'Orthopedics',  label: '🦴 Orthopedics' },
  { value: 'Immunology',   label: '🛡 Immunology' },
  { value: 'Gastro',       label: '🫁 Gastro' },
  { value: 'Pulmonology',  label: '🌬 Pulmonology' },
];

const CAT_CLASS: Record<string, string> = {
  Cardiology:  'tag-red',
  Neurology:   'tag-purple',
  Diabetology: 'tag-green',
  Orthopedics: 'tag-cyan',
  Immunology:  'tag-blue',
  Gastro:      'tag-amber',
  Pulmonology: 'tag-gray',
};

const DEMO_PRODUCTS: Product[] = [
  { id:'1', name:'Cardivex 10mg',  category:'Cardiology',  description:'ACE inhibitor for hypertension and heart failure management', sku:'CARD-001', isActive:true },
  { id:'2', name:'NeuroCal 500mg', category:'Neurology',   description:'Calcium channel modulator for neuropathic pain', sku:'NEUR-001', isActive:true },
  { id:'3', name:'GlucoMax 850mg', category:'Diabetology', description:'Metformin-based glucose management for Type 2 DM', sku:'GLUC-001', isActive:true },
  { id:'4', name:'BoneGuard Plus', category:'Orthopedics', description:'Calcium + Vitamin D3 combination for bone health', sku:'BONE-001', isActive:true },
  { id:'5', name:'ImmunoPlus',     category:'Immunology',  description:'Broad-spectrum immune support with zinc and vitamin C', sku:'IMMU-001', isActive:true },
  { id:'6', name:'HepaShield 300', category:'Gastro',      description:'Silymarin-based hepatoprotective for liver disorders', sku:'HEPA-001', isActive:true },
  { id:'7', name:'RespiClear',     category:'Pulmonology', description:'Bronchodilator combination for COPD and asthma', sku:'RESP-001', isActive:true },
];

const PROMO_STATS: Record<string, { visits: number; mrs: number; trend: string }> = {
  'Cardivex 10mg':  { visits: 1840, mrs: 12, trend: '+12%' },
  'NeuroCal 500mg': { visits: 1420, mrs: 9,  trend: '+5%'  },
  'GlucoMax 850mg': { visits: 1680, mrs: 11, trend: '+18%' },
  'BoneGuard Plus': { visits: 980,  mrs: 7,  trend: '-3%'  },
  'ImmunoPlus':     { visits: 1320, mrs: 10, trend: '+8%'  },
  'HepaShield 300': { visits: 760,  mrs: 6,  trend: '+2%'  },
  'RespiClear':     { visits: 640,  mrs: 5,  trend: '+15%' },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('all');

  useEffect(() => {
    productApi.list()
      .then(({ data }) => { if (data.products?.length) setProducts(data.products); })
      .catch(() => {});
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Product Promotion Tracker"
        subtitle="Detailing frequency, sample distribution, and prescription potential"
        actions={<button className="btn-primary">+ Add Product</button>}
      />

      {/* Promotion chart */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="font-display font-semibold text-sm">Promotion Hit Frequency — This Month</h3>
        </div>
        <div className="p-4">
          <ProductPerformanceChart />
        </div>
      </div>

      {/* Product cards */}
      <div className="card">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 flex-wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="w-56" />
          <FilterChips options={CAT_FILTERS} value={catFilter} onChange={setCat} />
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.map(p => {
            const stats = PROMO_STATS[p.name] || { visits: 0, mrs: 0, trend: '—' };
            const trendUp = stats.trend.startsWith('+');
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">
                  💊
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <span className={cn('tag', CAT_CLASS[p.category || ''] || 'tag-gray')}>{p.category}</span>
                    <span className="tag tag-gray text-[10px]">{p.sku}</span>
                  </div>
                  <p className="text-xs text-text-3 truncate">{p.description}</p>
                </div>
                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="text-center">
                    <p className="font-display font-bold text-base">{stats.visits.toLocaleString()}</p>
                    <p className="text-[11px] text-text-3">Promotions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-base">{stats.mrs}</p>
                    <p className="text-[11px] text-text-3">MRs Active</p>
                  </div>
                  <div className="text-center">
                    <p className={cn('font-bold text-sm', trendUp ? 'text-success' : 'text-danger')}>
                      {stats.trend}
                    </p>
                    <p className="text-[11px] text-text-3">vs last month</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" title="Active" />
                </div>
              </div>
            );
          })}
          {!filtered.length && <EmptyState title="No products found" />}
        </div>
      </div>
    </div>
  );
}
