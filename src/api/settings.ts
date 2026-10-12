
import { supabase } from '@/lib/supabase'

export interface CurrencySettings {
  id: number
  usd_to_cup: number
  eur_to_cup: number
  whatsapp_number: string | null
  updated_at: string
}

export async function getCurrencySettings(): Promise<CurrencySettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select(
      'id, usd_to_cup, eur_to_cup, whatsapp_number, updated_at',
    )
    .eq('id', 1)
    .single()

  if (error) throw error

  return data as CurrencySettings
}

export async function saveCurrencySettings(
  usdToCup: number,
  eurToCup: number,
): Promise<CurrencySettings> {
  if (
    !Number.isFinite(usdToCup) ||
    !Number.isFinite(eurToCup) ||
    usdToCup <= 0 ||
    eurToCup <= 0
  ) {
    throw new Error('Las tasas deben ser mayores que cero.')
  }

  const { data, error } = await supabase
    .from('store_settings')
    .update({
      usd_to_cup: usdToCup,
      eur_to_cup: eurToCup,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error

  return data as CurrencySettings
}

export async function getStoreWhatsAppNumber(): Promise<string | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('whatsapp_number')
    .eq('id', 1)
    .single()

  if (error) throw error

  return data.whatsapp_number || null
}

export async function saveStoreWhatsAppNumber(
  phoneNumber: string,
): Promise<string | null> {
  const normalizedPhone = phoneNumber.replace(/[\s()+-]/g, '')

  if (
    normalizedPhone !== '' &&
    !/^[1-9][0-9]{7,14}$/.test(normalizedPhone)
  ) {
    throw new Error(
      'Introduce un número internacional válido, sin el signo +.',
    )
  }

  const { data, error } = await supabase
    .from('store_settings')
    .update({
      whatsapp_number: normalizedPhone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)
    .select('whatsapp_number')
    .single()

  if (error) throw error

  return data.whatsapp_number
}
