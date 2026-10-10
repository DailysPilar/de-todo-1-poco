export type Currency = 'CUP' | 'USD'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number | null
  currency: Currency
  categoryId: string
  images: string[]
  available: boolean
  featured: boolean
  createdAt: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}