export type ProductStatus = 'draft' | 'published' | 'archived'

export interface DatabaseProduct {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price_cup: number | null
  price_usd: number | null
  available: boolean
  featured: boolean
  status: ProductStatus
  created_at: string
  updated_at: string
  price_eur: number | null
}

export interface ProductInput {
  category_id: string
  name: string
  slug: string
  description: string | null
  price_cup: number | null
  price_usd: number | null
  available: boolean
  featured: boolean
  status: ProductStatus
  price_eur: number | null
}