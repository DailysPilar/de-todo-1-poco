
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getProducts } from '@/api/products'
import { getCategories, type Category } from '@/api/categories'
import type { DatabaseProduct } from '@/types/databaseProduct'

export const useProductsStore = defineStore('products', () => {
  const products = ref<DatabaseProduct[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const featuredProducts = computed(() =>
    products.value.filter(
      (product) =>
        product.featured &&
        product.status === 'published',
    ),
  )

  function getProductBySlug(slug: string) {
    return products.value.find(
      (product) => product.slug === slug,
    )
  }

  async function fetchProducts() {
    loading.value = true
    error.value = null

    try {
      products.value = await getProducts()
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los productos.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    categories.value = await getCategories()
  }

  async function initialize() {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
    ])
  }

  function clearProducts() {
    products.value = []
  }

  return {
    products,
    categories,
    loading,
    error,
    featuredProducts,
    getProductBySlug,
    fetchProducts,
    fetchCategories,
    initialize,
    clearProducts,
  }
})
