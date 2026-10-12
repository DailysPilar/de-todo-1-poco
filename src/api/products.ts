
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
  productId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    'delete-product',
    {
      body: { productId },
    },
  )

  if (error) {
    let message = error.message

    const context = error.context

    if (context instanceof Response) {
      const responseBody = await context.json().catch(() => null)
      message = responseBody?.error ?? message
    }

    throw new Error(message)
  }

  if (!data?.success) {
    throw new Error(
      data?.error ?? 'No se pudo eliminar el producto.',
    )
  }
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