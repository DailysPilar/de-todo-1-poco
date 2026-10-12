
import { supabase } from '@/lib/supabase'
import type {
  DatabaseProduct,
  ProductInput,
} from '@/types/databaseProduct'

// Obtener productos
export async function getProducts(): Promise<DatabaseProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as DatabaseProduct[]
}

// Crear producto
export async function createProduct(
  product: ProductInput,
): Promise<DatabaseProduct> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) throw error

  return data as DatabaseProduct
}

// Actualizar producto
export async function updateProduct(
  id: string,
  changes: Partial<ProductInput>,
): Promise<DatabaseProduct> {
  const { data, error } = await supabase
    .from('products')
    .update(changes)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data as DatabaseProduct
}

// Eliminar producto
export async function deleteProduct(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getProductBySlugFromApi(
  slug: string,
): Promise<DatabaseProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error

  return data as DatabaseProduct | null
}