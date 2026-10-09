'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../components/Icon';
import { SKILL_LEVEL_OPTIONS } from '../../lib/employeeOptions';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type CatalogSkill = { id: string; name: string };

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  BEGINNER: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300' },
  BASIC: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300' },
  INTERMEDIATE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  ADVANCED: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300' },
  EXPERT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
};

export default function EmployeeSkillsPage() {
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [initialSelected, setInitialSelected] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('skilho_token');
    if (!token) {
      router.replace('/login/employee');
      return;
    }
    let cancelled = false;

    fetch(`${API}/employee/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('skilho_token');
          router.replace('/login/employee');
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          throw new Error(`Could not load skills (error ${res.status}).`);
        }
        return res.json();
      })
      .then((data: { catalog: CatalogSkill[]; mine: { skillId: string; level: string }[] }) => {
        if (cancelled) return;
        setCatalog(data.catalog || []);
        const map: Record<string, string> = {};
        (data.mine || []).forEach((m) => {
          map[m.skillId] = m.level;
        });
        setSelected(map);
        setInitialSelected(map);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled || err.message === 'Unauthorized') return;
        setLoadError(
          err instanceof TypeError
            ? 'Cannot reach the backend server. Is it running on port 3000?'
            : err.message,
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function toggle(skillId: string) {
    setMessage('');
    setError('');
    setSelected((prev) => {
      const next = { ...prev };
      if (next[skillId]) {
        delete next[skillId];
      } else {
        next[skillId] = 'INTERMEDIATE';
      }
      return next;
    });
  }

  function setLevel(skillId: string, level: string) {
    setMessage('');
    setError('');
    setSelected((prev) => ({ ...prev, [skillId]: level }));
  }

  const selectedCount = Object.keys(selected).length;

  const hasChanges = useMemo(() => {
    const currentKeys = Object.keys(selected);
    const initialKeys = Object.keys(initialSelected);
    if (currentKeys.length !== initialKeys.length) return true;
    return currentKeys.some((k) => selected[k] !== initialSelected[k]);
  }, [selected, initialSelected]);

  const filteredSkills = useMemo(() => {
    return catalog.filter((skill) => {
      const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (activeTab === 'selected') {
        return !!selected[skill.id];
      }
      return true;
    });
  }, [catalog, search, activeTab, selected]);

  async function save() {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const token = localStorage.getItem('skilho_token');
      const skills = Object.entries(selected).map(([skillId, level]) => ({
        skillId,
        level,
      }));
      const res = await fetch(`${API}/employee/skills`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'Could not save skills');
      }

      setInitialSelected({ ...selected });
      setMessage(`Successfully saved ${data.saved ?? skills.length} skills to your profile.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save skills');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
        <span className="text-sm font-medium">Loading skills catalog...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            !
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Could Not Load Skills</h3>
          <p className="text-sm text-slate-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/employee"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition mb-2"
          >
            <span>← Back to Overview</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Technical Skills & Specialties
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select the tools, machinery, and equipment you specialize in and specify your proficiency level.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
            <Icon name="tool" className="w-4 h-4" />
            <span>{selectedCount} Selected</span>
          </span>
          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between"
          >
            <span>✓ {message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">
              ×
            </button>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center justify-between"
          >
            <span>! {error}</span>
            <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 font-bold ml-2">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <Icon name="search" className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search skills (e.g., HVAC, Wiring, Diagnostics, Welding)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Skills ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('selected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'selected'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Selected ({selectedCount})
          </button>
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3">
            <Icon name="search" className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching skills found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {activeTab === 'selected'
              ? 'You have not selected any skills yet. Switch to "All Skills" to add skills.'
              : `No skills match "${search}". Try searching for another keyword.`}
          </p>
          {activeTab === 'selected' ? (
            <button
              onClick={() => setActiveTab('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
            >
              Browse All Skills
            </button>
          ) : (
            <button
              onClick={() => setSearch('')}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
            >
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSkills.map((skill) => {
            const level = selected[skill.id];
            const isChecked = !!level;
            const levelColor = level ? LEVEL_COLORS[level] || LEVEL_COLORS.BEGINNER : null;

            return (
              <div
                key={skill.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all duration-200 ${
                  isChecked
                    ? 'bg-white border-blue-400 ring-2 ring-blue-500/10 shadow-sm'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(skill.id)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <span className={`text-sm font-bold ${isChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                      {skill.name}
                    </span>
                    {isChecked && (
                      <span className="block text-[11px] text-slate-500 font-medium">Selected for profile</span>
                    )}
                  </div>
                </label>

                {isChecked && (
                  <div className="flex items-center gap-2 pl-7 sm:pl-0">
                    <select
                      value={level || 'INTERMEDIATE'}
                      onChange={(e) => setLevel(skill.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${levelColor?.border} ${levelColor?.bg} ${levelColor?.text} focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition`}
                    >
                      {SKILL_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Save Floating Bar when changes are made */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 inset-x-0 z-30 max-w-lg mx-auto px-4"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold">Unsaved Skill Changes</p>
              <p className="text-[11px] text-slate-400">{selectedCount} total skills selected</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected({ ...initialSelected })}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Reset
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}