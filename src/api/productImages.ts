
import { supabase } from '@/lib/supabase'

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  sort_order: number
  created_at: string
}

export async function getProductImages(
  productId: string,
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (data ?? []) as ProductImage[]
}

export async function uploadProductImage(
  productId: string,
  file: File,
  sortOrder: number,
): Promise<ProductImage> {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WebP.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 5 MB.')
  }

  const extension = file.type === 'image/png'
    ? 'png'
    : file.type === 'image/webp'
      ? 'webp'
      : 'jpg'

const storagePath =
  `${productId}/${generateImageId()}.${extension}`
  
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      storage_path: storagePath,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) {
    await supabase.storage
      .from('product-images')
      .remove([storagePath])

    throw error
  }

  return data as ProductImage
}

export async function deleteProductImage(
  image: ProductImage,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', image.id)

  if (deleteError) throw deleteError

  const { error: storageError } = await supabase.storage
    .from('product-images')
    .remove([image.storage_path])

  if (storageError) {
    throw new Error(
      'Se eliminó el registro, pero no se pudo borrar el archivo: ' +
      storageError.message,
    )
  }
}

export async function getProductMainImageUrl(
  productId: string,
): Promise<string | null> {
  const { data: images, error } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .limit(1)

  if (error) throw error

  const image = images?.[0]

  if (!image) return null

  const { data, error: signedUrlError } =
    await supabase.storage
      .from('product-images')
      .createSignedUrl(image.storage_path, 300)

  if (signedUrlError) throw signedUrlError

  return data.signedUrl
}
export interface ProductImageWithUrl extends ProductImage {
  url: string
}

export async function getProductImagesWithUrls(
  productId: string,
): Promise<ProductImageWithUrl[]> {
  const images = await getProductImages(productId)

  if (!images.length) return []

  const { data, error } = await supabase.storage
    .from('product-images')
    .createSignedUrls(
      images.map((image) => image.storage_path),
      300,
    )

  if (error) throw error

  return images.flatMap((image, index) => {
    const url = data?.[index]?.signedUrl

    return url ? [{ ...image, url }] : []
  })
}
function generateImageId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}