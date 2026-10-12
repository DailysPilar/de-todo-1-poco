
import { supabase } from '@/lib/supabase'

export interface CurrencySettings {
  id: number
  usd_to_cup: number
  eur_to_cup: number
  updated_at: string
}

export async function getCurrencySettings():
  Promise<CurrencySettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('id, usd_to_cup, eur_to_cup, updated_at')
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
