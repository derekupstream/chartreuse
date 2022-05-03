// "Friday, Jul 2, 2021"
export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-us', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
}

// "7/2/2021"
export function formatDateShort(date: Date) {
  return new Date().toLocaleDateString()
}
