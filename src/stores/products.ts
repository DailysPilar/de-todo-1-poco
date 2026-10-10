import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Product, ProductCategory } from '@/types/product'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const categories = ref<ProductCategory[]>([])
  const loading = ref(false)

  const featuredProducts = computed(() =>
    products.value.filter((product) => product.featured),
  )

  function getProductBySlug(slug: string) {
    return products.value.find((product) => product.slug === slug)
  }

  return {
    products,
    categories,
    loading,
    featuredProducts,
    getProductBySlug,
  }
})