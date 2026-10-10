
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  type AdminProfile,
} from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<AdminProfile | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAdmin = computed(
    () => profile.value?.role === 'admin'
  )

  async function refreshProfile() {
    profile.value = await getAdminProfile()
  }

  async function initialize() {
    if (initialized.value) return

    loading.value = true

    try {
      await refreshProfile()
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function login(
    email: string,
    password: string
  ) {
    loading.value = true

    try {
      await loginAdmin(email, password)
      await refreshProfile()

      if (!isAdmin.value) {
        await logoutAdmin()
        profile.value = null
        throw new Error(
          'Esta cuenta no tiene permisos de administrador.'
        )
      }
    } catch (error) {
      profile.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      await logoutAdmin()
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  // Mantener sincronizada la sesión
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      profile.value = null
    }
  })

  return {
    profile,
    loading,
    initialized,
    isAdmin,
    initialize,
    login,
    logout,
  }
})
