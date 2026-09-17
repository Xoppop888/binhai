import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Неверный email или пароль');
      return;
    }
    navigate('/admin');
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Supabase не настроен</h1>
          <p className="text-slate-600 text-sm">
            Добавьте <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> и{' '}
            <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> в файл{' '}
            <code className="bg-slate-100 px-1 rounded">.env</code>, см. SUPABASE_SETUP.md.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Вход в админ-панель</h1>
        <p className="text-sm text-slate-500 mb-6">BINHAI AUTO</p>

        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="admin@binhai.auto"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Входим...' : 'Войти'}
        </button>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Пользователей для входа добавляйте вручную в Supabase Dashboard →
          Authentication → Users
        </p>
      </form>
    </div>
  );
}
