'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Select } from '@base-ui/react/select'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Film,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'

type AnimeStatus = 'Completed' | 'Ongoing' | 'Planned'
type Category = 'Action' | 'Rom-Com' | 'Sad' | 'Reincarnation'

type Anime = {
  id: string
  title: string
  category: Category
  status: AnimeStatus
  rating?: number
  episodes?: number
  seasons?: number
  description?: string
  source?: string
  reel?: string
  directUrl?: string
  imageUrl?: string
  relatedMovies?: string[]
  art: string
  accent: string
  initials: string
}

const STORAGE_KEY = 'kairo-anime-library-v1'
const categories: Category[] = ['Action', 'Rom-Com', 'Sad', 'Reincarnation']
const statuses: AnimeStatus[] = ['Completed', 'Ongoing', 'Planned']

const statusMeta: Record<AnimeStatus, { label: string; icon: typeof Check }> = {
  Completed: { label: 'Completed', icon: Check },
  Ongoing: { label: 'Watching', icon: Film },
  Planned: { label: 'Planned', icon: Clock3 },
}

function isAnimeStatus(value: unknown): value is AnimeStatus {
  return typeof value === 'string' && statuses.includes(value as AnimeStatus)
}

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && categories.includes(value as Category)
}

function getSafeExternalUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function validateImportedAnime(value: unknown): Anime[] | null {
  if (!Array.isArray(value) || value.length > 1000) return null
  const valid = value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const anime = item as Record<string, unknown>
    return typeof anime.title === 'string' && anime.title.trim().length > 0 && isAnimeStatus(anime.status) && isCategory(anime.category)
  })
  if (!valid) return null
  const palettes = ['art-violet', 'art-mint', 'art-sunset', 'art-coral', 'art-ember', 'art-blue', 'art-rose', 'art-night']
  return value.map((item, index) => {
    const anime = item as Partial<Anime>
    const palette = typeof anime.art === 'string' ? anime.art : palettes[index % palettes.length]
    return {
      id: typeof anime.id === 'string' ? anime.id : `anime-${Date.now()}-${index}`,
      title: anime.title!.trim(),
      category: anime.category!,
      status: anime.status!,
      rating: typeof anime.rating === 'number' && anime.rating >= 1 && anime.rating <= 10 ? anime.rating : undefined,
      episodes: typeof anime.episodes === 'number' && anime.episodes > 0 ? anime.episodes : undefined,
      seasons: typeof anime.seasons === 'number' && Number.isInteger(anime.seasons) && anime.seasons > 0 && anime.seasons <= 99 ? anime.seasons : undefined,
      description: typeof anime.description === 'string' && anime.description.trim() ? anime.description.trim().slice(0, 1000) : undefined,
      source: typeof anime.source === 'string' ? anime.source.trim().slice(0, 120) : undefined,
      reel: typeof anime.reel === 'string' ? anime.reel.trim().slice(0, 500) : undefined,
      directUrl: typeof anime.directUrl === 'string' && getSafeExternalUrl(anime.directUrl) ? getSafeExternalUrl(anime.directUrl) : undefined,
      imageUrl: typeof anime.imageUrl === 'string' ? getSafeExternalUrl(anime.imageUrl) : undefined,
      relatedMovies: Array.isArray(anime.relatedMovies) ? anime.relatedMovies.filter((movie): movie is string => typeof movie === 'string').map((movie) => movie.trim().slice(0, 120)).filter(Boolean).slice(0, 25) : [],
      art: palette,
      accent: typeof anime.accent === 'string' ? anime.accent : palette.replace('art-', ''),
      initials: typeof anime.initials === 'string' ? anime.initials : anime.title!.slice(0, 5),
    }
  })
}

export function AnimeManager() {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [statusFilter, setStatusFilter] = useState('All anime')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [selectedStatus, setSelectedStatus] = useState<AnimeStatus>('Completed')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('Action')
  const [rating, setRating] = useState(0)
  const [episodes, setEpisodes] = useState('')
  const [seasons, setSeasons] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [relatedMovies, setRelatedMovies] = useState('')
  const [notice, setNotice] = useState('')
  const importRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        const imported = validateImportedAnime(parsed)
        if (imported) setAnime(imported)
      }
    } catch {
      setNotice('Your saved list could not be read. Your library is empty.')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(anime))
    } catch {
      setNotice('Storage is full. Export your list to keep a backup.')
    }
  }, [anime, loaded])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filteredAnime = useMemo(() => anime.filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory = categoryFilter === 'All categories' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'All anime' || item.status === statusFilter
    return matchesQuery && matchesCategory && matchesStatus
  }), [anime, categoryFilter, query, statusFilter])

  const completedCount = anime.filter((item) => item.status === 'Completed').length
  const watchingCount = anime.filter((item) => item.status === 'Ongoing').length
  const plannedCount = anime.filter((item) => item.status === 'Planned').length

  function openModal() {
    setEditingId(null)
    setTitle('')
    setStep(1)
    setSelectedStatus('Completed')
    setCategory('Action')
    setRating(0)
    setEpisodes('')
    setSeasons('')
    setDescription('')
    setSource('')
    setImageUrl('')
    setRelatedMovies('')
    setModalOpen(true)
    window.setTimeout(() => titleRef.current?.focus(), 30)
  }

  function editAnime(item: Anime) {
    setEditingId(item.id)
    setTitle(item.title)
    setStep(2)
    setSelectedStatus(item.status)
    setCategory(item.category)
    setRating(item.rating ?? 0)
    setEpisodes(item.episodes ? String(item.episodes) : '')
    setSeasons(item.seasons ? String(item.seasons) : '')
    setDescription(item.description ?? '')
    setSource(item.source ?? '')
    setImageUrl(item.imageUrl ?? '')
    setRelatedMovies((item.relatedMovies ?? []).join(', '))
    setModalOpen(true)
    window.setTimeout(() => titleRef.current?.focus(), 30)
  }

  function closeModal() {
    setModalOpen(false)
    setStep(1)
  }

  function deleteAnime(id: string) {
    if (!window.confirm('Are you sure you want to delete this anime?')) return
    setAnime((current) => current.filter((item) => item.id !== id))
    setNotice('Anime deleted successfully')
  }

  function addAnime() {
    if (!title.trim()) {
      setNotice('Give your anime a title to add it to your library.')
      return
    }
    const palettes = ['art-violet', 'art-mint', 'art-sunset', 'art-coral', 'art-ember', 'art-blue', 'art-rose', 'art-night']
    const selectedAnime = anime.find((item) => item.id === editingId)
    const palette = selectedAnime?.art ?? palettes[anime.length % palettes.length]
    const safeImageUrl = getSafeExternalUrl(imageUrl.trim())
    const updatedAnime: Anime = {
      ...selectedAnime,
      id: editingId ?? `anime-${Date.now()}`,
      title: title.trim(),
      category,
      status: selectedStatus,
      rating: selectedStatus !== 'Planned' && rating > 0 ? rating : undefined,
      episodes: episodes ? Number(episodes) : selectedStatus === 'Completed' ? 1 : undefined,
      seasons: seasons ? Number(seasons) : undefined,
      description: selectedStatus === 'Ongoing' && description.trim() ? description.trim().slice(0, 1000) : undefined,
      source: source.trim() ? source.trim().slice(0, 120) : undefined,
      imageUrl: safeImageUrl,
      relatedMovies: relatedMovies.split(',').map((movie) => movie.trim().slice(0, 120)).filter(Boolean).slice(0, 25),
      art: palette,
      accent: palette.replace('art-', ''),
      initials: title.trim().slice(0, 5),
    }
    setAnime((current) => editingId
      ? current.map((item) => item.id === editingId ? updatedAnime : item)
      : [updatedAnime, ...current])
    setStatusFilter('All anime')
    setCategoryFilter('All categories')
    setQuery('')
    closeModal()
    setNotice(editingId ? `${title.trim()} updated.` : `${title.trim()} added to your library.`)
  }

  function exportLibrary() {
    const blob = new Blob([JSON.stringify(anime, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'kairo-anime-library.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('Your library export is ready.')
  }

  async function importLibrary(file?: File) {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const imported = validateImportedAnime(parsed)
      if (!imported) throw new Error('invalid')
      setAnime(imported)
      setStatusFilter('All anime')
      setCategoryFilter('All categories')
      setQuery('')
      setNotice(`Imported ${imported.length} anime to your library.`)
    } catch {
      setNotice('That file does not look like a Kairo anime library JSON.')
    }
    if (importRef.current) importRef.current.value = ''
  }

  return (
    <main className="min-h-screen bg-[#0b0b10] text-[#f5f3f8]">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Kairo home">
          <span className="brand-mark"><Film size={17} strokeWidth={2.2} /></span>
          <span>KAIRO<span className="brand-period">.</span></span>
        </a>
        <span className="topbar-divider" aria-hidden="true" />
        <span className="topbar-label">YOUR ANIME SPACE</span>
        <div className="topbar-actions">
          <button className="utility-button" type="button" onClick={exportLibrary} aria-label="Export anime library">
            <ArrowDownToLine size={15} /> <span>Export</span>
          </button>
          <button className="utility-button" type="button" onClick={() => importRef.current?.click()} aria-label="Import anime library">
            <ArrowUpFromLine size={15} /> <span>Import</span>
          </button>
          <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" aria-label="Choose anime library JSON" onChange={(event) => void importLibrary(event.target.files?.[0])} />
          <button className="add-button" type="button" onClick={openModal}><Plus size={17} strokeWidth={2.5} /> <span>Add anime</span></button>
        </div>
      </header>

      <section className="page-shell" id="top">
        <div className="intro-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR PERSONAL WATCHLIST</div>
            <h1>Your anime, <span>your story.</span></h1>
            <p className="intro-copy">A little corner of the internet for everything you watch, love, and can't wait to see.</p>
          </div>
          <div className="collection-note"><Sparkles size={15} /><span>CURATED BY YOU</span></div>
        </div>

        <div className="stats-row" aria-label="Library summary">
          <div className="stat-item"><span className="stat-value">{String(anime.length).padStart(2, '0')}</span><span className="stat-label">IN YOUR LIBRARY</span></div>
          <div className="stat-separator" />
          <button className={`stat-item stat-filter ${statusFilter === 'Completed' ? 'stat-active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'All anime' : 'Completed')} type="button"><span className="stat-value stat-green">{String(completedCount).padStart(2, '0')}</span><span className="stat-label">COMPLETED</span></button>
          <div className="stat-separator" />
          <button className={`stat-item stat-filter ${statusFilter === 'Ongoing' ? 'stat-active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'Ongoing' ? 'All anime' : 'Ongoing')} type="button"><span className="stat-value stat-lilac">{String(watchingCount).padStart(2, '0')}</span><span className="stat-label">WATCHING</span></button>
          <div className="stat-separator" />
          <button className={`stat-item stat-filter ${statusFilter === 'Planned' ? 'stat-active' : ''}`} onClick={() => setStatusFilter(statusFilter === 'Planned' ? 'All anime' : 'Planned')} type="button"><span className="stat-value stat-amber">{String(plannedCount).padStart(2, '0')}</span><span className="stat-label">UP NEXT</span></button>
        </div>

        <div className="library-heading">
          <div className="library-title-wrap">
            <div><span className="section-kicker">THE COLLECTION</span><h2>Your library<span className="heading-dot">.</span></h2></div>
            <span className="result-count">{filteredAnime.length} TITLES</span>
          </div>
          <div className="filter-controls">
            <label className="search-box"><Search size={16} aria-hidden="true" /><span className="sr-only">Search your anime</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your anime..." /></label>
            <Select.Root value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)}>
              <Select.Trigger className="category-select" aria-label="Filter by category">
                <span className="category-filter-icon" aria-hidden="true"><Sparkles size={14} /></span>
                <span className="category-select-copy"><span className="category-select-label">BROWSE BY</span><Select.Value /></span>
                <Select.Icon className="select-chevron"><ChevronRight size={15} aria-hidden="true" /></Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Positioner className="category-positioner" sideOffset={8} alignItemWithTrigger={false}>
                  <Select.Popup className="category-popup">
                    <div className="category-popup-heading"><span>CHOOSE A GENRE</span><span>{categories.length} GENRES</span></div>
                    <Select.List className="category-list">
                      {['All categories', ...categories].map((item) => (
                        <Select.Item className="category-option" key={item} value={item}>
                          <span className={`category-option-mark ${item === 'All categories' ? 'mark-all' : `mark-${item.toLowerCase().replace(/[^a-z]+/g, '-')}`}`} aria-hidden="true" />
                          <Select.ItemText>{item}</Select.ItemText>
                          <Select.ItemIndicator className="category-option-check"><Check size={14} /></Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.List>
                    <div className="category-popup-footer"><span>FILTER YOUR COLLECTION</span><Sparkles size={12} aria-hidden="true" /></div>
                  </Select.Popup>
                </Select.Positioner>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        {filteredAnime.length > 0 ? <div className="anime-grid">
          {filteredAnime.map((item, index) => {
            const meta = statusMeta[item.status]
            const StatusIcon = meta.icon
            const safeUrl = getSafeExternalUrl(item.directUrl)
            const posterUrl = getSafeExternalUrl(item.imageUrl)
            const relatedMovies = item.relatedMovies ?? []
            return <article className="anime-card" key={item.id} style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}>
              <div className={`poster ${item.art}`}>
                <div className="poster-grain" aria-hidden="true" />
                {posterUrl && <img className="poster-image" src={posterUrl} alt="" />}
                <div className="poster-topline"><span className="poster-logo">K<span>.</span></span><span className="poster-issue">NO. {String((index % 9) + 1).padStart(2, '0')} / SERIES</span></div>
                {!posterUrl && <div className="poster-art" aria-hidden="true"><div className="poster-orbit orbit-one" /><div className="poster-orbit orbit-two" /><div className="poster-sun" /><div className="poster-silhouette" /><div className="poster-slash" /></div>}
                {!posterUrl && <div className="poster-title-block"><span className="poster-jp">{item.initials || item.title.slice(0, 5)}</span><span className="poster-rule" /><span className="poster-type">ANIMATION · {item.category.toUpperCase()}</span></div>}
                <span className={`status-badge status-${item.status.toLowerCase()}`}><StatusIcon size={12} strokeWidth={2.3} />{meta.label}</span>
                <button className="poster-edit-button" type="button" onClick={() => editAnime(item)} aria-label={`Edit ${item.title}`} title="Edit anime"><Pencil size={14} /></button>
                <button className="poster-edit-button poster-delete-button" type="button" onClick={() => deleteAnime(item.id)} aria-label={`Delete ${item.title}`} title="Delete anime"><Trash2 size={14} /></button>
              </div>
              <div className="card-details">
                <div className="card-title-line"><h3 title={item.title}>{item.title}</h3>{item.rating ? <div className="rating"><Star size={13} fill="currentColor" strokeWidth={1.5} /><span>{item.rating}<small>/10</small></span></div> : null}</div>
                <div className="card-meta"><span className={`category-tag tag-${item.accent}`}>{item.category}</span><span className="episode-count">{[item.seasons ? `${item.status === 'Ongoing' ? `Season ${item.seasons}` : `${item.seasons} ${item.seasons === 1 ? 'season' : 'seasons'}`}` : '', item.episodes ? `${item.episodes} ${item.episodes === 1 ? 'episode' : 'eps'}` : ''].filter(Boolean).join(' · ') || item.source || 'Not started'}</span></div>
                {item.status === 'Ongoing' && item.description && <p className="card-description">{item.description}</p>}
                {(item.source || safeUrl || relatedMovies.length > 0) && <div className="card-extra">{item.source && <span className="card-platform" title={item.source}>{item.source}</span>}{safeUrl && <a className="card-direct-link" href={safeUrl} target="_blank" rel="noreferrer">Open link<ChevronRight size={11} aria-hidden="true" /></a>}{relatedMovies.length > 0 && <span className="card-related" title={relatedMovies.join(', ')}><Film size={11} aria-hidden="true" />{relatedMovies[0]}{relatedMovies.length > 1 ? ` +${relatedMovies.length - 1}` : ''}</span>}</div>}
              </div>
            </article>
          })}
        </div> : <div className="empty-state"><div className="empty-icon"><CircleHelp size={23} /></div><h3>No anime found</h3><p>Try another search or category, or add something new to your collection.</p><button className="add-button" type="button" onClick={openModal}><Plus size={16} />Add anime</button></div>}

        <footer className="page-footer"><span><span className="footer-mark">K.</span> KEEP YOUR STORY GOING</span><span>MADE FOR THE NEXT EPISODE <span className="footer-spark">✳</span></span></footer>
      </section>

      {notice && <div className="toast" role="status"><span className="toast-icon"><Check size={14} /></span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal() }} onKeyDown={(event) => { if (event.key === 'Escape') closeModal() }}>
        <section className={`anime-modal ${step === 2 ? 'anime-modal-details' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}>
          <div className="modal-header"><div><span className="section-kicker">{editingId ? 'REFINE YOUR STORY' : 'A NEW CHAPTER'}</span><h2 id="modal-title">{editingId ? <>Edit your <span>library.</span></> : <>Add to your <span>library.</span></>}</h2></div><button className="modal-close" type="button" onClick={closeModal} aria-label="Close dialog"><X size={18} /></button></div>
          <div className="step-track" aria-label={`Step ${step} of 2`}><span className={`step-dot ${step >= 1 ? 'step-current' : ''}`}>01</span><span className="step-line" /><span className={`step-dot ${step === 2 ? 'step-current' : ''}`}>02</span><span className="step-caption">{step === 1 ? 'THE BASICS' : 'THE DETAILS'}</span></div>
          {step === 1 ? <div className="modal-body">
            <label className="field-label" htmlFor="anime-title">Anime title</label>
            <input ref={titleRef} id="anime-title" className="text-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={selectedStatus === 'Completed' ? 'Title of the anime you finished' : selectedStatus === 'Ongoing' ? 'Title of the anime you’re watching' : 'Title of the anime on your watchlist'} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) setStep(2) }} />
            <span className="field-label status-prompt">Where are you in the story?</span>
            <div className="status-options" role="radiogroup" aria-label="Anime status">
              {statuses.map((item) => {
                const Icon = statusMeta[item].icon
                return <button type="button" role="radio" aria-checked={selectedStatus === item} className={`status-option ${selectedStatus === item ? 'status-option-selected' : ''}`} key={item} onClick={() => setSelectedStatus(item)}><span className="option-icon"><Icon size={16} /></span><span className="option-copy"><strong>{item === 'Ongoing' ? 'Watching' : item === 'Planned' ? 'Up next' : item}</strong><small>{item === 'Completed' ? 'I\'ve seen it all' : item === 'Ongoing' ? 'Currently watching' : 'On my watchlist'}</small></span><span className="option-radio">{selectedStatus === item && <Check size={12} />}</span></button>
              })}
            </div>
          </div> : <div className="modal-body modal-step-two">
            <div className="field-row"><div className="field-group"><label className="field-label" htmlFor="anime-title-step2">Anime title</label><input id="anime-title-step2" className="text-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Anime title" /></div><div className="field-group"><span className="field-label" id="anime-category-label">Category</span><Select.Root value={category} onValueChange={(value) => value && setCategory(value as Category)}><Select.Trigger id="anime-category" className="category-select category-select-field" aria-labelledby="anime-category-label"><span className="category-filter-icon" aria-hidden="true"><Sparkles size={14} /></span><span className="category-select-copy"><span className="category-select-label">GENRE</span><Select.Value /></span><Select.Icon className="select-chevron"><ChevronRight size={15} aria-hidden="true" /></Select.Icon></Select.Trigger><Select.Portal><Select.Positioner className="category-positioner" sideOffset={6} alignItemWithTrigger={false}><Select.Popup className="category-popup"><div className="category-popup-heading"><span>CHOOSE A GENRE</span><span>{categories.length} GENRES</span></div><Select.List className="category-list">{categories.map((item) => <Select.Item className="category-option" key={item} value={item}><span className={`category-option-mark mark-${item.toLowerCase().replace(/[^a-z]+/g, '-')}`} aria-hidden="true" /><Select.ItemText>{item}</Select.ItemText><Select.ItemIndicator className="category-option-check"><Check size={14} /></Select.ItemIndicator></Select.Item>)}</Select.List><div className="category-popup-footer"><span>TAG YOUR COLLECTION</span><Sparkles size={12} aria-hidden="true" /></div></Select.Popup></Select.Positioner></Select.Portal></Select.Root></div></div>
            <div className="selected-status-note"><span className={`status-dot status-dot-${selectedStatus.toLowerCase()}`} />{selectedStatus === 'Ongoing' ? 'Currently watching' : selectedStatus === 'Planned' ? 'On your watchlist' : 'Marked as completed'}<button type="button" onClick={() => setStep(1)}>Change</button></div>
            {selectedStatus !== 'Planned' && <div className="field-group rating-field"><span className="field-label">{selectedStatus === 'Ongoing' ? 'Your rating so far' : 'Your rating'} <span className="field-hint">OPTIONAL</span><span className="rating-value">{rating > 0 ? `${rating} / 10` : 'NOT RATED'}</span></span><div className="rating-picker" role="radiogroup" aria-label="Rating from 1 to 10">{Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} out of 10`} className={value <= rating ? 'rating-picked' : ''} onClick={() => setRating(value)}><Star size={20} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></div>}
            {selectedStatus !== 'Planned' && <div className="field-row"><div className="field-group"><label className="field-label" htmlFor="anime-seasons">{selectedStatus === 'Completed' ? 'Number of seasons' : 'Season you’re watching'} <span className="field-hint">OPTIONAL</span></label><input id="anime-seasons" className="text-field" type="number" min="1" max="99" step="1" value={seasons} onChange={(event) => setSeasons(event.target.value)} placeholder={selectedStatus === 'Completed' ? 'e.g. 3' : 'e.g. 2'} /></div><div className="field-group"><label className="field-label" htmlFor="anime-episodes">{selectedStatus === 'Completed' ? 'Number of episodes' : 'Episodes watched'} <span className="field-hint">OPTIONAL</span></label><input id="anime-episodes" className="text-field" type="number" min="1" max="999" value={episodes} onChange={(event) => setEpisodes(event.target.value)} placeholder={selectedStatus === 'Completed' ? 'e.g. 24' : 'e.g. 6'} /></div></div>}
            {selectedStatus === 'Ongoing' && <div className="field-group"><label className="field-label" htmlFor="anime-description">Your notes about this anime <span className="field-hint">OPTIONAL</span></label><textarea id="anime-description" className="text-field text-area-field" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What do you think so far? Favorite moments, characters, or where you left off..." /></div>}
            <div className="field-group"><label className="field-label" htmlFor="anime-image-url">Image URL <span className="field-hint">OPTIONAL</span></label><input id="anime-image-url" className="text-field" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/poster.jpg" /></div>
            <div className="field-group"><label className="field-label" htmlFor="anime-source">{selectedStatus === 'Completed' ? 'Where did you watch?' : selectedStatus === 'Ongoing' ? 'Where are you watching?' : 'Where will you watch?'} <span className="field-hint">OPTIONAL</span></label><input id="anime-source" className="text-field" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Crunchyroll, Netflix, Blu-ray..." /></div>
            <div className="field-group"><label className="field-label" htmlFor="anime-related-movies">Related movies <span className="field-hint">OPTIONAL · SEPARATE WITH COMMAS</span></label><input id="anime-related-movies" className="text-field" value={relatedMovies} onChange={(event) => setRelatedMovies(event.target.value)} placeholder="Movie title, sequel, spin-off..." /></div>
          </div>}
          <div className="modal-footer">{step === 2 ? <button type="button" className="back-button" onClick={() => setStep(1)}><ChevronLeft size={16} />Back</button> : <span className="modal-footnote">You can always edit this later.</span>}{step === 1 ? <button type="button" className="add-button modal-next" onClick={() => title.trim() ? setStep(2) : setNotice('Add an anime title to continue.')}>Continue<ChevronRight size={16} /></button> : <button type="button" className="add-button modal-next" onClick={addAnime}>{editingId ? <Check size={16} /> : <Plus size={16} />}{editingId ? 'Save changes' : 'Add to library'}</button>}</div>
        </section>
      </div>}
    </main>
  )
}
