import type { DatabaseProduct } from '@/types/databaseProduct'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CU', {
    maximumFractionDigits: 2,
  }).format(value)
}

export function buildProductWhatsAppUrl(
  phoneNumber: string,
  product: DatabaseProduct,
): string {
  const prices = [
    product.price_cup !== null
      ? `${formatPrice(product.price_cup)} CUP`
      : null,
    product.price_usd !== null
      ? `${formatPrice(product.price_usd)} USD`
      : null,
    product.price_eur !== null
      ? `${formatPrice(product.price_eur)} EUR`
      : null,
  ].filter(Boolean)

  const message = [
    'Hola, estoy interesado en este producto de D\' todo 1 poco:',
    `*${product.name}*`,
    prices.length
      ? `Precio: ${prices.join(' / ')}`
      : 'Quisiera consultar el precio.',
    `Producto: ${window.location.href}`,
    '¿Podrían darme más información sobre su disponibilidad y cómo comprarlo?',
  ].join('\n')

  const normalizedPhone = phoneNumber.replace(/\D/g, '')

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

export function buildGeneralWhatsAppUrl(
  phoneNumber: string,
): string {
  const normalizedPhone = phoneNumber.replace(/\D/g, '')

  const message = [
    "¡Hola! Estoy interesado en algunos productos de D' todo 1 poco.",
    'Me gustaría conocer más información sobre los productos que tienen disponibles, sus precios y cómo puedo realizar una compra.',
    '¡Muchas gracias!',
  ].join('\n')

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}
