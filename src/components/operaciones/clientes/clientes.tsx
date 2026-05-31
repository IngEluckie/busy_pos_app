import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import './style.css'
import { Modal } from '../../ventanaModal/modal'
import { useSession } from '../../../context/SessionContext'

type ClientAction = {
  id: 'agregar' | 'editar' | 'recargar' | 'eliminar' | 'historial' | 'estado-cuenta' | 'credito' | 'exportar'
  label: string
  shortcut: string
  icon: string
  ariaLabel: string
}

type ClientColumn = {
  id: string
  label: string
  className?: string
}

type Customer = {
  id: string
  userId: number | null
  displayName: string
  cellphone: string | null
  email: string | null
  rfc: string | null
  address: string | null
  taxRegime: string | null
  credit: number
  notes: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type CustomerListResponse = {
  items: Customer[]
  page: number
  limit: number
  total: number
}

type CustomerFormState = {
  displayName: string
  cellphone: string
  email: string
  rfc: string
  address: string
  taxRegime: string
  credit: string
  notes: string
}

type ApiRequestOptions = {
  apiBaseUrl: string
  tokenType: string
  accessToken: string
}

const clientActions: ClientAction[] = [
  { id: 'agregar', label: 'Agregar', shortcut: '(F3)', icon: '+', ariaLabel: 'Agregar cliente' },
  { id: 'editar', label: 'Editar', shortcut: '(F4)', icon: '✎', ariaLabel: 'Editar cliente' },
  { id: 'recargar', label: 'Recargar', shortcut: '(F5)', icon: '↻', ariaLabel: 'Recargar clientes' },
  { id: 'eliminar', label: 'Eliminar', shortcut: '(F6)', icon: '✖', ariaLabel: 'Eliminar cliente' },
  { id: 'historial', label: 'Historial', shortcut: '(F7)', icon: '◷', ariaLabel: 'Ver historial del cliente' },
  { id: 'estado-cuenta', label: 'Estado de cuenta', shortcut: '(F8)', icon: '▤', ariaLabel: 'Ver estado de cuenta' },
  { id: 'credito', label: 'Crédito', shortcut: '(F9)', icon: '$', ariaLabel: 'Gestionar crédito' },
  { id: 'exportar', label: 'Exportar', shortcut: '(Ctrl + E)', icon: '▣', ariaLabel: 'Exportar clientes' },
]

const clientColumns: ClientColumn[] = [
  { id: 'numero', label: 'No. Cliente', className: 'clientes-ui__results-cell--number' },
  { id: 'nombre', label: 'Nombre / Representante', className: 'clientes-ui__results-cell--name' },
  { id: 'telefono', label: 'Tel / Cel', className: 'clientes-ui__results-cell--phone' },
  { id: 'tipo', label: 'Tipo', className: 'clientes-ui__results-cell--type' },
  { id: 'credito', label: 'Crédito', className: 'clientes-ui__results-cell--money' },
  { id: 'saldo', label: 'Saldo', className: 'clientes-ui__results-cell--money' },
  { id: 'huella', label: 'Huella', className: 'clientes-ui__results-cell--status' },
  { id: 'foto', label: 'Foto', className: 'clientes-ui__results-cell--status' },
  { id: 'estado', label: 'Estado', className: 'clientes-ui__results-cell--state' },
]

const CLIENTS_PER_PAGE = 20
const DEFAULT_CUSTOMER_DISPLAY_NAME = 'Público en general'

const createEmptyCustomerForm = (): CustomerFormState => ({
  displayName: DEFAULT_CUSTOMER_DISPLAY_NAME,
  cellphone: '',
  email: '',
  rfc: '',
  address: '',
  taxRegime: '',
  credit: '0',
  notes: '',
})

const createCustomerFormFromCustomer = (customer: Customer): CustomerFormState => ({
  displayName: customer.displayName,
  cellphone: customer.cellphone ?? '',
  email: customer.email ?? '',
  rfc: customer.rfc ?? '',
  address: customer.address ?? '',
  taxRegime: customer.taxRegime ?? '',
  credit: String(customer.credit),
  notes: customer.notes,
})

const formatCurrency = (value: number) => (
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
)

const formatDate = (value: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getShortCustomerId = (id: string) => id.slice(0, 8).toUpperCase()

const getApiErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json() as { detail?: unknown }

    if (typeof payload.detail === 'string') {
      const messages: Record<string, string> = {
        'Not authorized to read customers': 'No tienes permisos para consultar clientes.',
        'Not authorized to manage customers': 'No tienes permisos para administrar clientes.',
        'Customer not found': 'El cliente ya no existe.',
        'Customer user does not exist': 'El usuario vinculado no existe.',
        'Customer user must have type customer': 'El usuario vinculado debe ser de tipo cliente.',
        'Customer user is already linked': 'Ese usuario ya está vinculado a otro cliente.',
        'Customer could not be created': 'No fue posible crear el cliente.',
        'Customer could not be updated': 'No fue posible actualizar el cliente.',
      }

      return messages[payload.detail] ?? payload.detail
    }
  } catch {
    return 'No fue posible completar la operación.'
  }

  if (response.status === 401) {
    return 'La sesión expiró. Inicia sesión de nuevo.'
  }

  if (response.status === 403) {
    return 'No tienes permisos para administrar clientes.'
  }

  if (response.status === 422) {
    return 'Revisa los datos capturados del cliente.'
  }

  return 'No fue posible completar la operación.'
}

const requestClientesApi = async <T,>(
  options: ApiRequestOptions,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${options.apiBaseUrl}/clientes${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
        Authorization: `${options.tokenType} ${options.accessToken}`,
      },
    })
  } catch {
    throw new Error('No fue posible conectar con la API.')
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return response.json() as Promise<T>
}

const toCustomerPayload = (form: CustomerFormState) => {
  const credit = Number(form.credit || 0)

  return {
    displayName: form.displayName.trim(),
    cellphone: form.cellphone.trim() || null,
    email: form.email.trim() || null,
    rfc: form.rfc.trim().toUpperCase() || null,
    address: form.address.trim() || null,
    taxRegime: form.taxRegime.trim() || null,
    credit: Number.isFinite(credit) ? credit : 0,
    notes: form.notes.trim(),
  }
}

export const Clientes = () => {
  const {
    accessToken,
    apiBaseUrl,
    isBootstrapping,
    isAuthenticated,
    tokenType,
  } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isSavingCustomer, setIsSavingCustomer] = useState(false)
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [openActionId, setOpenActionId] = useState<ClientAction['id'] | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerFormState>(createEmptyCustomerForm)

  const canUseApi = isAuthenticated && Boolean(accessToken && tokenType)
  const apiRequestOptions = accessToken && tokenType
    ? { accessToken, apiBaseUrl, tokenType }
    : null
  const totalPages = Math.ceil(totalCustomers / CLIENTS_PER_PAGE)
  const currentPageLabel = totalPages === 0 ? 0 : currentPage
  const selectedCustomer = useMemo(() => (
    customers.find((customer) => customer.id === selectedCustomerId) ?? null
  ), [customers, selectedCustomerId])
  const canGoToPreviousPage = totalPages > 0 && currentPage > 1
  const canGoToNextPage = totalPages > 0 && currentPage < totalPages
  const isCustomerModalOpen = openActionId === 'agregar' || openActionId === 'editar'
  const resultsEmptyMessage = isLoadingCustomers
    ? 'Cargando clientes...'
    : apiError ?? 'Sin coincidencias para mostrar.'

  const fetchCustomers = useCallback(async (page: number, query: string) => {
    if (isBootstrapping) {
      return
    }

    if (!accessToken || !tokenType) {
      setCustomers([])
      setTotalCustomers(0)
      setApiError('Inicia sesión para consultar clientes.')

      return
    }

    setIsLoadingCustomers(true)
    setApiError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(CLIENTS_PER_PAGE),
      })
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      }

      const response = await requestClientesApi<CustomerListResponse>(
        { accessToken, apiBaseUrl, tokenType },
        `/recargar?${params.toString()}`,
      )
      const nextTotalPages = Math.ceil(response.total / CLIENTS_PER_PAGE)

      setCustomers(response.items)
      setTotalCustomers(response.total)
      setSelectedCustomerId((currentSelectedCustomerId) => (
        currentSelectedCustomerId && !response.items.some((customer) => customer.id === currentSelectedCustomerId)
          ? null
          : currentSelectedCustomerId
      ))

      if (response.total === 0 && page !== 1) {
        setCurrentPage(1)
      }

      if (nextTotalPages > 0 && page > nextTotalPages) {
        setCurrentPage(nextTotalPages)
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible cargar clientes.')
    } finally {
      setIsLoadingCustomers(false)
    }
  }, [accessToken, apiBaseUrl, isBootstrapping, tokenType])

  useEffect(() => {
    fetchCustomers(currentPage, activeSearchQuery)
  }, [activeSearchQuery, currentPage, fetchCustomers])

  const reloadCurrentCustomers = () => {
    fetchCustomers(currentPage, activeSearchQuery)
  }

  const handleSearchCustomers = () => {
    setSelectedCustomerId(null)
    setActiveSearchQuery(searchQuery.trim())
    setCurrentPage(1)
  }

  const openCreateCustomerModal = () => {
    setCustomerForm(createEmptyCustomerForm())
    setFormError(null)
    setOpenActionId('agregar')
  }

  const openEditCustomerModal = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setCustomerForm(createCustomerFormFromCustomer(customer))
    setFormError(null)
    setOpenActionId('editar')
  }

  const handleOpenAction = (actionId: ClientAction['id']) => {
    if ((actionId === 'agregar' || actionId === 'editar' || actionId === 'eliminar') && !canUseApi) {
      setModalError('Inicia sesión para administrar clientes.')

      return
    }

    if (actionId === 'agregar') {
      openCreateCustomerModal()

      return
    }

    if (actionId === 'recargar') {
      reloadCurrentCustomers()

      return
    }

    if (actionId === 'editar') {
      if (!selectedCustomer) {
        setModalError('No se ha seleccionado cliente.')

        return
      }

      openEditCustomerModal(selectedCustomer)

      return
    }

    if (actionId === 'eliminar') {
      if (!selectedCustomer) {
        setModalError('No se ha seleccionado cliente.')

        return
      }

      setOpenActionId('eliminar')

      return
    }

    setModalError('Esta acción todavía no está disponible.')
  }

  const handleCloseActionModal = () => {
    if (isSavingCustomer || isDeletingCustomer) {
      return
    }

    setOpenActionId(null)
    setFormError(null)
  }

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages || 1, page + 1))
  }

  const updateCustomerForm = (field: keyof CustomerFormState, value: string) => {
    setCustomerForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setFormError(null)
  }

  const handleSubmitCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!apiRequestOptions) {
      setFormError('Inicia sesión para administrar clientes.')

      return
    }

    const payload = toCustomerPayload(customerForm)

    if (!payload.displayName) {
      setFormError('El nombre del cliente es obligatorio.')

      return
    }

    if (payload.credit < 0) {
      setFormError('El crédito debe ser mayor o igual a 0.')

      return
    }

    setIsSavingCustomer(true)
    setFormError(null)
    setApiError(null)

    try {
      const savedCustomer = await requestClientesApi<Customer>(
        apiRequestOptions,
        openActionId === 'editar' && selectedCustomer
          ? `/${selectedCustomer.id}/editar`
          : '/agregar',
        {
          method: openActionId === 'editar' ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      setSelectedCustomerId(savedCustomer.id)
      setOpenActionId(null)

      if (openActionId === 'agregar') {
        setCurrentPage(1)
        fetchCustomers(1, activeSearchQuery)
      } else {
        setCustomers((currentCustomers) => (
          currentCustomers.map((customer) => (
            customer.id === savedCustomer.id ? savedCustomer : customer
          ))
        ))
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No fue posible guardar el cliente.')
    } finally {
      setIsSavingCustomer(false)
    }
  }

  const handleDeleteCustomer = async () => {
    if (!apiRequestOptions || !selectedCustomer) {
      setModalError('No se ha seleccionado cliente.')

      return
    }

    setIsDeletingCustomer(true)
    setModalError(null)
    setApiError(null)

    try {
      await requestClientesApi<{ message: string; id: string }>(
        apiRequestOptions,
        `/${selectedCustomer.id}/eliminar`,
        { method: 'DELETE' },
      )

      setSelectedCustomerId(null)
      setOpenActionId(null)

      const nextTotalCustomers = Math.max(0, totalCustomers - 1)
      const nextTotalPages = Math.ceil(nextTotalCustomers / CLIENTS_PER_PAGE)
      const nextPage = Math.max(1, Math.min(currentPage, nextTotalPages || 1))

      setTotalCustomers(nextTotalCustomers)
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage)
      } else {
        fetchCustomers(nextPage, activeSearchQuery)
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'No fue posible eliminar el cliente.')
    } finally {
      setIsDeletingCustomer(false)
    }
  }

  return (
    <section className='clientes-ui'>
      <header className='clientes-ui__topbar' aria-label='Acciones de clientes'>
        {clientActions.map((action) => (
          <button
            key={action.id}
            aria-label={action.ariaLabel}
            className={`clientes-ui__top-action clientes-ui__top-action--${action.id}`}
            disabled={isLoadingCustomers || isSavingCustomer || isDeletingCustomer}
            onClick={() => handleOpenAction(action.id)}
            type='button'
          >
            <span className='clientes-ui__top-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='clientes-ui__top-text'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
      </header>

      <div className='clientes-ui__main-wrap'>
        <div className='clientes-ui__main'>
          <section className='clientes-ui__left-column' aria-label='Listado de clientes'>
            <div className='clientes-ui__search-row'>
              <button type='button' className='clientes-ui__search-filter' aria-label='Filtrar búsqueda'>
                ⌄
              </button>
              <input
                className='clientes-ui__search-input'
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearchCustomers()
                  }
                }}
                placeholder='Buscar por nombre, teléfono, RFC, email o dirección.'
                type='text'
                value={searchQuery}
              />
              <button
                type='button'
                className='clientes-ui__search-button'
                aria-label='Buscar cliente'
                disabled={isLoadingCustomers}
                onClick={handleSearchCustomers}
              >
                ⌕
              </button>
            </div>

            <div className='clientes-ui__results'>
              <div className='clientes-ui__results-head' role='row'>
                {clientColumns.map((column) => (
                  <div
                    key={column.id}
                    className={`clientes-ui__results-cell ${column.className ?? ''}`}
                    role='columnheader'
                  >
                    {column.label}
                  </div>
                ))}
              </div>

              <div className='clientes-ui__results-body' role='rowgroup'>
                {customers.length === 0 ? (
                  <div className='clientes-ui__results-empty'>
                    <span className='clientes-ui__empty-icon' aria-hidden='true'>
                      ▱
                    </span>
                    <p>{resultsEmptyMessage}</p>
                    {!apiError && !isLoadingCustomers ? <p>Utiliza “Agregar (F3)” para registrar un nuevo cliente.</p> : null}
                  </div>
                ) : (
                  customers.map((customer) => {
                    const isSelected = selectedCustomerId === customer.id

                    return (
                      <div
                        aria-selected={isSelected}
                        className={`clientes-ui__results-row ${isSelected ? 'clientes-ui__results-row--selected' : ''}`}
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        onDoubleClick={() => openEditCustomerModal(customer)}
                        role='row'
                      >
                        <div className='clientes-ui__results-data clientes-ui__results-cell--number' role='cell'>
                          {getShortCustomerId(customer.id)}
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--name' role='cell'>
                          <strong>{customer.displayName}</strong>
                          <span>{customer.email ?? customer.address ?? '-'}</span>
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--phone' role='cell'>
                          {customer.cellphone ?? '-'}
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--type' role='cell'>
                          Cliente
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--money' role='cell'>
                          {formatCurrency(customer.credit)}
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--money' role='cell'>
                          {formatCurrency(0)}
                        </div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--status' role='cell'>-</div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--status' role='cell'>-</div>
                        <div className='clientes-ui__results-data clientes-ui__results-cell--state' role='cell'>
                          {customer.isActive ? 'Activo' : 'Inactivo'}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <footer className='clientes-ui__pagination'>
              <button
                className='clientes-ui__page-arrow'
                type='button'
                aria-label='Página anterior'
                disabled={!canGoToPreviousPage}
                onClick={handlePreviousPage}
              >
                ◀
              </button>
              <div className='clientes-ui__page-meta'>
                <span className='clientes-ui__page-label'>Página</span>
                <input className='clientes-ui__page-input' type='text' value={currentPageLabel} readOnly />
                <span className='clientes-ui__page-separator'>de</span>
                <input className='clientes-ui__page-input' type='text' value={totalPages} readOnly />
              </div>
              <button
                className='clientes-ui__page-arrow'
                type='button'
                aria-label='Página siguiente'
                disabled={!canGoToNextPage}
                onClick={handleNextPage}
              >
                ▶
              </button>
            </footer>
          </section>

          <aside className='clientes-ui__right-column' aria-label='Cliente seleccionado'>
            <h2 className='clientes-ui__detail-title'>Cliente seleccionado</h2>

            <div className='clientes-ui__right-scroll'>
              <div className='clientes-ui__detail-card'>
                <div className='clientes-ui__profile'>
                  <div className='clientes-ui__avatar' aria-hidden='true'>
                    <span className='clientes-ui__avatar-head' />
                    <span className='clientes-ui__avatar-body' />
                  </div>
                  <p className='clientes-ui__profile-empty'>
                    {selectedCustomer?.displayName ?? 'Seleccione un cliente'}
                    <span>{selectedCustomer ? selectedCustomer.email ?? selectedCustomer.cellphone ?? 'Sin contacto capturado' : 'para ver su información'}</span>
                  </p>
                </div>

                <div className='clientes-ui__info'>
                  <dl className='clientes-ui__info-section'>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>♟</span>Tipo de cliente:</dt>
                      <dd>Cliente</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>$</span>Crédito:</dt>
                      <dd>{selectedCustomer ? formatCurrency(selectedCustomer.credit) : '-'}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>☎</span>Teléfono:</dt>
                      <dd>{selectedCustomer?.cellphone ?? '-'}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>▣</span>RFC:</dt>
                      <dd>{selectedCustomer?.rfc ?? '-'}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>◆</span>Dirección:</dt>
                      <dd>{selectedCustomer?.address ?? '-'}</dd>
                    </div>
                  </dl>
                  <dl className='clientes-ui__info-section'>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>◆</span>Régimen fiscal:</dt>
                      <dd>{selectedCustomer?.taxRegime ?? '-'}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>$</span>Saldo actual:</dt>
                      <dd>{formatCurrency(0)}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>▰</span>Crédito disponible:</dt>
                      <dd>{selectedCustomer ? formatCurrency(selectedCustomer.credit) : '-'}</dd>
                    </div>
                  </dl>
                  <dl className='clientes-ui__info-section'>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>▦</span>Fecha de registro:</dt>
                      <dd>{selectedCustomer ? formatDate(selectedCustomer.createdAt) : '-'}</dd>
                    </div>
                    <div className='clientes-ui__info-row'>
                      <dt><span aria-hidden='true'>▦</span>Última actualización:</dt>
                      <dd>{selectedCustomer ? formatDate(selectedCustomer.updatedAt) : '-'}</dd>
                    </div>
                  </dl>
                </div>

                <div className='clientes-ui__summary-grid'>
                  <div className='clientes-ui__summary-card'>
                    <span className='clientes-ui__summary-icon' aria-hidden='true'>▤</span>
                    <strong>{selectedCustomer ? '0' : '-'}</strong>
                    <span>Compras</span>
                  </div>
                  <div className='clientes-ui__summary-card clientes-ui__summary-card--saldo'>
                    <span className='clientes-ui__summary-icon' aria-hidden='true'>▰</span>
                    <strong>{selectedCustomer ? formatCurrency(0) : '-'}</strong>
                    <span>Saldo</span>
                  </div>
                  <div className='clientes-ui__summary-card clientes-ui__summary-card--credito'>
                    <span className='clientes-ui__summary-icon' aria-hidden='true'>▭</span>
                    <strong>{selectedCustomer ? formatCurrency(selectedCustomer.credit) : '-'}</strong>
                    <span>Crédito disponible</span>
                  </div>
                </div>
              </div>

            </div>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={handleCloseActionModal}
        title={openActionId === 'editar' ? 'Editar cliente' : 'Agregar cliente'}
        width='min(92vw, 760px)'
      >
        <form className='clientes-ui__form' onSubmit={handleSubmitCustomer}>
          <div className='clientes-ui__form-grid'>
            <label className='clientes-ui__field clientes-ui__field--wide'>
              <span>Nombre / representante *</span>
              <input
                autoFocus
                onChange={(event) => updateCustomerForm('displayName', event.target.value)}
                required
                type='text'
                value={customerForm.displayName}
              />
            </label>
            <label className='clientes-ui__field'>
              <span>Teléfono / celular</span>
              <input
                onChange={(event) => updateCustomerForm('cellphone', event.target.value)}
                type='tel'
                value={customerForm.cellphone}
              />
            </label>
            <label className='clientes-ui__field'>
              <span>Email</span>
              <input
                onChange={(event) => updateCustomerForm('email', event.target.value)}
                type='email'
                value={customerForm.email}
              />
            </label>
            <label className='clientes-ui__field'>
              <span>RFC</span>
              <input
                onChange={(event) => updateCustomerForm('rfc', event.target.value)}
                type='text'
                value={customerForm.rfc}
              />
            </label>
            <label className='clientes-ui__field'>
              <span>Régimen fiscal</span>
              <input
                onChange={(event) => updateCustomerForm('taxRegime', event.target.value)}
                type='text'
                value={customerForm.taxRegime}
              />
            </label>
            <label className='clientes-ui__field'>
              <span>Crédito</span>
              <input
                min='0'
                onChange={(event) => updateCustomerForm('credit', event.target.value)}
                step='0.01'
                type='number'
                value={customerForm.credit}
              />
            </label>
            <label className='clientes-ui__field clientes-ui__field--wide'>
              <span>Dirección</span>
              <input
                onChange={(event) => updateCustomerForm('address', event.target.value)}
                type='text'
                value={customerForm.address}
              />
            </label>
            <label className='clientes-ui__field clientes-ui__field--wide'>
              <span>Notas</span>
              <textarea
                onChange={(event) => updateCustomerForm('notes', event.target.value)}
                rows={3}
                value={customerForm.notes}
              />
            </label>
          </div>

          {formError ? <p className='clientes-ui__form-error'>{formError}</p> : null}

          <div className='clientes-ui__modal-actions'>
            <button className='clientes-ui__modal-button' disabled={isSavingCustomer} onClick={handleCloseActionModal} type='button'>
              Cancelar
            </button>
            <button className='clientes-ui__modal-button clientes-ui__modal-button--primary' disabled={isSavingCustomer} type='submit'>
              {isSavingCustomer ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={openActionId === 'eliminar'}
        onClose={handleCloseActionModal}
        title='Eliminar cliente'
        width='min(92vw, 460px)'
      >
        <div className='clientes-ui__confirm'>
          <p>
            {selectedCustomer
              ? `Se dará de baja a ${selectedCustomer.displayName}.`
              : 'No se ha seleccionado cliente.'}
          </p>
          {modalError ? <p className='clientes-ui__form-error'>{modalError}</p> : null}
          <div className='clientes-ui__modal-actions'>
            <button className='clientes-ui__modal-button' disabled={isDeletingCustomer} onClick={handleCloseActionModal} type='button'>
              Cancelar
            </button>
            <button
              className='clientes-ui__modal-button clientes-ui__modal-button--danger'
              disabled={isDeletingCustomer || !selectedCustomer}
              onClick={handleDeleteCustomer}
              type='button'
            >
              {isDeletingCustomer ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(modalError) && openActionId !== 'eliminar'}
        onClose={() => setModalError(null)}
        title='Clientes'
        width='min(92vw, 420px)'
      >
        <div className='clientes-ui__confirm'>
          <p>{modalError}</p>
          <div className='clientes-ui__modal-actions'>
            <button className='clientes-ui__modal-button clientes-ui__modal-button--primary' onClick={() => setModalError(null)} type='button'>
              Aceptar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
