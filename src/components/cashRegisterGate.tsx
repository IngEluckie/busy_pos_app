import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import {
  CASH_REGISTER_STORAGE_KEY,
  getStoredCashRegisterName
} from '../context/cashRegisterStorage'
import { getLocationContext } from '../context/sessionLocation'
import type { SessionUser } from '../context/SessionContext'
import './cashRegisterGate.css'

const ADMIN_MAX_TYPE_USER = 3

type CashRegister = {
  nombreCaja: string
}

type CashRegisterApiItem = {
  nombreCaja?: unknown
  nombre_caja?: unknown
  nombre?: unknown
  name?: unknown
}

type TokenResponse = {
  access_token: string
  token_type: string
}

type CashRegisterGateStatus = 'checking' | 'needs-selection' | 'ready'

const requestUserInfo = async (
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string
): Promise<SessionUser> => {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: {
      Authorization: `${tokenType} ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('No fue posible validar el usuario administrador.')
  }

  return response.json() as Promise<SessionUser>
}

const normalizeCashRegister = (cashRegister: unknown): CashRegister | null => {
  if (typeof cashRegister === 'string') {
    const nombreCaja = cashRegister.trim()
    return nombreCaja ? { nombreCaja } : null
  }

  if (!cashRegister || typeof cashRegister !== 'object') {
    return null
  }

  const item = cashRegister as CashRegisterApiItem
  const rawName = item.nombreCaja ?? item.nombre_caja ?? item.nombre ?? item.name

  if (typeof rawName !== 'string') {
    return null
  }

  const nombreCaja = rawName.trim()
  return nombreCaja ? { nombreCaja } : null
}

const requestCashRegisters = async (
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string
): Promise<CashRegister[]> => {
  const response = await fetch(`${apiBaseUrl}/systemconf/cash-registers`, {
    headers: {
      Authorization: `${tokenType} ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('No fue posible cargar las cajas registradas.')
  }

  const cashRegisters = await response.json()

  if (!Array.isArray(cashRegisters)) {
    throw new Error('La API no devolvió una lista de cajas válida.')
  }

  if (cashRegisters.length === 0) {
    return []
  }

  const normalizedCashRegisters = cashRegisters
    .map(normalizeCashRegister)
    .filter((cashRegister): cashRegister is CashRegister => Boolean(cashRegister))

  if (normalizedCashRegisters.length === 0) {
    throw new Error('La API devolvió cajas, pero ninguna incluye un nombre válido.')
  }

  return normalizedCashRegisters
}

const CajaLogin = ({ onCashRegisterSaved }: { onCashRegisterSaved: () => void }) => {
  const { apiBaseUrl } = useMemo(getLocationContext, [])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [selectedCashRegister, setSelectedCashRegister] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const hasCashRegisters = cashRegisters.length > 0

  const handleAuthenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setCashRegisters([])
    setSelectedCashRegister('')
    setIsAuthenticating(true)

    try {
      const credentials = new URLSearchParams()
      credentials.set('username', username.trim())
      credentials.set('password', password)

      let response: Response

      try {
        response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: credentials
        })
      } catch {
        throw new Error('No fue posible conectar con la API.')
      }

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          throw new Error('Usuario o contraseña incorrectos.')
        }

        throw new Error('No fue posible autenticar el usuario administrador.')
      }

      const tokenResponse = (await response.json()) as TokenResponse
      const accessToken = tokenResponse.access_token
      const tokenType = tokenResponse.token_type || 'bearer'

      if (!accessToken) {
        throw new Error('La API no devolvió un token de sesión.')
      }

      const sessionUser = await requestUserInfo(apiBaseUrl, tokenType, accessToken)

      if (sessionUser.typeUser > ADMIN_MAX_TYPE_USER) {
        throw new Error('El usuario no tiene permisos para configurar la caja.')
      }

      const nextCashRegisters = await requestCashRegisters(apiBaseUrl, tokenType, accessToken)

      if (nextCashRegisters.length === 0) {
        throw new Error('No hay cajas registradas disponibles.')
      }

      setCashRegisters(nextCashRegisters)
    } catch (nextError) {
      if (nextError instanceof Error) {
        setError(nextError.message)
      } else {
        setError('No fue posible preparar la selección de caja.')
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleSave = () => {
    if (!selectedCashRegister) {
      setError('Selecciona una caja para continuar.')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      localStorage.setItem(CASH_REGISTER_STORAGE_KEY, selectedCashRegister)
      onCashRegisterSaved()
    } catch {
      setError('No fue posible guardar la caja en este navegador.')
      setIsSaving(false)
    }
  }

  return (
    <main className='cash-register-login'>
      <section className='cash-register-login__panel' aria-labelledby='cash-register-login-title'>
        <header className='cash-register-login__header'>
          <h1 className='cash-register-login__title' id='cash-register-login-title'>
            Caja login
          </h1>
          <p className='cash-register-login__subtitle'>
            Autentica un usuario autorizado y selecciona la caja de esta terminal.
          </p>
        </header>

        <form className='cash-register-login__form' onSubmit={handleAuthenticate}>
          <label className='cash-register-login__field'>
            <span className='cash-register-login__label'>Usuario administrador</span>
            <input
              autoComplete='username'
              autoFocus
              className='cash-register-login__input'
              disabled={isAuthenticating || isSaving}
              onChange={(event) => setUsername(event.target.value)}
              required
              type='text'
              value={username}
            />
          </label>

          <label className='cash-register-login__field'>
            <span className='cash-register-login__label'>Contraseña</span>
            <input
              autoComplete='current-password'
              className='cash-register-login__input'
              disabled={isAuthenticating || isSaving}
              onChange={(event) => setPassword(event.target.value)}
              required
              type='password'
              value={password}
            />
          </label>

          <button
            className='cash-register-login__button'
            disabled={isAuthenticating || isSaving}
            type='submit'
          >
            {isAuthenticating ? 'Validando...' : 'Validar usuario'}
          </button>
        </form>

        <div className='cash-register-login__selector'>
          <label className='cash-register-login__field'>
            <span className='cash-register-login__label'>Caja</span>
            <select
              className='cash-register-login__input'
              disabled={!hasCashRegisters || isSaving}
              onChange={(event) => setSelectedCashRegister(event.target.value)}
              value={selectedCashRegister}
            >
              <option value=''>
                {hasCashRegisters ? 'Selecciona una caja' : 'Valida un usuario para cargar cajas'}
              </option>
              {cashRegisters.map((cashRegister) => (
                <option key={cashRegister.nombreCaja} value={cashRegister.nombreCaja}>
                  {cashRegister.nombreCaja}
                </option>
              ))}
            </select>
          </label>

          <button
            className='cash-register-login__button cash-register-login__button--save'
            disabled={!selectedCashRegister || isSaving}
            onClick={handleSave}
            type='button'
          >
            {isSaving ? 'Guardando...' : 'Guardar caja'}
          </button>
        </div>

        {error && (
          <p className='cash-register-login__error' role='alert'>
            {error}
          </p>
        )}

        <p className='cash-register-login__server'>API: {apiBaseUrl}</p>
      </section>
    </main>
  )
}

export const CashRegisterGate = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<CashRegisterGateStatus>('checking')

  useEffect(() => {
    setStatus(getStoredCashRegisterName() ? 'ready' : 'needs-selection')
  }, [])

  if (status === 'checking') {
    return (
      <div className='session-bootstrap'>
        Validando caja...
      </div>
    )
  }

  if (status === 'needs-selection') {
    return <CajaLogin onCashRegisterSaved={() => setStatus('ready')} />
  }

  return <>{children}</>
}
