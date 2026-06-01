import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { CASH_REGISTER_STORAGE_KEY } from '../../../context/cashRegisterStorage'
import { useSession } from '../../../context/SessionContext'
import { HELD_SALES_STORAGE_KEY, InterfazVentas } from './interfazVentas'

jest.mock('../../../context/SessionContext', () => ({
  useSession: jest.fn()
}))

const mockUseSession = useSession as jest.Mock

const productBase = {
  productId: 'prod-1',
  variationId: null,
  productType: 'simple',
  sku: 'SKU-1',
  name: 'Cafe americano',
  displayName: 'Cafe americano',
  regularPrice: 35,
  salePrice: null,
  price: 35,
  currency: 'MXN',
  image: null,
  images: [],
  attributes: [],
  trackingMode: 'tracked',
  quantity: 12,
  stockStatus: 'in_stock'
}

const renderVentas = () => {
  mockUseSession.mockReturnValue({
    accessToken: 'token',
    apiBaseUrl: 'https://api.example.test',
    isBootstrapping: false,
    tokenType: 'bearer',
    user: {
      id: 7,
      username: 'cajero',
      fullname: 'Cajero Uno',
      birthday: null,
      rfc: null,
      cellphone: null,
      email: null,
      typeUser: 2
    }
  })

  return render(<InterfazVentas />)
}

const mockProductSearch = (displayName = 'Cafe americano', price = 35) => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      items: [
        {
          ...productBase,
          productId: `prod-${displayName}`,
          sku: `SKU-${displayName}`,
          name: displayName,
          displayName,
          regularPrice: price,
          price
        }
      ],
      query: displayName,
      limit: 20,
      total: 1
    })
  })

  global.fetch = fetchMock as jest.Mock
  return fetchMock
}

const addProductToSale = async (displayName = 'Cafe americano', price = 35) => {
  mockProductSearch(displayName, price)

  fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o SKU'), {
    target: { value: displayName }
  })

  const productOption = await screen.findByRole('option', { name: new RegExp(displayName, 'i') })
  fireEvent.click(productOption)

  await waitFor(() => {
    expect(screen.queryByRole('option', { name: new RegExp(displayName, 'i') })).not.toBeInTheDocument()
  })
  expect(screen.getByText(displayName)).toBeInTheDocument()
}

const getHeldSales = () => JSON.parse(localStorage.getItem(HELD_SALES_STORAGE_KEY) || '[]')

beforeEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
  localStorage.setItem(CASH_REGISTER_STORAGE_KEY, 'Caja 1')
})

test('guarda la primera venta en espera y limpia la interfaz', async () => {
  renderVentas()
  await addProductToSale()

  expect(screen.getByText('Cafe americano')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))

  await waitFor(() => {
    expect(screen.queryByText('Cafe americano')).not.toBeInTheDocument()
  })

  const heldSales = getHeldSales()
  expect(heldSales).toHaveLength(1)
  expect(heldSales[0]).toMatchObject({
    status: 'on_hold',
    cashRegister: { name: 'Caja 1' },
    seller: {
      id: 7,
      username: 'cajero',
      fullname: 'Cajero Uno',
      displayName: 'Cajero Uno',
      source: 'authenticated_user'
    },
    customer: { id: null, displayName: 'Público en General' },
    totals: {
      subtotal: 35,
      discountTotal: 0,
      grandTotal: 35
    }
  })
})

test('permite ajustar el vendedor y guarda ese dato en la venta en espera', async () => {
  renderVentas()

  expect(screen.getByLabelText('Vendedor')).toHaveValue('Cajero Uno')

  fireEvent.change(screen.getByLabelText('Vendedor'), {
    target: { value: 'Vendedora mostrador' }
  })
  await addProductToSale()

  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))

  await waitFor(() => expect(getHeldSales()).toHaveLength(1))
  expect(getHeldSales()[0].seller).toMatchObject({
    id: null,
    username: null,
    fullname: 'Vendedora mostrador',
    displayName: 'Vendedora mostrador',
    source: 'manual'
  })
})

test('guarda una venta adicional y abre el modal con las ventas en espera', async () => {
  renderVentas()
  await addProductToSale('Cafe americano', 35)
  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))
  await waitFor(() => expect(getHeldSales()).toHaveLength(1))

  await addProductToSale('Pan dulce', 18)
  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))

  const dialog = await screen.findByRole('dialog', { name: 'Ventas en espera' })
  expect(within(dialog).getAllByRole('button', { name: 'Restaurar' })).toHaveLength(2)
  expect(within(dialog).getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2)
  expect(getHeldSales()).toHaveLength(2)
})

test('restaura una venta y la elimina del localStorage', async () => {
  renderVentas()
  await addProductToSale('Cafe americano', 35)
  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))
  await waitFor(() => expect(getHeldSales()).toHaveLength(1))

  await waitFor(() => {
    expect(screen.queryByText('Cafe americano')).not.toBeInTheDocument()
  })

  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Ventas en espera' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Restaurar' }))

  expect(await screen.findByText('Cafe americano')).toBeInTheDocument()
  expect(getHeldSales()).toHaveLength(0)
  expect(screen.queryByRole('dialog', { name: 'Ventas en espera' })).not.toBeInTheDocument()
})

test('elimina una venta desde el modal y actualiza el localStorage', async () => {
  renderVentas()
  await addProductToSale('Cafe americano', 35)
  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))
  await waitFor(() => expect(getHeldSales()).toHaveLength(1))

  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Ventas en espera' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }))

  expect(getHeldSales()).toHaveLength(0)
  expect(screen.queryByRole('dialog', { name: 'Ventas en espera' })).not.toBeInTheDocument()
})

test('no crea ventas vacias al presionar espera sin productos', () => {
  renderVentas()

  fireEvent.click(screen.getByRole('button', { name: /Espera \(Alt\+E\)/ }))

  expect(getHeldSales()).toHaveLength(0)
  expect(screen.queryByRole('dialog', { name: 'Ventas en espera' })).not.toBeInTheDocument()
})
