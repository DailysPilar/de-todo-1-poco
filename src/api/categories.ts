
import { supabase } from '@/lib/supabase'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  active: boolean
  sort_order: number
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(
      'id, name, slug, description, image_url, active, sort_order'
    )
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}
