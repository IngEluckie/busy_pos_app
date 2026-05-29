export const CASH_REGISTER_STORAGE_KEY = 'nombreCaja'

export const getStoredCashRegisterName = () => {
  return localStorage.getItem(CASH_REGISTER_STORAGE_KEY)?.trim() || null
}
