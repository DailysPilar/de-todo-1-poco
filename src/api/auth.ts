
import { supabase } from '@/lib/supabase'

export interface AdminProfile {
  id: string
  display_name: string | null
  role: 'admin'
}

// Iniciar sesión
export async function loginAdmin(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) throw error

  return data
}

// Cerrar sesión
export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

// Obtener perfil administrativo
export async function getAdminProfile():
  Promise<AdminProfile | null> {

  const { data: userData, error: userError } =
    await supabase.auth.getUser()

  if (userError || !userData.user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (error) throw error

  return data as AdminProfile | null
}

// Cambiar contraseña
export async function changePassword(
  newPassword: string
) {
  const { data, error } =
    await supabase.auth.updateUser({
      password: newPassword,
    })

  if (error) throw error

  return data
}

// Solicitar recuperación de contraseña
export async function requestPasswordReset(
  email: string
) {
  const { error } =
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })

  if (error) throw error
}
