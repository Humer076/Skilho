'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import AdminShell from '../components/AdminShell';
import { adminFetch } from '../components/adminApi';

type Article = {
  id: string; title: string; slug: string; excerpt: string | null; content: string;
  category: string; tags: string[]; status: string; featuredImage: string | null;
  isFeatured: boolean; publishedAt: string | null; scheduledAt: string | null;
  createdAt: string; updatedAt: string; author?: { email: string | null };
  seoTitle?: string | null; metaDescription?: string | null; seoKeywords?: string[];
  canonicalUrl?: string | null; ogTitle?: string | null; ogDescription?: string | null; ogImage?: string | null;
};
type PageData = { items: Article[]; total: number; page: number; totalPages: number; categories: { category: string }[] };
type Draft = {
  id?: string; title: string; slug: string; excerpt: string; content: string; category: string;
  tags: string[]; featuredImage: string; isFeatured: boolean; status: string; scheduledAt: string;
  seoTitle: string; metaDescription: string; seoKeywords: string[]; canonicalUrl: string;
  ogTitle: string; ogDescription: string; ogImage: string;
};

const CATEGORIES = ['Career', 'Skills', 'Hiring', 'Industry'];
const EMPTY: Draft = {
  title: '', slug: '', excerpt: '', content: '', category: '', tags: [], featuredImage: '',
  isFeatured: false, status: 'DRAFT', scheduledAt: '', seoTitle: '', metaDescription: '',
  seoKeywords: [], canonicalUrl: '', ogTitle: '', ogDescription: '', ogImage: '',
};
const inputClass = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const cardClass = 'overflow-hidden rounded-xl border border-slate-800 bg-slate-900';
const labelClass = 'mb-1.5 block text-xs font-semibold text-slate-300';
const toolbarButtons = [
  { label: 'B', command: 'bold', title: 'Bold' }, { label: 'I', command: 'italic', title: 'Italic' },
  { label: 'U', command: 'underline', title: 'Underline' }, { label: '• List', command: 'insertUnorderedList', title: 'Bulleted list' },
  { label: '1. List', command: 'insertOrderedList', title: 'Numbered list' },
  { label: '— Divider', command: 'insertHorizontalRule', title: 'Divider' },
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function asDraft(article?: Article): Draft {
  if (!article) return { ...EMPTY };
  return {
    id: article.id, title: article.title, slug: article.slug, excerpt: article.excerpt || '',
    content: article.content || '', category: article.category, tags: article.tags || [],
    featuredImage: article.featuredImage || '', isFeatured: article.isFeatured,
    status: article.status, scheduledAt: article.scheduledAt ? article.scheduledAt.slice(0, 16) : '',
    seoTitle: article.seoTitle || '', metaDescription: article.metaDescription || '',
    seoKeywords: article.seoKeywords || [], canonicalUrl: article.canonicalUrl || '',
    ogTitle: article.ogTitle || '', ogDescription: article.ogDescription || '', ogImage: article.ogImage || '',
  };
}

export default function WebsiteContentPage() {
  const [items, setItems] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft || !editorRef.current) return;
    editorRef.current.innerHTML = draft.content;
  }, [draft?.id, previewOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const [sortBy, sortOrder] = sort.split(':');
    const params = new URLSearchParams({ page: String(page), sortBy, sortOrder });
    if (query) params.set('q', query);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    adminFetch<PageData>(`/admin/manage/articles?${params}`)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setPages(data.totalPages);
        setCategories(Array.from(new Set([...CATEGORIES, ...data.categories.map((row) => row.category)])));
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query, status, category, sort, page, refresh]);

  function openNew() {
    setSlugEdited(false);
    setTagInput(''); setKeywordInput(''); setError(''); setNotice(''); setPreviewOpen(false);
    setDraft({ ...EMPTY });
  }

  function openEdit(article: Article) {
    setSlugEdited(true);
    setTagInput(''); setKeywordInput(''); setError(''); setNotice(''); setPreviewOpen(false);
    setDraft(asDraft(article));
  }

  async function save(publish = false, forceDraft = false) {
    if (!draft) return;
    const content = editorRef.current?.innerHTML || draft.content;
    const nextStatus = publish ? 'PUBLISHED' : forceDraft || draft.status === 'PUBLISHED' ? 'DRAFT' : draft.status;
    if (!draft.title.trim() || !draft.slug.trim() || !content.trim()) {
      setError('Title, slug, and article content are required.');
      return;
    }
    if (!draft.category || !draft.featuredImage.trim()) {
      setError('Select a category and add a featured image URL.');
      return;
    }
    if (nextStatus === 'SCHEDULED' && !draft.scheduledAt) {
      setError('Choose a publish date before saving this article as scheduled.');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    const data = {
      title: draft.title.trim(), slug: draft.slug.trim(), excerpt: draft.excerpt,
      content, category: draft.category, tags: draft.tags, featuredImage: draft.featuredImage,
      isFeatured: draft.isFeatured, status: nextStatus,
      scheduledAt: nextStatus === 'SCHEDULED' && draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
      seoTitle: draft.seoTitle, metaDescription: draft.metaDescription,
      seoKeywords: draft.seoKeywords, canonicalUrl: draft.canonicalUrl,
      ogTitle: draft.ogTitle, ogDescription: draft.ogDescription, ogImage: draft.ogImage,
    };
    try {
      await adminFetch(draft.id ? `/admin/manage/articles/${draft.id}` : '/admin/manage/articles', {
        method: draft.id ? 'PATCH' : 'POST', body: JSON.stringify(data),
      });
      setDraft(null); setPreviewOpen(false);
      setNotice(publish ? 'Article published.' : 'Draft saved.');
      setRefresh((value) => value + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the article.');
    } finally { setSaving(false); }
  }

  async function changeStatus(article: Article) {
    setError(''); setNotice('');
    try {
      const publish = article.status !== 'PUBLISHED';
      await adminFetch(`/admin/manage/articles/${article.id}/${publish ? 'publish' : 'unpublish'}`, { method: 'POST' });
      setNotice(publish ? 'Article published.' : 'Article moved to draft.');
      setRefresh((value) => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update article.'); }
  }

  async function remove(article: Article) {
    if (!window.confirm(`Permanently delete “${article.title}”?`)) return;
    setError(''); setNotice('');
    try {
      await adminFetch(`/admin/manage/articles/${article.id}`, { method: 'DELETE' });
      setNotice('Article deleted.'); setRefresh((value) => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete article.'); }
  }

  function runEditorCommand(command: string, value?: string) {
    editorRef.current?.focus();
    if (command === 'createLink' || command === 'insertImage') {
      const url = window.prompt(command === 'createLink' ? 'Enter link URL' : 'Enter image URL');
      if (!url) return;
      document.execCommand(command, false, url);
    } else if (command === 'formatBlock') {
      document.execCommand(command, false, value || 'h2');
    } else {
      document.execCommand(command, false);
    }
    if (editorRef.current) setDraft((current) => current ? { ...current, content: editorRef.current!.innerHTML } : current);
  }

  function addTag(event: React.KeyboardEvent<HTMLInputElement>, field: 'tags' | 'seoKeywords') {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const value = (field === 'tags' ? tagInput : keywordInput).trim();
    if (!value || !draft) return;
    const property = field;
    const values = draft[property];
    if (!values.includes(value)) setDraft({ ...draft, [property]: [...values, value] });
    field === 'tags' ? setTagInput('') : setKeywordInput('');
  }

  const pageContent = draft ? (
    <form onSubmit={(event) => { event.preventDefault(); void save(false); }} className="min-h-[calc(100vh-7rem)] space-y-3 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><button type="button" onClick={() => { setDraft(null); setPreviewOpen(false); }} className="mb-1 text-xs text-slate-400 hover:text-white">← Blog / Articles</button><h1 className="text-lg font-bold">{draft.id ? 'Edit Article' : 'Create Article'}</h1></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setDraft(null); setPreviewOpen(false); }} className="rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">Cancel</button>
          <button type="button" disabled={saving} onClick={() => void save(false, true)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">Save Draft</button>
          <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs hover:bg-slate-800">Preview</button>
          <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Saving…' : 'Publish'}</button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/60 px-3 py-2 text-sm text-red-300">{error}</p>}
      <div className="grid items-start gap-3 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <section className={cardClass}>
            <CardTitle>Basic information</CardTitle>
            <div className="space-y-3 p-3">
              <Field label="Title *"><input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value, slug: slugEdited ? draft.slug : slugify(event.target.value) })} placeholder="How to Find a Skilled Mobile Repair Technician" className={inputClass} /></Field>
              <Field label="Slug *"><input required maxLength={220} value={draft.slug} onChange={(event) => { setSlugEdited(true); setDraft({ ...draft, slug: slugify(event.target.value) }); }} placeholder="how-to-find-a-skilled-mobile-repair-technician" className={inputClass} /><small className="mt-1 block text-[10px] text-slate-500">Auto-generated from the title; edit if needed. Public URL: /blog/your-article-slug</small></Field>
              <Field label="Excerpt / short description"><textarea rows={3} maxLength={500} value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} placeholder="A short summary used on article cards and previews." className={inputClass} /><small className="mt-1 block text-[10px] text-slate-500">{draft.excerpt.length}/500 characters</small></Field>
            </div>
          </section>

          <section className={cardClass}>
            <CardTitle>Article content</CardTitle>
            <div className="p-3">
              <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-slate-300 bg-slate-100 p-1 text-slate-600">
                <select aria-label="Text style" onChange={(event) => runEditorCommand('formatBlock', event.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] text-slate-800"><option value="p">Paragraph</option><option value="h2">Heading 2</option></select>
                {toolbarButtons.map((item) => <button key={item.command} type="button" title={item.title} onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand(item.command)} className="min-w-7 rounded px-1.5 py-1 text-[10px] hover:bg-slate-200">{item.label}</button>)}
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('createLink')} className="rounded px-1.5 py-1 text-[10px] hover:bg-slate-200">Link</button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('insertImage')} className="rounded px-1.5 py-1 text-[10px] hover:bg-slate-200">Image</button>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runEditorCommand('removeFormat')} className="rounded px-1.5 py-1 text-[10px] hover:bg-slate-200">Clear</button>
              </div>
              <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(event) => setDraft({ ...draft, content: event.currentTarget.innerHTML })} className="min-h-[280px] rounded-b-md border border-t-0 border-slate-600 bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none focus:border-blue-500" />
              <small className="mt-1 block text-[10px] text-slate-500">Formatting is preserved on the public website. Pasted text is inserted as plain text—apply formatting in the editor.</small>
            </div>
          </section>

          <section className={cardClass}>
            <CardTitle>SEO settings</CardTitle>
            <div className="space-y-3 p-3">
              <Field label="SEO title"><input maxLength={120} value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} placeholder="Defaults to the article title" className={inputClass} /><small className="mt-1 block text-[10px] text-slate-500">{draft.seoTitle.length}/120 — recommended around 50–60 characters</small></Field>
              <Field label="SEO meta description"><textarea rows={2} maxLength={300} value={draft.metaDescription} onChange={(event) => setDraft({ ...draft, metaDescription: event.target.value })} placeholder="Shown under the title in search results" className={inputClass} /><small className="mt-1 block text-[10px] text-slate-500">{draft.metaDescription.length}/300 — recommended around 150–160 characters</small></Field>
              <TagField label="SEO keywords" values={draft.seoKeywords} input={keywordInput} setInput={setKeywordInput} onKeyDown={(event) => addTag(event, 'seoKeywords')} onRemove={(value) => setDraft({ ...draft, seoKeywords: draft.seoKeywords.filter((item) => item !== value) })} placeholder="Type a keyword…" />
              <Field label="Canonical URL (optional)"><input value={draft.canonicalUrl} onChange={(event) => setDraft({ ...draft, canonicalUrl: event.target.value })} placeholder="https://skilho.com/blog/..." className={inputClass} /></Field>
              <div className="grid gap-3 md:grid-cols-2"><Field label="Open Graph title"><input value={draft.ogTitle} onChange={(event) => setDraft({ ...draft, ogTitle: event.target.value })} className={inputClass} /></Field><Field label="Social / OG image URL"><input value={draft.ogImage} onChange={(event) => setDraft({ ...draft, ogImage: event.target.value })} placeholder="https://..." className={inputClass} /></Field></div>
              <Field label="Open Graph description"><textarea rows={2} value={draft.ogDescription} onChange={(event) => setDraft({ ...draft, ogDescription: event.target.value })} className={inputClass} /></Field>
              <small className="block text-[10px] text-slate-500">SEO fields are optional. Exceeding recommended character counts never blocks saving or publishing.</small>
            </div>
          </section>
        </div>

        <div className="space-y-3">
          <section className={cardClass}>
            <CardTitle>Featured image</CardTitle>
            <div className="space-y-2 p-3">
              <div className="flex h-44 items-center justify-center overflow-hidden rounded border border-dashed border-slate-600 bg-slate-50 text-xs text-slate-500">{draft.featuredImage ? <img src={draft.featuredImage} alt="Article featured image preview" className="h-full w-full object-cover" /> : 'No image selected'}</div>
              <Field label="Image URL *"><input required value={draft.featuredImage} onChange={(event) => setDraft({ ...draft, featuredImage: event.target.value })} placeholder="https://... or /uploads/..." className={inputClass} /><small className="mt-1 block text-[10px] text-slate-500">Paste a hosted image URL. Direct file upload requires a storage backend (e.g. S3) that the platform does not have yet.</small></Field>
            </div>
          </section>

          <section className={cardClass}>
            <CardTitle>Category &amp; tags</CardTitle>
            <div className="space-y-3 p-3">
              <Field label="Category *"><select required value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={inputClass}><option value="">Select a category…</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select><small className="mt-1 block text-[10px] text-slate-500">Choose the topic that best fits this article.</small></Field>
              <TagField label="Tags" values={draft.tags} input={tagInput} setInput={setTagInput} onKeyDown={(event) => addTag(event, 'tags')} onRemove={(value) => setDraft({ ...draft, tags: draft.tags.filter((item) => item !== value) })} placeholder="Mobile Repair, Hiring…" />
            </div>
          </section>

          <section className={cardClass}>
            <CardTitle>Author</CardTitle>
            <div className="p-3"><div className="flex items-center gap-2 rounded-md bg-slate-100 p-2 text-slate-700"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">AD</span><div><p className="text-xs font-semibold">Admin</p><p className="text-[10px] text-slate-500">You — set automatically on save</p></div></div></div>
          </section>

          <section className={cardClass}>
            <CardTitle>Settings</CardTitle>
            <div className="space-y-3 p-3">
              <Field label="Status"><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className={inputClass}><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></Field>
              {draft.status === 'SCHEDULED' && <Field label="Publish date"><input type="datetime-local" value={draft.scheduledAt} onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })} className={inputClass} />{!draft.scheduledAt && <small className="mt-1 block text-[10px] text-amber-400">Choose a date before saving as scheduled.</small>}</Field>}
              <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft({ ...draft, isFeatured: event.target.checked })} /> Featured article</label>
              <small className="block text-[10px] text-slate-500">Featured articles are highlighted on the public blog page.</small>
            </div>
          </section>

          <section className={cardClass}>
            <CardTitle>Public URL</CardTitle>
            <div className="p-3"><div className="rounded bg-slate-100 px-2 py-2 font-mono text-[10px] text-slate-600">/blog/{draft.slug || 'your-article-slug'}</div><small className="mt-1 block text-[10px] text-slate-500">The public route is served by the website once blog pages are connected.</small></div>
          </section>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
        <button type="button" onClick={() => { setDraft(null); setPreviewOpen(false); }} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">Cancel</button>
        <button type="button" disabled={saving} onClick={() => void save(false, true)} className="rounded-lg border border-slate-600 px-3 py-2 text-xs">Save Draft</button>
        <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Publish'}</button>
      </div>
      {previewOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4"><div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900"><div className="flex items-center justify-between border-b border-slate-800 p-3"><strong className="text-sm">Article preview</strong><button type="button" onClick={() => setPreviewOpen(false)} className="rounded border border-slate-600 px-3 py-1.5 text-xs">Close preview</button></div><iframe title="Article preview" sandbox="" className="flex-1 bg-white" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px/1.7 system-ui,sans-serif;color:#172033;max-width:760px;margin:40px auto;padding:0 20px}img{max-width:100%;height:auto}h1{line-height:1.2}</style></head><body><h1>${draft.title.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)}</h1>${editorRef.current?.innerHTML || draft.content}</body></html>`} /></div></div>}
    </form>
  ) : (
    <div className="space-y-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Blog / Articles</h1><p className="mt-1 text-sm text-slate-400">Create, manage and publish blog articles for the Skilho website.</p></div><button onClick={openNew} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">+ New Article</button></div>
      {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300">{notice}</p>}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <form onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(searchInput.trim()); }} className="flex flex-wrap items-center gap-3 border-b border-slate-800 p-4">
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="⌕  Search articles…" className={`${inputClass} min-w-[220px] flex-1 sm:max-w-sm`} />
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={`${inputClass} sm:w-40`}><option value="">All statuses</option>{['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'].map((value) => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}</select>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className={`${inputClass} sm:w-44`}><option value="">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={`${inputClass} sm:w-56`}><option value="createdAt:desc">Newest first</option><option value="createdAt:asc">Oldest first</option><option value="publishedAt:desc">Publish date (newest)</option><option value="publishedAt:asc">Publish date (oldest)</option><option value="title:asc">Title (A–Z)</option></select>
        </form>
        <div className="min-h-[360px] overflow-x-auto">
          {loading ? <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-400">Loading articles…</div> : items.length === 0 ? <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center"><p className="text-lg text-slate-300">No articles yet</p><p className="mt-3 max-w-md text-sm text-slate-500">Create your first blog article to publish content on the Skilho website.</p><button onClick={openNew} className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">+ Create Article</button></div> : <table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500"><tr>{['Article', 'Category', 'Status', 'Created', 'Published', ''].map((heading, index) => <th key={`${heading}-${index}`} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{items.map((article) => <tr key={article.id} className="border-b border-slate-800/80 text-slate-300"><td className="px-4 py-3"><p className="font-medium text-slate-100">{article.title}</p><p className="mt-1 font-mono text-[11px] text-slate-500">/blog/{article.slug}</p></td><td className="px-4 py-3">{article.category}</td><td className="px-4 py-3">{article.status}</td><td className="px-4 py-3">{new Date(article.createdAt).toLocaleDateString('en-IN')}</td><td className="px-4 py-3">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-IN') : '—'}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><button onClick={() => void changeStatus(article)} className="text-xs text-blue-400 hover:text-blue-300">{article.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button><button onClick={() => openEdit(article)} className="text-xs text-slate-300 hover:text-white">Edit</button><button onClick={() => void remove(article)} className="text-xs text-red-400 hover:text-red-300">Delete</button></div></td></tr>)}</tbody></table>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3 text-sm text-slate-400"><span>Showing {total === 0 ? 0 : (page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span><div className="flex items-center gap-3"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-40">Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs disabled:opacity-40">Next</button></div></div>
      </section>
    </div>
  );

  return <AdminShell><div className="mx-auto w-full max-w-[1500px]">{pageContent}</div></AdminShell>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-200">{children}</h2>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={labelClass}>{label}</span>{children}</label>;
}

function TagField({ label, values, input, setInput, onKeyDown, onRemove, placeholder }: {
  label: string; values: string[]; input: string; setInput: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void; onRemove: (value: string) => void; placeholder: string;
}) {
  return <Field label={label}><div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950 p-2">{values.map((value) => <span key={value} className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-200">{value}<button type="button" onClick={() => onRemove(value)} aria-label={`Remove ${value}`} className="text-slate-400 hover:text-white">×</button></span>)}<input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} className="min-w-[130px] flex-1 border-0 bg-transparent px-1 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-600" /></div><small className="mt-1 block text-[10px] text-slate-500">Type an item and press Enter.</small></Field>;
}
