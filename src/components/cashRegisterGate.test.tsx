import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CASH_REGISTER_STORAGE_KEY } from '../context/cashRegisterStorage'
import { CashRegisterGate } from './cashRegisterGate'

const renderGate = () => {
  return render(
    <CashRegisterGate>
      <div>Login regular</div>
    </CashRegisterGate>
  )
}

const mockFetch = (responses: Array<{ ok: boolean; status?: number; body: unknown }>) => {
  const fetchMock = jest.fn()

  responses.forEach((response) => {
    fetchMock.mockResolvedValueOnce({
      ok: response.ok,
      status: response.status ?? 200,
      json: async () => response.body
    })
  })

  global.fetch = fetchMock as jest.Mock
  return fetchMock
}

beforeEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
})

test('continues to regular login when nombreCaja already exists', async () => {
  const fetchMock = mockFetch([])
  localStorage.setItem(CASH_REGISTER_STORAGE_KEY, 'Caja 1')

  renderGate()

  expect(await screen.findByText('Login regular')).toBeInTheDocument()
  expect(screen.queryByText('Caja login')).not.toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('shows caja login when nombreCaja does not exist', async () => {
  renderGate()

  expect(await screen.findByText('Caja login')).toBeInTheDocument()
  expect(screen.queryByText('Login regular')).not.toBeInTheDocument()
})

test('loads cash registers for an authorized user and saves selected caja', async () => {
  mockFetch([
    {
      ok: true,
      body: {
        access_token: 'admin-token',
        token_type: 'bearer'
      }
    },
    {
      ok: true,
      body: {
        id: 1,
        username: 'admin',
        fullname: 'Admin',
        birthday: null,
        rfc: null,
        cellphone: null,
        email: null,
        typeUser: 3
      }
    },
    {
      ok: true,
      body: [
        { nombreCaja: 'Caja 1' },
        { nombreCaja: 'Caja 2' }
      ]
    }
  ])

  renderGate()

  fireEvent.change(screen.getByLabelText('Usuario administrador'), {
    target: { value: 'admin' }
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secret' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Validar usuario' }))

  await screen.findByRole('option', { name: 'Caja 1' })

  fireEvent.change(screen.getByLabelText('Caja'), {
    target: { value: 'Caja 2' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar caja' }))

  await waitFor(() => {
    expect(localStorage.getItem(CASH_REGISTER_STORAGE_KEY)).toBe('Caja 2')
  })
  expect(screen.getByText('Login regular')).toBeInTheDocument()
})

test('loads cash registers from compatible API name fields', async () => {
  mockFetch([
    {
      ok: true,
      body: {
        access_token: 'admin-token',
        token_type: 'bearer'
      }
    },
    {
      ok: true,
      body: {
        id: 1,
        username: 'admin',
        fullname: 'Admin',
        birthday: null,
        rfc: null,
        cellphone: null,
        email: null,
        typeUser: 2
      }
    },
    {
      ok: true,
      body: [
        { nombre_caja: 'Caja API snake' },
        { name: 'Caja API name' },
        'Caja API string'
      ]
    }
  ])

  renderGate()

  fireEvent.change(screen.getByLabelText('Usuario administrador'), {
    target: { value: 'admin' }
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secret' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Validar usuario' }))

  expect(await screen.findByRole('option', { name: 'Caja API snake' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Caja API name' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Caja API string' })).toBeInTheDocument()
})

test('reports unexpected cash register item shape', async () => {
  mockFetch([
    {
      ok: true,
      body: {
        access_token: 'admin-token',
        token_type: 'bearer'
      }
    },
    {
      ok: true,
      body: {
        id: 1,
        username: 'admin',
        fullname: 'Admin',
        birthday: null,
        rfc: null,
        cellphone: null,
        email: null,
        typeUser: 1
      }
    },
    {
      ok: true,
      body: [
        { id: 1, caja: 123 }
      ]
    }
  ])

  renderGate()

  fireEvent.change(screen.getByLabelText('Usuario administrador'), {
    target: { value: 'admin' }
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secret' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Validar usuario' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'La API devolvió cajas, pero ninguna incluye un nombre válido.'
  )
})

test('rejects users without admin privileges', async () => {
  mockFetch([
    {
      ok: true,
      body: {
        access_token: 'user-token',
        token_type: 'bearer'
      }
    },
    {
      ok: true,
      body: {
        id: 1,
        username: 'cashier',
        fullname: 'Cashier',
        birthday: null,
        rfc: null,
        cellphone: null,
        email: null,
        typeUser: 4
      }
    }
  ])

  renderGate()

  fireEvent.change(screen.getByLabelText('Usuario administrador'), {
    target: { value: 'cashier' }
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secret' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Validar usuario' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'El usuario no tiene permisos para configurar la caja.'
  )
  expect(screen.queryByText('Login regular')).not.toBeInTheDocument()
})

test('blocks continuing when the cash register list is empty', async () => {
  mockFetch([
    {
      ok: true,
      body: {
        access_token: 'admin-token',
        token_type: 'bearer'
      }
    },
    {
      ok: true,
      body: {
        id: 1,
        username: 'admin',
        fullname: 'Admin',
        birthday: null,
        rfc: null,
        cellphone: null,
        email: null,
        typeUser: 1
      }
    },
    {
      ok: true,
      body: []
    }
  ])

  renderGate()

  fireEvent.change(screen.getByLabelText('Usuario administrador'), {
    target: { value: 'admin' }
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secret' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Validar usuario' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'No hay cajas registradas disponibles.'
  )
  expect(screen.getByRole('button', { name: 'Guardar caja' })).toBeDisabled()
})
