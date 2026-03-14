# Guide Italia

App mappa che mostra locali/ristoranti recensiti da guide italiane.

- **Stack**: React + TypeScript + Mapbox GL + Vite + PWA
- **Deploy**: Cloudflare Pages → https://guide-italia.pages.dev/
- **Mappa**: stile custom Mapbox (`francescocioria/cjqi3u6lmame92rmw6aw3uyhm`)

## Fonti dati

| Guida | Scraper | File | Totali | Geocodificati | Rating | Descrizioni |
|-------|---------|------|--------|---------------|--------|-------------|
| Pecora Nera | `scraper/fetch_pecora_nera.py` | `data/pecora_nera.json` | 1467 | 1467 (100%) | 777 (solo tavole/pause) | 1464 |
| Dissapore | `scraper/import_dissapore.py` | `data/dissapore.json` | 324 | 324 | - | - |
| Franchino | dati da sito + `scraper/regeocode_franchino.py` | `data/franchino.json` | 1086 | 770 | 967 | - |
| No Mayo | `scraper/fetch_nomayo.mjs` | `data/nomayo.json` | 42 | 42 | 42 | 42 |

### Filtri FE (dati in DB ma nascosti dalla mappa)
- **Pecora Nera** "La spesa di qualità": escluse solo macelleria, pescheria, utensileria
- **Franchino**: solo rating >= 7
- Rating normalizzati su scala 0-10 (Pecora Nera era X/5 o X/10, No Mayo era bacchette 0-5)

## TODO

### Dati
- [ ] Franchino: molte tipologie sono "Altro" (457/1086) — migliorare la categorizzazione
- [ ] Dissapore: mancano descrizioni e rating
- [ ] Aggiungere nuove guide/fonti
- [ ] Rieseguire scraper periodicamente per aggiornare i dati

### App
- [ ] Immagini: aggiungere un'immagine a ogni locale nella detail card (scrape da pagine guida o Google Places API)
- [ ] Clustering dei marker quando sono troppo vicini (a zoom bassi)
- [ ] Filtro per tipologia (pizzeria, osteria, ecc.)
- [ ] Performance: il bundle JS è ~1.8MB (mapbox-gl) — valutare code splitting

## Google Maps Geocoding API

- Free tier: 1000 richieste/mese
- API key in `.env` (`GOOGLE_MAPS_API_KEY`)
- **2026-03-14**: usate ~820/1000 richieste (298 Pecora Nera + 520 Franchino)

## Comandi

```bash
# Dev
cd app && npm run dev

# Deploy
cd app && cp ../data/*.json public/data/ && npm run build && npx wrangler pages deploy dist --project-name guide-italia --commit-dirty=true

# Rieseguire scraper
python3 scraper/fetch_pecora_nera.py
python3 scraper/import_dissapore.py
python3 scraper/regeocode_franchino.py
```
