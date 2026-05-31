import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from '../../../context/SessionContext'
import './style.css'

type ActionButton = {
  id: string
  label: string
  shortcut: string
  icon: string
}

type TableColumn = {
  id: string
  label: string
  className?: string
}

type SaleProductImage = {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
  order: number
  source: 'variation' | 'product'
}

type SaleProductAttribute = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  value: string
}

type SaleProductSearchItem = {
  productId: string
  variationId: string | null
  productType: 'simple' | 'variable'
  sku: string | null
  name: string
  displayName: string
  regularPrice: number
  salePrice: number | null
  price: number
  currency: string
  image: SaleProductImage | null
  images?: SaleProductImage[]
  attributes: SaleProductAttribute[]
  trackingMode: 'tracked' | 'untracked'
  quantity: number | null
  stockStatus: 'in_stock' | 'out_of_stock' | 'backorder'
}

type SaleProductSearchResponse = {
  items: SaleProductSearchItem[]
  query: string
  limit: number
  total: number
}

type SaleLineItem = SaleProductSearchItem & {
  lineId: string
  saleQuantity: number
  activeImageIndex: number
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

const topActions: ActionButton[] = [
  { id: 'buscar', label: 'Buscar', shortcut: '(F2)', icon: '🔎' },
  { id: 'precio', label: 'Precio', shortcut: '(F3)', icon: '$' },
  { id: 'editar', label: 'Editar', shortcut: '(F4)', icon: '✎' },
  { id: 'cantidad', label: 'Cantidad', shortcut: '(F5)', icon: '▥' },
  { id: 'remover', label: 'Remover', shortcut: '(F6)', icon: '⛔' },
  { id: 'descuento', label: 'Desc.', shortcut: '(F7)', icon: '%' },
  { id: 'cajon', label: 'Cajón', shortcut: '(F8)', icon: '▤' },
  { id: 'bascula', label: 'Báscula', shortcut: '(F9)', icon: '⚖' },
  { id: 'importe', label: 'Importe', shortcut: '(F10)', icon: '🧾' },
  { id: 'check', label: 'Check', shortcut: '(F12)', icon: '🛡' },
]

const sideActions: ActionButton[] = [
  { id: 'cerrar', label: 'Cerrar', shortcut: '(ESC)', icon: 'OK' },
  { id: 'doc', label: 'Doc', shortcut: '(Alt+D)', icon: '📄' },
  { id: 'cliente', label: 'Cliente', shortcut: '(Alt+C)', icon: '👤' },
  { id: 'vendedor', label: 'Vend.', shortcut: '(Alt+V)', icon: '👥' },
  { id: 'mcaja', label: 'M.Caja', shortcut: '(Alt+M)', icon: '🏪' },
  { id: 'arap', label: 'A. Ráp', shortcut: '(Alt+A)', icon: '⚡' },
  { id: 'cotiz', label: 'Cotiz.', shortcut: '(Alt+T)', icon: '🧾' },
  { id: 'notac', label: 'Nota Cr.', shortcut: '(Alt+N)', icon: '🧾' },
  { id: 'espera', label: 'Espera', shortcut: '(Alt+E)', icon: '⌛' },
  { id: 'reimprime', label: 'R.', shortcut: '(Alt+R)', icon: '↩' },
]

const tableColumns: TableColumn[] = [
  { id: 'cant', label: 'Cant.', className: 'ventas-ui__col--cant' },
  { id: 'descripcion', label: 'Descripción', className: 'ventas-ui__col--descripcion' },
  { id: 'i', label: 'I', className: 'ventas-ui__col--mini' },
  { id: 'p', label: 'P', className: 'ventas-ui__col--mini' },
  { id: 'c', label: 'C', className: 'ventas-ui__col--mini' },
  { id: 'a', label: 'A', className: 'ventas-ui__col--mini' },
  { id: 'r', label: 'R', className: 'ventas-ui__col--mini' },
  { id: 'l', label: 'L', className: 'ventas-ui__col--mini' },
  { id: 'exis', label: 'Exis', className: 'ventas-ui__col--exis' },
  { id: 'desc', label: '% Desc', className: 'ventas-ui__col--desc' },
  { id: 'precio', label: 'Precio U.', className: 'ventas-ui__col--precio' },
  { id: 'importe', label: 'Importe', className: 'ventas-ui__col--importe' },
]

const formatCurrency = (value: number, currency = 'MXN') => (
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(value)
)

const getLineIdentity = (product: Pick<SaleProductSearchItem, 'productId' | 'variationId'>) => (
  `${product.productId}:${product.variationId ?? 'simple'}`
)

const getProductImages = (product: Pick<SaleProductSearchItem, 'image' | 'images'>): SaleProductImage[] => {
  const images = product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : []

  return [...images].sort((firstImage, secondImage) => (
    Number(secondImage.isPrimary) - Number(firstImage.isPrimary)
    || firstImage.order - secondImage.order
    || firstImage.url.localeCompare(secondImage.url)
  ))
}

const resolveApiUrl = (apiBaseUrl: string, path: string) => {
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }

  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

const requestVentasApi = async <T,>(
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/ventas${path}`, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new Error('No fue posible conectar con la API.')
  }

  if (!response.ok) {
    throw new Error('No fue posible buscar productos.')
  }

  return response.json() as Promise<T>
}

const requestClientesApi = async <T,>(
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}/clientes${path}`, {
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new Error('No fue posible conectar con la API.')
  }

  if (!response.ok) {
    throw new Error('No fue posible buscar clientes.')
  }

  return response.json() as Promise<T>
}

const requestProductImageObjectUrl = async (
  apiBaseUrl: string,
  tokenType: string,
  accessToken: string,
  imageUrl: string,
) => {
  const response = await fetch(resolveApiUrl(apiBaseUrl, imageUrl), {
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('No fue posible cargar la imagen del producto.')
  }

  return URL.createObjectURL(await response.blob())
}

export const InterfazVentas = () => {
  const {
    accessToken,
    apiBaseUrl,
    isBootstrapping,
    tokenType,
  } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SaleProductSearchItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('Público en General')
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([])
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)
  const [customerSearchError, setCustomerSearchError] = useState<string | null>(null)
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false)
  const [saleItems, setSaleItems] = useState<SaleLineItem[]>([])
  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const [imageObjectUrls, setImageObjectUrls] = useState<Record<string, string>>({})
  const requestedImageIdsRef = useRef(new Set<string>())
  const fetchedObjectUrlsRef = useRef<string[]>([])
  const trimmedSearchQuery = searchQuery.trim()
  const trimmedCustomerSearchQuery = customerSearchQuery.trim()
  const activeLine = saleItems.find((item) => item.lineId === activeLineId) ?? saleItems[saleItems.length - 1] ?? null
  const activeLineImages = activeLine ? getProductImages(activeLine) : []
  const activeImage = activeLineImages[activeLine?.activeImageIndex ?? 0] ?? activeLineImages[0] ?? null
  const activeImageSrc = activeImage ? imageObjectUrls[activeImage.id] ?? resolveApiUrl(apiBaseUrl, activeImage.url) : null
  const currentDateLabel = useMemo(() => (
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date())
  ), [])
  const ticketTotal = useMemo(() => (
    saleItems.reduce((total, item) => total + item.price * item.saleQuantity, 0)
  ), [saleItems])
  const showCustomerResults = (
    isCustomerSearchFocused
    && trimmedCustomerSearchQuery
    && (!selectedCustomer || trimmedCustomerSearchQuery !== selectedCustomer.displayName)
    && trimmedCustomerSearchQuery !== 'Público en General'
  )

  const handleSelectProduct = useCallback((product: SaleProductSearchItem) => {
    const identity = getLineIdentity(product)

    setSaleItems((currentItems) => {
      const existingIndex = currentItems.findIndex((item) => getLineIdentity(item) === identity)

      if (existingIndex >= 0) {
        return currentItems.map((item, index) => (
          index === existingIndex
            ? {
                ...item,
                saleQuantity: item.saleQuantity + 1,
              }
            : item
        ))
      }

      return [
        ...currentItems,
        {
          ...product,
          lineId: identity,
          saleQuantity: 1,
          activeImageIndex: 0,
        },
      ]
    })
    setActiveLineId(identity)
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
  }, [])

  const handleMoveActiveImage = useCallback((direction: -1 | 1) => {
    if (!activeLine) {
      return
    }

    const images = getProductImages(activeLine)

    if (images.length < 2) {
      return
    }

    setSaleItems((currentItems) => currentItems.map((item) => {
      if (item.lineId !== activeLine.lineId) {
        return item
      }

      return {
        ...item,
        activeImageIndex: (item.activeImageIndex + direction + images.length) % images.length,
      }
    }))
  }, [activeLine])

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearchQuery(value)
    setCustomerSearchError(null)

    if (!value.trim()) {
      setSelectedCustomer(null)
      setCustomerSearchResults([])
      setIsSearchingCustomers(false)

      return
    }

    if (selectedCustomer && value !== selectedCustomer.displayName) {
      setSelectedCustomer(null)
    }
  }

  const handleCustomerSearchBlur = () => {
    window.setTimeout(() => {
      setIsCustomerSearchFocused(false)
      setCustomerSearchResults([])
      setCustomerSearchError(null)
      setIsSearchingCustomers(false)

      if (!selectedCustomer && !customerSearchQuery.trim()) {
        setCustomerSearchQuery('Público en General')
      }
    }, 120)
  }

  const handleCustomerSearchFocus = () => {
    setIsCustomerSearchFocused(true)

    if (!selectedCustomer && customerSearchQuery === 'Público en General') {
      setCustomerSearchQuery('')
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearchQuery(customer.displayName)
    setCustomerSearchResults([])
    setCustomerSearchError(null)
    setIsSearchingCustomers(false)
  }

  useEffect(() => {
    if (isBootstrapping || !trimmedSearchQuery) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)

      return
    }

    if (!accessToken || !tokenType) {
      setSearchResults([])
      setSearchError('Inicia sesión para buscar productos.')
      setIsSearching(false)

      return
    }

    const abortController = new AbortController()
    const searchTimeout = window.setTimeout(() => {
      const params = new URLSearchParams({
        q: trimmedSearchQuery,
        limit: '20',
      })

      setIsSearching(true)
      setSearchError(null)

      requestVentasApi<SaleProductSearchResponse>(
        apiBaseUrl,
        tokenType,
        accessToken,
        `/productos/buscar?${params.toString()}`,
        abortController.signal,
      )
        .then((response) => {
          setSearchResults(response.items)
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          setSearchResults([])
          setSearchError(error instanceof Error ? error.message : 'No fue posible buscar productos.')
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsSearching(false)
          }
        })
    }, 250)

    return () => {
      window.clearTimeout(searchTimeout)
      abortController.abort()
    }
  }, [accessToken, apiBaseUrl, isBootstrapping, tokenType, trimmedSearchQuery])

  useEffect(() => {
    if (
      isBootstrapping
      || !isCustomerSearchFocused
      || !trimmedCustomerSearchQuery
      || trimmedCustomerSearchQuery === 'Público en General'
      || (selectedCustomer && trimmedCustomerSearchQuery === selectedCustomer.displayName)
    ) {
      setCustomerSearchResults([])
      setCustomerSearchError(null)
      setIsSearchingCustomers(false)

      return
    }

    if (!accessToken || !tokenType) {
      setCustomerSearchResults([])
      setCustomerSearchError('Inicia sesión para buscar clientes.')
      setIsSearchingCustomers(false)

      return
    }

    const abortController = new AbortController()
    const searchTimeout = window.setTimeout(() => {
      const params = new URLSearchParams({
        q: trimmedCustomerSearchQuery,
        page: '1',
        limit: '10',
      })

      setIsSearchingCustomers(true)
      setCustomerSearchError(null)

      requestClientesApi<CustomerListResponse>(
        apiBaseUrl,
        tokenType,
        accessToken,
        `/buscar?${params.toString()}`,
        abortController.signal,
      )
        .then((response) => {
          setCustomerSearchResults(response.items)
        })
        .catch((error) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          setCustomerSearchResults([])
          setCustomerSearchError(error instanceof Error ? error.message : 'No fue posible buscar clientes.')
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsSearchingCustomers(false)
          }
        })
    }, 250)

    return () => {
      window.clearTimeout(searchTimeout)
      abortController.abort()
    }
  }, [
    accessToken,
    apiBaseUrl,
    isBootstrapping,
    isCustomerSearchFocused,
    selectedCustomer,
    tokenType,
    trimmedCustomerSearchQuery,
  ])

  useEffect(() => (
    () => {
      fetchedObjectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
    }
  ), [])

  useEffect(() => {
    if (!accessToken || !tokenType) {
      return
    }

    const visibleImages = [...searchResults, ...saleItems].flatMap(getProductImages)

    visibleImages.forEach((image) => {
      if (imageObjectUrls[image.id] || requestedImageIdsRef.current.has(image.id)) {
        return
      }

      requestedImageIdsRef.current.add(image.id)

      requestProductImageObjectUrl(apiBaseUrl, tokenType, accessToken, image.url)
        .then((objectUrl) => {
          fetchedObjectUrlsRef.current.push(objectUrl)
          setImageObjectUrls((currentUrls) => (
            currentUrls[image.id]
              ? currentUrls
              : {
                  ...currentUrls,
                  [image.id]: objectUrl,
                }
          ))
        })
        .catch(() => {
          setImageObjectUrls((currentUrls) => (
            currentUrls[image.id]
              ? currentUrls
              : {
                  ...currentUrls,
                  [image.id]: resolveApiUrl(apiBaseUrl, image.url),
                }
          ))
        })
    })
  }, [accessToken, apiBaseUrl, imageObjectUrls, saleItems, searchResults, tokenType])

  return (
    <section className='ventas-ui'>
      <header className='ventas-ui__topbar'>
        {topActions.map((action) => (
          <button key={action.id} className='ventas-ui__top-action' type='button'>
            <span className='ventas-ui__action-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='ventas-ui__action-text'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
      </header>

      <div className='ventas-ui__main'>
        <aside className='ventas-ui__sidebar'>
          {sideActions.map((action) => (
            <button key={action.id} className='ventas-ui__side-action' type='button'>
              <span className='ventas-ui__side-icon' aria-hidden='true'>
                {action.icon}
              </span>
              <span className='ventas-ui__side-text'>
                {action.label} {action.shortcut}
              </span>
            </button>
          ))}
        </aside>

        <div className='ventas-ui__content'>
          <section className='ventas-ui__capture-block'>
            <div className='ventas-ui__product-preview' aria-label='Previsualización del producto'>
              {activeImageSrc ? (
                <img
                  className='ventas-ui__product-preview-img'
                  src={activeImageSrc}
                  alt={activeImage?.altText || activeLine?.displayName || 'Producto seleccionado'}
                />
              ) : (
                <span className='ventas-ui__product-preview-empty'>Sin imagen</span>
              )}
              {activeLineImages.length > 1 && (
                <div className='ventas-ui__image-controls' aria-label='Cambiar imagen del producto'>
                  <button
                    aria-label='Imagen anterior'
                    className='ventas-ui__image-arrow'
                    onClick={() => handleMoveActiveImage(-1)}
                    type='button'
                  >
                    ‹
                  </button>
                  <button
                    aria-label='Imagen siguiente'
                    className='ventas-ui__image-arrow'
                    onClick={() => handleMoveActiveImage(1)}
                    type='button'
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            <div className='ventas-ui__capture-fields'>
              <div className='ventas-ui__barcode-row'>
                <span className='ventas-ui__field-symbol' aria-hidden='true'>
                  ||||
                </span>
                <div className='ventas-ui__search-wrap'>
                  <input
                    aria-autocomplete='list'
                    aria-controls='ventas-product-results'
                    className='ventas-ui__input ventas-ui__input--barcode'
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder='Buscar por nombre o SKU'
                    type='text'
                    value={searchQuery}
                  />
                  {trimmedSearchQuery && (
                    <div className='ventas-ui__search-results' id='ventas-product-results' role='listbox'>
                      {isSearching && <div className='ventas-ui__search-status'>Buscando productos...</div>}
                      {searchError && <div className='ventas-ui__search-status ventas-ui__search-status--error'>{searchError}</div>}
                      {!isSearching && !searchError && searchResults.length === 0 && (
                        <div className='ventas-ui__search-status'>Sin coincidencias</div>
                      )}
                      {searchResults.map((product) => {
                        const productImage = getProductImages(product)[0]
                        const productImageSrc = productImage
                          ? imageObjectUrls[productImage.id] ?? resolveApiUrl(apiBaseUrl, productImage.url)
                          : null

                        return (
                          <button
                            aria-selected='false'
                            className='ventas-ui__search-option'
                            key={getLineIdentity(product)}
                            onClick={() => handleSelectProduct(product)}
                            role='option'
                            type='button'
                          >
                            <span className='ventas-ui__search-thumb'>
                              {productImageSrc ? (
                                <img src={productImageSrc} alt={productImage?.altText || product.displayName} />
                              ) : (
                                <span aria-hidden='true'>▧</span>
                              )}
                            </span>
                            <span className='ventas-ui__search-copy'>
                              <strong>{product.displayName}</strong>
                              <small>{product.sku || 'Sin SKU'} · {formatCurrency(product.price, product.currency)}</small>
                            </span>
                            <span className={`ventas-ui__stock-pill ventas-ui__stock-pill--${product.stockStatus}`}>
                              {product.trackingMode === 'untracked' ? 'Sin inventario' : product.quantity ?? 0}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className='ventas-ui__date-wrap'>
                  <span className='ventas-ui__field-symbol' aria-hidden='true'>
                    🗓
                  </span>
                  <input className='ventas-ui__input ventas-ui__input--date' type='text' value={currentDateLabel} readOnly />
                </div>
              </div>

              <div className='ventas-ui__detail-row'>
                <span className='ventas-ui__field-symbol' aria-hidden='true'>
                  📦
                </span>
                <input className='ventas-ui__input ventas-ui__input--ticket' type='text' value='Ticket' readOnly />

                <div className='ventas-ui__money-wrap'>
                  <span className='ventas-ui__field-symbol' aria-hidden='true'>
                    💰
                  </span>
                  <input className='ventas-ui__input ventas-ui__input--currency' type='text' value='MXN' readOnly />
                </div>

                <div className='ventas-ui__rate-wrap'>
                  <span className='ventas-ui__field-symbol' aria-hidden='true'>
                    💱
                  </span>
                  <input className='ventas-ui__input ventas-ui__input--rate' type='text' value='1.000000' readOnly />
                  <button className='ventas-ui__tiny-btn' type='button'>
                    ⓘ
                  </button>
                </div>
              </div>

              <div className='ventas-ui__detail-row'>
                <span className='ventas-ui__field-symbol' aria-hidden='true'>
                  👤
                </span>
                <div className='ventas-ui__search-wrap ventas-ui__client-search-wrap'>
                  <input
                    aria-autocomplete='list'
                    aria-controls='ventas-client-results'
                    className='ventas-ui__input ventas-ui__input--client'
                    onBlur={handleCustomerSearchBlur}
                    onChange={(event) => handleCustomerSearchChange(event.target.value)}
                    onFocus={handleCustomerSearchFocus}
                    placeholder='Público en General'
                    type='text'
                    value={customerSearchQuery}
                  />
                  {showCustomerResults && (
                    <div className='ventas-ui__search-results ventas-ui__client-search-results' id='ventas-client-results' role='listbox'>
                      {isSearchingCustomers && <div className='ventas-ui__search-status'>Buscando clientes...</div>}
                      {customerSearchError && <div className='ventas-ui__search-status ventas-ui__search-status--error'>{customerSearchError}</div>}
                      {!isSearchingCustomers && !customerSearchError && customerSearchResults.length === 0 && (
                        <div className='ventas-ui__search-status'>Sin coincidencias</div>
                      )}
                      {customerSearchResults.map((customer) => (
                        <button
                          aria-selected={selectedCustomer?.id === customer.id}
                          className='ventas-ui__search-option ventas-ui__client-search-option'
                          key={customer.id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectCustomer(customer)}
                          role='option'
                          type='button'
                        >
                          <span className='ventas-ui__client-search-name'>{customer.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className='ventas-ui__field-symbol' aria-hidden='true'>
                  🧍
                </span>
                <input className='ventas-ui__input ventas-ui__input--extra' type='text' />
                <button className='ventas-ui__tiny-btn' type='button'>
                  ⛔
                </button>
              </div>
            </div>
          </section>

          <section className='ventas-ui__items-block'>
            <div className='ventas-ui__table-head' role='row'>
              {tableColumns.map((column) => (
                <div key={column.id} className={`ventas-ui__head-cell ${column.className ?? ''}`} role='columnheader'>
                  {column.label}
                </div>
              ))}
            </div>
            <div className='ventas-ui__table-body'>
              {saleItems.map((item) => (
                <button
                  className={`ventas-ui__table-row ${item.lineId === activeLineId ? 'ventas-ui__table-row--active' : ''}`}
                  key={item.lineId}
                  onClick={() => setActiveLineId(item.lineId)}
                  type='button'
                >
                  <span className='ventas-ui__body-cell ventas-ui__col--cant'>{item.saleQuantity}</span>
                  <span className='ventas-ui__body-cell ventas-ui__col--descripcion'>
                    <strong>{item.displayName}</strong>
                    {item.sku && <small>{item.sku}</small>}
                  </span>
                  <span className='ventas-ui__body-cell ventas-ui__col--mini'>{item.image ? '✓' : ''}</span>
                  <span className='ventas-ui__body-cell ventas-ui__col--mini' />
                  <span className='ventas-ui__body-cell ventas-ui__col--mini' />
                  <span className='ventas-ui__body-cell ventas-ui__col--mini' />
                  <span className='ventas-ui__body-cell ventas-ui__col--mini' />
                  <span className='ventas-ui__body-cell ventas-ui__col--mini' />
                  <span className='ventas-ui__body-cell ventas-ui__col--exis'>
                    {item.trackingMode === 'untracked' ? '-' : item.quantity ?? 0}
                  </span>
                  <span className='ventas-ui__body-cell ventas-ui__col--desc'>0.00</span>
                  <span className='ventas-ui__body-cell ventas-ui__col--precio'>{formatCurrency(item.price, item.currency)}</span>
                  <span className='ventas-ui__body-cell ventas-ui__col--importe'>
                    {formatCurrency(item.price * item.saleQuantity, item.currency)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className='ventas-ui__summary-block'>
            <div className='ventas-ui__summary-top'>
              <div className='ventas-ui__summary-left'>
                <div className='ventas-ui__summary-item'>
                  <span className='ventas-ui__summary-label'>⚠ Notas de Créd:</span>
                  <span className='ventas-ui__summary-value'>$ 0.00</span>
                </div>
                <div className='ventas-ui__summary-item'>
                  <span className='ventas-ui__summary-label'>Promociones:</span>
                  <span className='ventas-ui__summary-value'>$ 0.00</span>
                </div>
              </div>

              <div className='ventas-ui__summary-right'>
                <div className='ventas-ui__summary-item'>
                  <span className='ventas-ui__summary-label'>Monedero:</span>
                  <span className='ventas-ui__summary-value'>$ 0.00</span>
                </div>
                <div className='ventas-ui__summary-item'>
                  <span className='ventas-ui__summary-label'>Descuento:</span>
                  <span className='ventas-ui__summary-value'>$ 0.00</span>
                </div>
                <div className='ventas-ui__summary-item'>
                  <span className='ventas-ui__summary-label ventas-ui__summary-label--secondary'>Retenciones:</span>
                  <span className='ventas-ui__summary-value ventas-ui__summary-value--secondary'>$ 0.00</span>
                </div>
              </div>
            </div>

            <div className='ventas-ui__total-bar'>
              <span>Total: {formatCurrency(ticketTotal)} MXN</span>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
