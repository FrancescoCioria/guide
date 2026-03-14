export interface Locale {
  name: string
  slug: string
  url: string
  address: string | null
  lat: number | null
  lng: number | null
  categories: string[]
  regions: string[]
  tipologie: string[]
  guide: string
  description?: string
  rating?: string
}
