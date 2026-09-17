import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface CarRow {
  id: string;
  slug: string;
  brand: string;
  brand_zh: string;
  model: string;
  year: number;
  trim: string;
  price_cny: number;
  category: string | null;
  image_url: string;
  source_url: string;
  mileage_km: number | null;
}

const EMPTY_NEW: Omit<CarRow, 'id'> = {
  slug: '',
  brand: '',
  brand_zh: '',
  model: '',
  year: new Date().getFullYear(),
  trim: '',
  price_cny: 0,
  category: 'used',
  image_url: '',
  source_url: '',
  mileage_km: null,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [rows, setRows] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCar, setNewCar] = useState(EMPTY_NEW);

  // --- Auth guard ---
  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/admin/login');
      } else {
        setUserEmail(data.session.user.email ?? null);
      }
      setCheckingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadRows = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('cars')
      .select('id, slug, brand, brand_zh, model, year, trim, price_cny, category, image_url, source_url, mileage_km')
      .order('created_at', { ascending: false });
    if (!error && data) setRows(data as CarRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!checkingAuth && userEmail) loadRows();
  }, [checkingAuth, userEmail, loadRows]);

  async function handleLogout() {
    await supabase?.auth.signOut();
    navigate('/admin/login');
  }

  function updateField<K extends keyof CarRow>(id: string, field: K, value: CarRow[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSave(row: CarRow) {
    if (!supabase) return;
    setSavingId(row.id);
    setMessage('');
    const { error } = await supabase
      .from('cars')
      .update({
        brand: row.brand,
        brand_zh: row.brand_zh,
        model: row.model,
        year: row.year,
        trim: row.trim,
        price_cny: row.price_cny,
        category: row.category,
        image_url: row.image_url,
        mileage_km: row.mileage_km,
      })
      .eq('id', row.id);
    setSavingId(null);
    setMessage(error ? `Ошибка сохранения: ${error.message}` : `Сохранено: ${row.brand} ${row.model}`);
  }

  async function handleDelete(row: CarRow) {
    if (!supabase) return;
    if (!confirm(`Удалить ${row.brand} ${row.model}?`)) return;
    const { error } = await supabase.from('cars').delete().eq('id', row.id);
    if (error) {
      setMessage(`Ошибка удаления: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setMessage(`Удалено: ${row.brand} ${row.model}`);
  }

  async function handleCreate() {
    if (!supabase) return;
    if (!newCar.brand || !newCar.model || !newCar.slug) {
      setMessage('Заполните минимум slug, бренд и модель');
      return;
    }
    const { error } = await supabase.from('cars').insert([newCar]);
    if (error) {
      setMessage(`Ошибка добавления: ${error.message}`);
      return;
    }
    setNewCar(EMPTY_NEW);
    setShowNewForm(false);
    setMessage('Автомобиль добавлен');
    loadRows();
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.brand.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) ||
      (r.slug || '').toLowerCase().includes(q)
    );
  });

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <p className="text-slate-600">
          Supabase не настроен. Добавьте VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY в .env
        </p>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Проверка доступа...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Админ-панель BINHAI AUTO</h1>
            <p className="text-xs text-slate-500">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Поиск по бренду/модели..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64"
          />
          <span className="text-sm text-slate-500">Всего: {rows.length}</span>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="ml-auto bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showNewForm ? 'Отмена' : '+ Добавить авто'}
          </button>
          <button
            onClick={loadRows}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-100"
          >
            Обновить
          </button>
        </div>

        {message && (
          <div className="mb-4 text-sm bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-4 py-2">
            {message}
          </div>
        )}

        {showNewForm && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="slug (уникальный)" value={newCar.slug} onChange={(e) => setNewCar({ ...newCar, slug: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Бренд" value={newCar.brand} onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Бренд (кит.)" value={newCar.brand_zh} onChange={(e) => setNewCar({ ...newCar, brand_zh: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Модель" value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Год" type="number" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: Number(e.target.value) })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Комплектация" value={newCar.trim} onChange={(e) => setNewCar({ ...newCar, trim: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <input placeholder="Цена, CNY" type="number" value={newCar.price_cny} onChange={(e) => setNewCar({ ...newCar, price_cny: Number(e.target.value) })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            <select value={newCar.category ?? 'used'} onChange={(e) => setNewCar({ ...newCar, category: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm">
              <option value="used">Подержанный</option>
              <option value="new">Новый</option>
            </select>
            <input placeholder="URL фото" value={newCar.image_url} onChange={(e) => setNewCar({ ...newCar, image_url: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm col-span-2" />
            <input placeholder="Ссылка на источник" value={newCar.source_url} onChange={(e) => setNewCar({ ...newCar, source_url: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm col-span-2" />
            <button onClick={handleCreate} className="col-span-full bg-green-600 text-white text-sm rounded-lg py-2 hover:bg-green-700">
              Сохранить новый автомобиль
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Загрузка...</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-500">
                  <th className="p-3">Фото</th>
                  <th className="p-3">Бренд</th>
                  <th className="p-3">Модель</th>
                  <th className="p-3">Год</th>
                  <th className="p-3">Комплектация</th>
                  <th className="p-3">Цена, ¥</th>
                  <th className="p-3">Пробег, км</th>
                  <th className="p-3">Категория</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 align-middle">
                    <td className="p-2">
                      {row.image_url && (
                        <img src={row.image_url} alt="" className="w-14 h-10 object-cover rounded" />
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        value={row.brand}
                        onChange={(e) => updateField(row.id, 'brand', e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 w-28"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.model}
                        onChange={(e) => updateField(row.id, 'model', e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 w-32"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.year}
                        onChange={(e) => updateField(row.id, 'year', Number(e.target.value))}
                        className="border border-slate-200 rounded px-2 py-1 w-20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.trim || ''}
                        onChange={(e) => updateField(row.id, 'trim', e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1 w-40"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.price_cny}
                        onChange={(e) => updateField(row.id, 'price_cny', Number(e.target.value))}
                        className="border border-slate-200 rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.mileage_km ?? ''}
                        onChange={(e) => updateField(row.id, 'mileage_km', e.target.value ? Number(e.target.value) : null)}
                        className="border border-slate-200 rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={row.category ?? 'used'}
                        onChange={(e) => updateField(row.id, 'category', e.target.value)}
                        className="border border-slate-200 rounded px-2 py-1"
                      >
                        <option value="used">Подержанный</option>
                        <option value="new">Новый</option>
                      </select>
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      <button
                        onClick={() => handleSave(row)}
                        disabled={savingId === row.id}
                        className="text-xs bg-blue-600 text-white rounded px-2 py-1 mr-1 hover:bg-blue-700 disabled:opacity-60"
                      >
                        {savingId === row.id ? '...' : 'Сохранить'}
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="text-xs border border-red-300 text-red-600 rounded px-2 py-1 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-slate-500 py-8">Ничего не найдено</p>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-6">
          Массовая загрузка/обновление автомобилей с сайта-источника выполняется
          отдельным скриптом <code>scripts/parse-to-supabase.js</code> (см. README.md) —
          здесь можно точечно поправить или удалить отдельные карточки.
        </p>
      </main>
    </div>
  );
}
