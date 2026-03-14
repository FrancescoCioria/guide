import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import './index.css'
import './App.css'
import type { Locale } from './types'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GUIDE_INFO: Record<string, { name: string; color: string }> = {
  pecora_nera: { name: 'Pecora Nera', color: '#e94560' },
  dissapore: { name: 'Dissapore', color: '#f5a623' },
  franchino: { name: 'Franchino', color: '#4ecdc4' },
  nomayo: { name: 'No Mayo', color: '#9b59b6' },
}

const DATA_FILES = ['pecora_nera', 'dissapore', 'franchino', 'nomayo']

function getMapsUrl(l: { url: string; name: string; address?: string | null }): string {
  if (l.url.includes('google.com/maps')) return l.url
  const city = l.address?.split(',').pop()?.trim() || ''
  const query = city ? `${l.name} ${city}` : l.name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function getSourceUrl(l: Locale): string | null {
  if (l.url.includes('google.com/maps')) return null
  return l.url
}

function toGeoJSON(locales: Locale[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locales.map((l, i) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lng!, l.lat!] },
      properties: { index: i },
    })),
  }
}

// --- Preview Card (Mapbox popup) ---

function buildPreviewHTML(l: Locale): string {
  const guide = GUIDE_INFO[l.guide]
  const descPreview = l.description
    ? l.description.substring(0, 120) + (l.description.length > 120 ? '...' : '')
    : ''
  return `
    <div class="preview-card">
      <div class="preview-header">
        <div class="preview-name">${l.name}</div>
        ${l.rating ? `<span class="preview-rating">${l.rating}</span>` : ''}
      </div>
      <div class="preview-guide" style="color:${guide?.color || '#888'}">${guide?.name || l.guide}</div>
      ${l.tipologie.length ? `<div class="preview-tipo">${l.tipologie.join(', ')}</div>` : ''}
      ${l.address ? `<div class="preview-address">${l.address}</div>` : ''}
      ${descPreview ? `<div class="preview-desc">${descPreview}</div>` : ''}
      <div class="preview-tap">Tocca per dettagli</div>
    </div>
  `
}

// --- Detail Modal ---

function DetailModal({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const guide = GUIDE_INFO[locale.guide]
  const mapsUrl = getMapsUrl(locale)
  const sourceUrl = getSourceUrl(locale)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="detail-top">
          <div className="detail-header">
            <h2 className="detail-name">{locale.name}</h2>
            {locale.rating && <span className="detail-rating">{locale.rating}</span>}
          </div>

          <span className="detail-guide-badge" style={{ background: guide?.color || '#888' }}>
            {guide?.name || locale.guide}
          </span>

          {locale.tipologie.length > 0 && (
            <div className="detail-tipologie">
              {locale.tipologie.map((t) => (
                <span key={t} className="detail-tipo-tag">{t}</span>
              ))}
            </div>
          )}

          {locale.address && (
            <div className="detail-row">
              <span className="detail-label">Indirizzo</span>
              <span>{locale.address}</span>
            </div>
          )}

          {locale.regions.length > 0 && (
            <div className="detail-row">
              <span className="detail-label">Regione</span>
              <span>{locale.regions.join(', ')}</span>
            </div>
          )}
        </div>

        {locale.description && (
          <div className="detail-description-scroll">
            <div className="detail-description">{locale.description}</div>
          </div>
        )}

        <div className="detail-actions">
          <a href={mapsUrl} target="_blank" rel="noopener" className="action-btn action-primary">
            Apri in Maps
          </a>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener" className="action-btn action-secondary">
              Vai alla scheda
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Search Panel ---

function SearchPanel({
  locales, regions, guides, selectedGuide, selectedRegion, search,
  onGuideChange, onRegionChange, onSearchChange, onLocaleClick, isOpen, onToggle,
}: {
  locales: Locale[]; regions: string[]; guides: string[]
  selectedGuide: string; selectedRegion: string; search: string
  onGuideChange: (v: string) => void; onRegionChange: (v: string) => void
  onSearchChange: (v: string) => void; onLocaleClick: (l: Locale) => void
  isOpen: boolean; onToggle: () => void
}) {
  return (
    <div className={`search-panel ${isOpen ? 'open' : ''}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? '\u2715' : '\u2630'}
        {!isOpen && <span className="toggle-label">Filtri</span>}
      </button>

      <div className="panel-content">
        <h1 className="app-title">Guide Italia</h1>

        <input
          type="search"
          placeholder="Cerca locale..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />

        <div className="filters">
          <select value={selectedGuide} onChange={(e) => onGuideChange(e.target.value)} className="filter-select">
            <option value="">Tutte le guide</option>
            {guides.map((g) => <option key={g} value={g}>{GUIDE_INFO[g]?.name || g}</option>)}
          </select>
          <select value={selectedRegion} onChange={(e) => onRegionChange(e.target.value)} className="filter-select">
            <option value="">Tutte le regioni</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="results-count">{locales.length} locali</div>

        <ul className="locale-list">
          {locales.slice(0, 100).map((l) => (
            <li key={`${l.guide}-${l.slug}`} onClick={() => onLocaleClick(l)} className="locale-item">
              <div className="locale-name">{l.name}</div>
              <div className="locale-meta">
                <span className="locale-badge" style={{ background: GUIDE_INFO[l.guide]?.color || '#666' }}>
                  {GUIDE_INFO[l.guide]?.name || l.guide}
                </span>
                {l.rating && <span className="locale-rating">{l.rating}</span>}
                {l.address && <span className="locale-address">{l.address}</span>}
              </div>
            </li>
          ))}
          {locales.length > 100 && (
            <li className="locale-item locale-more">... e altri {locales.length - 100} locali</li>
          )}
        </ul>
      </div>
    </div>
  )
}

// --- Main App ---

export default function App() {
  const [allLocales, setAllLocales] = useState<Locale[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGuide, setSelectedGuide] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [search, setSearch] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [detailLocale, setDetailLocale] = useState<Locale | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)

  useEffect(() => {
    Promise.all(
      DATA_FILES.map((file) =>
        fetch(`/data/${file}.json`).then((r) => r.ok ? r.json() : []).catch(() => [])
      )
    ).then((results) => {
      const el = document.createElement('textarea')
      const decode = (s: string) => { el.innerHTML = s; return el.value }
      const all = (results.flat() as Locale[]).map((l) => ({
        ...l,
        name: decode(l.name),
        address: l.address ? decode(l.address) : l.address,
      }))
      setAllLocales(all)
      setLoading(false)
    })
  }, [])

  const mappableLocales = useMemo(
    () => allLocales.filter((l) => {
      if (l.lat == null || l.lng == null) return false
      if (l.guide === 'franchino' && l.rating) {
        const r = parseFloat(l.rating)
        if (!isNaN(r) && r < 7) return false
      }
      if (l.guide === 'pecora_nera' && l.categories.includes('La spesa di qualità')) {
        const excluded = ['Macelleria', 'Pescheria', 'Utensileria']
        if (l.tipologie.some((t) => excluded.includes(t))) return false
      }
      return true
    }),
    [allLocales]
  )

  const guides = useMemo(() => [...new Set(allLocales.map((l) => l.guide))].sort(), [allLocales])
  const regions = useMemo(() => [...new Set(allLocales.flatMap((l) => l.regions))].filter(Boolean).sort(), [allLocales])

  const filtered = useMemo(() => {
    let list = mappableLocales
    if (selectedGuide) list = list.filter((l) => l.guide === selectedGuide)
    if (selectedRegion) list = list.filter((l) => l.regions.includes(selectedRegion))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q) ||
        l.tipologie.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [mappableLocales, selectedGuide, selectedRegion, search])

  const showPreviewPopup = useCallback((l: Locale, m: mapboxgl.Map) => {
    popupRef.current?.remove()
    popupRef.current = new mapboxgl.Popup({ offset: 12, maxWidth: '280px', closeButton: false })
      .setLngLat([l.lng!, l.lat!])
      .setHTML(buildPreviewHTML(l))
      .addTo(m)

    // Click on preview card opens detail
    const el = popupRef.current.getElement()
    const card = el?.querySelector('.preview-card')
    if (card) {
      card.addEventListener('click', () => {
        popupRef.current?.remove()
        setDetailLocale(l)
      })
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (loading || !mapContainer.current || mapRef.current) return

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/francescocioria/cjqi3u6lmame92rmw6aw3uyhm?optimize=true',
      center: [12.5, 42.5],
      zoom: 5,
    })

    navigator.geolocation?.getCurrentPosition(
      (pos) => m.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12, duration: 1500 }),
      () => {},
      { timeout: 5000 }
    )

    m.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    m.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    }), 'bottom-right')

    m.on('load', () => {
      m.addSource('locales', { type: 'geojson', data: toGeoJSON([]) })

      m.addLayer({
        id: 'locales-layer',
        type: 'circle',
        source: 'locales',
        paint: {
          'circle-radius': 7,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8,
          'circle-opacity': 0.9,
        },
      })

      m.on('click', 'locales-layer', (e) => {
        if (!e.features?.length) return
        const idx = e.features[0].properties!.index as number
        const locale = filtered[idx]
        if (locale) showPreviewPopup(locale, m)
      })

      m.on('mouseenter', 'locales-layer', () => { m.getCanvas().style.cursor = 'pointer' })
      m.on('mouseleave', 'locales-layer', () => { m.getCanvas().style.cursor = '' })
    })

    mapRef.current = m
    return () => { m.remove() }
  }, [loading])

  // Need to keep filtered ref in sync for click handler
  const filteredRef = useRef(filtered)
  filteredRef.current = filtered

  // Update map data + re-bind click handler
  useEffect(() => {
    const m = mapRef.current
    if (!m) return

    const geojson = toGeoJSON(filtered)
    // Add guide color to each feature
    geojson.features.forEach((f, i) => {
      const l = filtered[i]
      f.properties!.color = GUIDE_INFO[l.guide]?.color || '#888'
    })

    const update = () => {
      const source = m.getSource('locales') as mapboxgl.GeoJSONSource | undefined
      if (source) source.setData(geojson)
    }

    if (m.isStyleLoaded()) update()
    else m.on('load', update)
  }, [filtered])

  // Re-bind click handler when filtered changes
  useEffect(() => {
    const m = mapRef.current
    if (!m) return

    const handler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] }) => {
      if (!e.features?.length) return
      const idx = e.features[0].properties!.index as number
      const locale = filteredRef.current[idx]
      if (locale) showPreviewPopup(locale, m)
    }

    m.off('click', 'locales-layer', handler)
    m.on('click', 'locales-layer', handler)
  }, [filtered, showPreviewPopup])

  const handleLocaleClick = useCallback((l: Locale) => {
    setPanelOpen(false)
    if (mapRef.current && l.lat && l.lng) {
      mapRef.current.flyTo({ center: [l.lng, l.lat], zoom: 16, duration: 800 })
      showPreviewPopup(l, mapRef.current)
    }
  }, [showPreviewPopup])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>&#x1F37D;</div>
          <div style={{ color: 'var(--color-text-muted)' }}>Caricamento locali...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <SearchPanel
        locales={filtered} regions={regions} guides={guides}
        selectedGuide={selectedGuide} selectedRegion={selectedRegion} search={search}
        onGuideChange={setSelectedGuide} onRegionChange={setSelectedRegion}
        onSearchChange={setSearch} onLocaleClick={handleLocaleClick}
        isOpen={panelOpen} onToggle={() => setPanelOpen(!panelOpen)}
      />

      <div ref={mapContainer} style={{ height: '100%', width: '100%' }} />

      <div className="legend">
        {Object.entries(GUIDE_INFO).map(([key, info]) => (
          <button
            key={key}
            className={`legend-item ${selectedGuide === key ? 'active' : ''}`}
            onClick={() => setSelectedGuide(selectedGuide === key ? '' : key)}
          >
            <span className="legend-dot" style={{ background: info.color }} />
            {info.name}
          </button>
        ))}
      </div>

      {detailLocale && (
        <DetailModal locale={detailLocale} onClose={() => setDetailLocale(null)} />
      )}
    </div>
  )
}
