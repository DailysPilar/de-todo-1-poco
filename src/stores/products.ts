
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

  const categoriesById = computed(
    () => new Map(categories.value.map((category) => [category.id, category])),
  )

  function getCategoryById(id: string | null | undefined) {
    return id ? (categoriesById.value.get(id) ?? null) : null
  }

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
    categoriesById,
    getCategoryById,
    getProductBySlug,
    fetchProducts,
    fetchCategories,
    initialize,
    clearProducts,
  }
})
