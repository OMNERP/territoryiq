'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email,    setEmail]    = useState('admin@territoryiq.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-2/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-2 rounded-xl flex items-center justify-center text-xl">
            🗺
          </div>
          <div className="font-display text-2xl font-bold">
            Territory<span className="text-accent">IQ</span>
          </div>
        </div>

        <div className="card p-8 animate-fade-in">
          <h1 className="font-display text-xl font-bold mb-1">Sign in</h1>
          <p className="text-text-3 text-sm mb-6">Medical Sales Force Intelligence Platform</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-3 uppercase tracking-wider mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-3 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-bg-3 rounded-[10px] border border-white/[0.04]">
            <p className="text-xs font-medium text-text-3 mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1.5 text-xs text-text-2">
              <div className="flex justify-between">
                <span className="text-text-3">Admin:</span>
                <span>admin@territoryiq.com / Admin@123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">Manager:</span>
                <span>manager.north@territoryiq.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-3">MR:</span>
                <span>mr.rajesh@territoryiq.com / MR@12345</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-text-3 text-xs mt-6">
          TerritoryIQ v1.0 · Healthcare Sales Intelligence
        </p>
      </div>
    </div>
  );
}
