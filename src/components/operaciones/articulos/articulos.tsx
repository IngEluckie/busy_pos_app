import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './style.css'
import { Modal } from '../../ventanaModal/modal'
import { useSession } from '../../../context/SessionContext'

type ActionButton = {
  id: string
  label: string
  shortcut: string
  icon: string
}

type ActionModalContent = {
  title: string
  description: string
}

type ResultColumn = {
  id: string
  label?: string
  icon?: string
  className?: string
}

type ProductTab = 'general' | 'inventario' | 'atributos'
type ProductType = 'simple'
type ProductTypeOption = 'Producto simple' | 'Producto compuesto' | 'Servicio'
type ProductModalMode = 'create' | 'edit'
type InventoryTrackingMode = 'tracked' | 'untracked'
type ReservationPolicy = 'disabled' | 'allowed'
type StockStatus = 'in_stock' | 'out_of_stock' | 'backorder'

type ProductAttribute = {
  id: string
  name: string
  values: string[]
  visible: boolean
}

type ProductImage = {
  id: string
  url: string
  altText?: string
  isPrimary: boolean
  order: number
  localFile?: File
  previewUrl?: string
}

type SimpleProduct = {
  id: string
  type: ProductType
  general: {
    name: string
    shortDescription: string
    longDescription: string
    regularPrice: number | null
    salePrice: number | null
  }
  inventory: {
    sku: string
    trackingMode: InventoryTrackingMode
    quantity: number | null
    reservationPolicy: ReservationPolicy | null
    lowStockThreshold: number | null
    stockStatus: StockStatus
  }
  attributes: ProductAttribute[]
  media: {
    images: ProductImage[]
  }
  metadata: {
    createdAt: string
    updatedAt: string
    isActive: boolean
  }
}

type SimpleProductValidationErrors = Partial<Record<'name' | 'shortDescription' | 'regularPrice' | 'sku', string>>

type ProductListResponse = {
  items: SimpleProduct[]
  page: number
  limit: number
  total: number
}

type ProductWritePayload = {
  type: ProductType
  general: SimpleProduct['general']
  inventory: SimpleProduct['inventory']
  attributes: []
  media?: {
    images: ProductImage[]
  }
}

type ApiRequestOptions = {
  apiBaseUrl: string
  tokenType: string
  accessToken: string
}

const topActions: ActionButton[] = [
  { id: 'agregar', label: 'Agregar', shortcut: '(F3)', icon: '➕' },
  { id: 'editar', label: 'Editar', shortcut: '(F4)', icon: '✏️' },
  { id: 'recargar', label: 'Recargar', shortcut: '(F5)', icon: '↻' },
  { id: 'eliminar', label: 'Eliminar', shortcut: '(F6)', icon: '✖' },
  { id: 'ajustar', label: 'Ajustar', shortcut: '(F8)', icon: '⚖' },
  { id: 'clonar', label: 'Clonar', shortcut: '(F9)', icon: '⧉' },
  { id: 'nubexis', label: 'NubExis', shortcut: '(Alt + E)', icon: '☁' },
  { id: 'imprimir', label: 'Imp.', shortcut: '(Ctrl + P)', icon: '▥' },
]

const actionModalContent: Record<ActionButton['id'], ActionModalContent> = {
  agregar: {
    title: 'Agregar artículo',
    description: 'Aquí podrás capturar la información de un nuevo artículo y registrarlo en el catálogo.'
  },
  editar: {
    title: 'Editar artículo',
    description: 'Aquí podrás modificar la información del artículo seleccionado.'
  },
  recargar: {
    title: 'Recargar artículos',
    description: 'Aquí podrás refrescar la información cargada en la interfaz de artículos.'
  },
  eliminar: {
    title: 'Eliminar artículo',
    description: 'Aquí podrás confirmar la baja del artículo seleccionado del catálogo.'
  },
  ajustar: {
    title: 'Ajustar existencias',
    description: 'Aquí podrás registrar ajustes de inventario para el artículo seleccionado.'
  },
  clonar: {
    title: 'Clonar artículo',
    description: 'Aquí podrás duplicar la configuración del artículo seleccionado para crear uno nuevo.'
  },
  nubexis: {
    title: 'Sincronizar con NubExis',
    description: 'Aquí podrás revisar y ejecutar acciones relacionadas con la integración de NubExis.'
  },
  imprimir: {
    title: 'Imprimir artículo',
    description: 'Aquí podrás preparar la impresión de etiquetas, fichas o reportes del artículo seleccionado.'
  }
}

const resultColumns: ResultColumn[] = [
  { id: 'clave', label: 'Clave/Descripción', className: 'articulos-ui__results-cell--description' },
  { id: 'existencias', label: 'Exist.', className: 'articulos-ui__results-cell--stock' },
  { id: 'precio', label: 'Precio', className: 'articulos-ui__results-cell--price' },
  { id: 'etiquetas', icon: '🏷', className: 'articulos-ui__results-cell--icon' },
  { id: 'config', icon: '⚙', className: 'articulos-ui__results-cell--icon' },
  { id: 'enlace', icon: '🔗', className: 'articulos-ui__results-cell--icon' },
  { id: 'cubo', icon: '🧊', className: 'articulos-ui__results-cell--icon' },
  { id: 'layout', icon: '▧', className: 'articulos-ui__results-cell--icon' },
]

const productTabs: Array<{ id: ProductTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'atributos', label: 'Atributos' },
]

const productTypeOptions: ProductTypeOption[] = ['Producto simple', 'Producto compuesto', 'Servicio']
const PRODUCTS_PER_PAGE = 20
const SHORT_DESCRIPTION_MAX_LENGTH = 150
const LONG_DESCRIPTION_MAX_LENGTH = 1000
const PRODUCT_DELETE_DELAY_MS = 5000

const createClientId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const createEmptyProductAttribute = (): ProductAttribute => ({
  id: createClientId('attr'),
  name: '',
  values: [],
  visible: true,
})

const isLocalProductImage = (image: ProductImage) => Boolean(image.localFile)

const resolveApiUrl = (apiBaseUrl: string, path: string) => {
  if (/^https?:\/\//i.test(path) || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }

  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

const createEmptySimpleProduct = (): SimpleProduct => {
  const now = new Date().toISOString()

  return {
    id: createClientId('prod'),
    type: 'simple',
    general: {
      name: '',
      shortDescription: '',
      longDescription: '',
      regularPrice: null,
      salePrice: null,
    },
    inventory: {
      sku: '',
      trackingMode: 'tracked',
      quantity: 1,
      reservationPolicy: 'disabled',
      lowStockThreshold: 1,
      stockStatus: 'in_stock',
    },
    attributes: [
      createEmptyProductAttribute(),
    ],
    media: {
      images: [],
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      isActive: true,
    },
  }
}

const createEditableSimpleProductDraft = (product: SimpleProduct): SimpleProduct => ({
  ...product,
  attributes: product.attributes.length > 0 ? product.attributes : [createEmptyProductAttribute()],
})

const parseNumberInput = (value: string) => {
  if (value.trim() === '') {
    return null
  }

  const parsedValue = Number(value)

  return Number.isNaN(parsedValue) ? null : parsedValue
}

const formatProductPrice = (price: number | null) => (
  price !== null ? `$${price.toFixed(2)}` : '-'
)

const stockStatusLabels: Record<StockStatus, string> = {
  in_stock: 'Hay existencias',
  out_of_stock: 'Sin existencias',
  backorder: 'Se puede reservar',
}

const getApiErrorMessage = async (response: Response) => {
  let detail: unknown = null

  try {
    const body = await response.json()
    detail = body?.detail
  } catch {
    detail = null
  }

  if (response.status === 401 || response.status === 403) {
    return 'Tu sesión no tiene permiso para realizar esta acción.'
  }

  if (response.status === 404) {
    return 'El artículo ya no existe o no está disponible.'
  }

  if (response.status === 409) {
    return 'El SKU ya existe. Ingresa un SKU diferente.'
  }

  if (response.status === 422) {
    return 'La API rechazó los datos del artículo. Revisa los campos capturados.'
  }

  if (typeof detail === 'string') {
    return detail
  }

  return 'No fue posible completar la operación.'
}

const requestArticulosApi = async <T,>(
  options: ApiRequestOptions,
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${options.apiBaseUrl}/articulos${path}`, {
      ...init,
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
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

const requestArticuloImageObjectUrl = async (
  options: ApiRequestOptions,
  imageUrl: string,
) => {
  let response: Response

  try {
    response = await fetch(resolveApiUrl(options.apiBaseUrl, imageUrl), {
      headers: {
        Authorization: `${options.tokenType} ${options.accessToken}`,
      },
    })
  } catch {
    throw new Error('No fue posible cargar la imagen del artículo.')
  }

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return URL.createObjectURL(await response.blob())
}

export const Articulos = () => {
  const {
    accessToken,
    apiBaseUrl,
    isBootstrapping,
    isAuthenticated,
    tokenType,
  } = useSession()
  const [openActionId, setOpenActionId] = useState<ActionButton['id'] | null>(null)
  const [activeProductTab, setActiveProductTab] = useState<ProductTab>('general')
  const [productType, setProductType] = useState<ProductTypeOption>(productTypeOptions[0])
  const [productModalMode, setProductModalMode] = useState<ProductModalMode>('create')
  const [simpleProductDraft, setSimpleProductDraft] = useState<SimpleProduct>(() => createEmptySimpleProduct())
  const [simpleProducts, setSimpleProducts] = useState<SimpleProduct[]>([])
  const [currentProductPage, setCurrentProductPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [pendingDeleteProductId, setPendingDeleteProductId] = useState<string | null>(null)
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null)
  const [adjustmentQuantityDraft, setAdjustmentQuantityDraft] = useState('')
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [simpleProductErrors, setSimpleProductErrors] = useState<SimpleProductValidationErrors>({})
  const [productModalError, setProductModalError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [isAdjustingProduct, setIsAdjustingProduct] = useState(false)
  const [activeProductImageId, setActiveProductImageId] = useState<string | null>(null)
  const [productImageCarouselStart, setProductImageCarouselStart] = useState(0)
  const [isProductImageExpanded, setIsProductImageExpanded] = useState(false)
  const [selectedProductImageId, setSelectedProductImageId] = useState<string | null>(null)
  const [deletedProductImageIds, setDeletedProductImageIds] = useState<string[]>([])
  const [productImageObjectUrls, setProductImageObjectUrls] = useState<Record<string, string>>({})
  const productImageInputRef = useRef<HTMLInputElement | null>(null)
  const fetchedProductImageObjectUrlsRef = useRef<string[]>([])
  const deleteDelayTimeoutRef = useRef<number | null>(null)

  const trackInventory = simpleProductDraft.inventory.trackingMode === 'tracked'
  const primaryAttribute = simpleProductDraft.attributes[0]
  const isProductModalOpen = openActionId === 'agregar' || openActionId === 'editar'
  const productImages = useMemo(() => (
    [...simpleProductDraft.media.images].sort((firstImage, secondImage) => firstImage.order - secondImage.order)
  ), [simpleProductDraft.media.images])
  const activeProductImage = productImages.find((image) => image.id === activeProductImageId) ?? productImages[0] ?? null
  const visibleProductImages = productImages.slice(productImageCarouselStart, productImageCarouselStart + 4)
  const totalProductPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE)
  const currentProductPageLabel = totalProductPages === 0 ? 0 : currentProductPage
  const paginatedProducts = simpleProducts
  const canGoToPreviousProductPage = totalProductPages > 0 && currentProductPage > 1
  const canGoToNextProductPage = totalProductPages > 0 && currentProductPage < totalProductPages
  const selectedProduct = simpleProducts.find((product) => product.id === selectedProductId) ?? null
  const selectedProductImages = useMemo(() => (
    selectedProduct
      ? [...selectedProduct.media.images].sort((firstImage, secondImage) => firstImage.order - secondImage.order)
      : []
  ), [selectedProduct])
  const activeSelectedProductImage = selectedProductImages.find((image) => image.id === selectedProductImageId) ?? selectedProductImages[0] ?? null
  const canUseApi = isAuthenticated && Boolean(accessToken && tokenType)
  const apiRequestOptions = accessToken && tokenType
    ? { accessToken, apiBaseUrl, tokenType }
    : null

  const fetchProducts = useCallback(async (page: number, query: string) => {
    if (isBootstrapping) {
      return
    }

    if (!accessToken || !tokenType) {
      setSimpleProducts([])
      setTotalProducts(0)
      setApiError('Inicia sesión para consultar artículos.')

      return
    }

    setIsLoadingProducts(true)
    setApiError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PRODUCTS_PER_PAGE),
      })
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      }

      const response = await requestArticulosApi<ProductListResponse>(
        { accessToken, apiBaseUrl, tokenType },
        `/recargar?${params.toString()}`,
      )
      const nextTotalPages = Math.ceil(response.total / PRODUCTS_PER_PAGE)

      setSimpleProducts(response.items)
      setTotalProducts(response.total)

      setSelectedProductId((currentSelectedProductId) => (
        currentSelectedProductId && !response.items.some((product) => product.id === currentSelectedProductId)
          ? null
          : currentSelectedProductId
      ))

      if (response.total === 0 && page !== 1) {
        setCurrentProductPage(1)
      }

      if (nextTotalPages > 0 && page > nextTotalPages) {
        setCurrentProductPage(nextTotalPages)
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No fue posible cargar artículos.')
    } finally {
      setIsLoadingProducts(false)
    }
  }, [accessToken, apiBaseUrl, isBootstrapping, tokenType])

  useEffect(() => {
    fetchProducts(currentProductPage, activeSearchQuery)
  }, [activeSearchQuery, currentProductPage, fetchProducts])

  useEffect(() => (
    () => {
      fetchedProductImageObjectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
    }
  ), [])

  useEffect(() => (
    () => {
      if (deleteDelayTimeoutRef.current) {
        window.clearTimeout(deleteDelayTimeoutRef.current)
      }
    }
  ), [])

  useEffect(() => {
    if (!accessToken || !tokenType) {
      return
    }

    const requestOptions = { accessToken, apiBaseUrl, tokenType }

    const imagesToLoad = [...productImages, ...selectedProductImages]

    imagesToLoad.forEach((image) => {
      if (image.previewUrl || isLocalProductImage(image) || productImageObjectUrls[image.id]) {
        return
      }

      requestArticuloImageObjectUrl(requestOptions, image.url)
        .then((objectUrl) => {
          fetchedProductImageObjectUrlsRef.current.push(objectUrl)
          setProductImageObjectUrls((currentUrls) => (
            currentUrls[image.id]
              ? currentUrls
              : {
                  ...currentUrls,
                  [image.id]: objectUrl,
                }
          ))
        })
        .catch(() => {
          setProductImageObjectUrls((currentUrls) => (
            currentUrls[image.id]
              ? currentUrls
              : {
                  ...currentUrls,
                  [image.id]: resolveApiUrl(apiBaseUrl, image.url),
                }
          ))
        })
    })
  }, [accessToken, apiBaseUrl, productImageObjectUrls, productImages, selectedProductImages, tokenType])

  useEffect(() => {
    if (productImages.length === 0) {
      setActiveProductImageId(null)
      setProductImageCarouselStart(0)

      return
    }

    const activeImageIndex = productImages.findIndex((image) => image.id === activeProductImageId)

    if (activeImageIndex === -1) {
      setActiveProductImageId(productImages[0].id)
      setProductImageCarouselStart(0)

      return
    }

    if (activeImageIndex < productImageCarouselStart) {
      setProductImageCarouselStart(activeImageIndex)
    }

    if (activeImageIndex > productImageCarouselStart + 3) {
      setProductImageCarouselStart(activeImageIndex - 3)
    }
  }, [activeProductImageId, productImageCarouselStart, productImages])

  useEffect(() => {
    if (selectedProductImages.length === 0) {
      setSelectedProductImageId(null)

      return
    }

    if (!selectedProductImages.some((image) => image.id === selectedProductImageId)) {
      setSelectedProductImageId(selectedProductImages.find((image) => image.isPrimary)?.id ?? selectedProductImages[0].id)
    }
  }, [selectedProductImageId, selectedProductImages])

  useEffect(() => {
    const handleEscapeSelection = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !openActionId && !productModalError) {
        if (pendingDeleteProductId) {
          event.preventDefault()
          cancelProductDeleteDelay()

          return
        }

        if (adjustingProductId) {
          event.preventDefault()
          setAdjustingProductId(null)
          setAdjustmentQuantityDraft('')
          setAdjustmentError(null)

          return
        }

        setSelectedProductId(null)
      }
    }

    window.addEventListener('keydown', handleEscapeSelection)

    return () => {
      window.removeEventListener('keydown', handleEscapeSelection)
    }
  }, [adjustingProductId, openActionId, pendingDeleteProductId, productModalError])

  const clearAdjustment = () => {
    setAdjustingProductId(null)
    setAdjustmentQuantityDraft('')
    setAdjustmentError(null)
  }

  const startProductAdjustment = (product: SimpleProduct) => {
    setSelectedProductId(product.id)
    setAdjustingProductId(product.id)
    setAdjustmentQuantityDraft(String(product.inventory.quantity ?? 0))
    setAdjustmentError(null)
  }

  const parseAdjustmentQuantity = () => {
    if (!/^\d+$/.test(adjustmentQuantityDraft.trim())) {
      return null
    }

    return Number(adjustmentQuantityDraft)
  }

  const replaceProductInList = (updatedProduct: SimpleProduct) => {
    setSimpleProducts((currentProducts) => (
      currentProducts.map((product) => (
        product.id === updatedProduct.id ? updatedProduct : product
      ))
    ))
    setSelectedProductId(updatedProduct.id)
  }

  const confirmProductAdjustment = async () => {
    const nextQuantity = parseAdjustmentQuantity()

    if (nextQuantity === null) {
      setAdjustmentError('Ingresa un entero mayor o igual a 0.')

      return
    }

    if (!apiRequestOptions || !adjustingProductId) {
      setProductModalError('Inicia sesión para ajustar existencias.')

      return
    }

    setIsAdjustingProduct(true)
    setAdjustmentError(null)
    setApiError(null)

    try {
      const updatedProduct = await requestArticulosApi<SimpleProduct>(
        apiRequestOptions,
        `/${adjustingProductId}/ajustar`,
        {
          method: 'POST',
          body: JSON.stringify({
            cantidad: nextQuantity,
            motivo: 'Ajuste manual desde artículos',
            referencia: null,
          }),
        },
      )

      replaceProductInList(updatedProduct)
      clearAdjustment()
    } catch (error) {
      setAdjustmentError(error instanceof Error ? error.message : 'No fue posible ajustar existencias.')
    } finally {
      setIsAdjustingProduct(false)
    }
  }

  const reloadCurrentProducts = () => {
    fetchProducts(currentProductPage, activeSearchQuery)
  }

  const cancelProductDeleteDelay = () => {
    if (deleteDelayTimeoutRef.current) {
      window.clearTimeout(deleteDelayTimeoutRef.current)
      deleteDelayTimeoutRef.current = null
    }

    setPendingDeleteProductId(null)
  }

  const executeProductDelete = async (productId: string, requestOptions: ApiRequestOptions | null) => {
    if (!requestOptions) {
      setProductModalError('Inicia sesión para gestionar artículos.')
      setPendingDeleteProductId(null)

      return
    }

    setIsDeletingProduct(true)
    setApiError(null)

    try {
      await requestArticulosApi<{ message: string; id: string }>(
        requestOptions,
        `/${productId}/eliminar`,
        { method: 'DELETE' },
      )

      setSelectedProductId(null)
      const nextTotalProducts = Math.max(0, totalProducts - 1)
      const nextTotalPages = Math.ceil(nextTotalProducts / PRODUCTS_PER_PAGE)
      const nextPage = Math.max(1, Math.min(currentProductPage, nextTotalPages || 1))

      setTotalProducts(nextTotalProducts)
      if (nextPage !== currentProductPage) {
        setCurrentProductPage(nextPage)
      } else {
        fetchProducts(nextPage, activeSearchQuery)
      }
    } catch (error) {
      setProductModalError(error instanceof Error ? error.message : 'No fue posible eliminar el artículo.')
    } finally {
      setPendingDeleteProductId(null)
      setIsDeletingProduct(false)
    }
  }

  const startProductDeleteDelay = (product: SimpleProduct, requestOptions: ApiRequestOptions | null) => {
    cancelProductDeleteDelay()
    clearAdjustment()
    setSelectedProductId(product.id)
    setPendingDeleteProductId(product.id)
    setApiError(null)

    deleteDelayTimeoutRef.current = window.setTimeout(() => {
      deleteDelayTimeoutRef.current = null
      executeProductDelete(product.id, requestOptions)
    }, PRODUCT_DELETE_DELAY_MS)
  }

  const handleSearchProducts = () => {
    cancelProductDeleteDelay()
    clearAdjustment()
    setSelectedProductId(null)
    setActiveSearchQuery(searchQuery.trim())
    setCurrentProductPage(1)
  }

  const handleOpenActionModal = async (actionId: ActionButton['id']) => {
    if ((actionId === 'agregar' || actionId === 'editar' || actionId === 'eliminar' || actionId === 'ajustar' || actionId === 'clonar') && !canUseApi) {
      setProductModalError('Inicia sesión para gestionar artículos.')

      return
    }

    const requestOptions = apiRequestOptions

    if (pendingDeleteProductId) {
      if (actionId === 'eliminar') {
        return
      }

      cancelProductDeleteDelay()
    }

    if (actionId === 'agregar') {
      clearAdjustment()
      setProductModalMode('create')
      setSimpleProductDraft(createEmptySimpleProduct())
      setActiveProductImageId(null)
      setProductImageCarouselStart(0)
      setIsProductImageExpanded(false)
      setDeletedProductImageIds([])
      setProductImageObjectUrls({})
      setSimpleProductErrors({})
      setActiveProductTab('general')
      setOpenActionId(actionId)

      return
    }

    if (actionId === 'recargar') {
      reloadCurrentProducts()

      return
    }

    if (actionId === 'editar') {
      const selectedProduct = simpleProducts.find((product) => product.id === selectedProductId)

      if (!selectedProduct) {
        setProductModalError('No se ha seleccionado producto')

        return
      }

      clearAdjustment()
      setProductModalMode('edit')
      setSimpleProductDraft(createEditableSimpleProductDraft(selectedProduct))
      setActiveProductImageId(selectedProduct.media.images.find((image) => image.isPrimary)?.id ?? selectedProduct.media.images[0]?.id ?? null)
      setProductImageCarouselStart(0)
      setIsProductImageExpanded(false)
      setDeletedProductImageIds([])
      setProductImageObjectUrls({})
      setSimpleProductErrors({})
      setActiveProductTab('general')
      setOpenActionId(actionId)

      return
    }

    if (actionId === 'eliminar') {
      const selectedProduct = simpleProducts.find((product) => product.id === selectedProductId)

      if (!selectedProduct) {
        setProductModalError('No artículo seleccionado')

        return
      }

      clearAdjustment()
      startProductDeleteDelay(selectedProduct, requestOptions)

      return
    }

    if (actionId === 'ajustar') {
      const selectedProduct = simpleProducts.find((product) => product.id === selectedProductId)

      if (!selectedProduct) {
        setProductModalError('No artículo seleccionado')

        return
      }

      if (selectedProduct.inventory.trackingMode !== 'tracked') {
        setProductModalError('El producto no maneja cantidad de inventario.')

        return
      }

      startProductAdjustment(selectedProduct)

      return
    }

    if (actionId === 'clonar') {
      const selectedProduct = simpleProducts.find((product) => product.id === selectedProductId)

      if (!selectedProduct) {
        setProductModalError('No artículo seleccionado')

        return
      }

      clearAdjustment()
      setIsSavingProduct(true)
      setApiError(null)

      try {
        const clonedProduct = await requestArticulosApi<SimpleProduct>(
          requestOptions as ApiRequestOptions,
          `/${selectedProduct.id}/clonar`,
          {
            method: 'POST',
            body: JSON.stringify({}),
          },
        )

        setSelectedProductId(clonedProduct.id)
        setCurrentProductPage(1)
        fetchProducts(1, activeSearchQuery)
      } catch (error) {
        setProductModalError(error instanceof Error ? error.message : 'No fue posible clonar el artículo.')
      } finally {
        setIsSavingProduct(false)
      }

      return
    }

    setOpenActionId(actionId)
  }

  const handleCloseActionModal = () => {
    setOpenActionId(null)
  }

  const handleCloseProductModalError = () => {
    setProductModalError(null)
  }

  const handleSelectProduct = (productId: string) => {
    if (pendingDeleteProductId) {
      if (pendingDeleteProductId === productId) {
        cancelProductDeleteDelay()
      }

      return
    }

    if (adjustingProductId && adjustingProductId !== productId) {
      clearAdjustment()
    }

    setSelectedProductId(productId)
  }

  const handleEditProduct = (product: SimpleProduct) => {
    if (pendingDeleteProductId || adjustingProductId === product.id) {
      return
    }

    clearAdjustment()
    setSelectedProductId(product.id)
    setProductModalMode('edit')
    setSimpleProductDraft(createEditableSimpleProductDraft(product))
    setActiveProductImageId(product.media.images.find((image) => image.isPrimary)?.id ?? product.media.images[0]?.id ?? null)
    setProductImageCarouselStart(0)
    setIsProductImageExpanded(false)
    setDeletedProductImageIds([])
    setProductImageObjectUrls({})
    setSimpleProductErrors({})
    setActiveProductTab('general')
    setOpenActionId('editar')
  }

  const handlePreviousProductPage = () => {
    cancelProductDeleteDelay()
    clearAdjustment()
    setCurrentProductPage((currentPage) => Math.max(1, currentPage - 1))
  }

  const handleNextProductPage = () => {
    cancelProductDeleteDelay()
    clearAdjustment()
    setCurrentProductPage((currentPage) => Math.min(totalProductPages || 1, currentPage + 1))
  }

  const clearSimpleProductErrors = (fields: Array<keyof SimpleProductValidationErrors>) => {
    setSimpleProductErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      fields.forEach((field) => {
        delete nextErrors[field]
      })

      return nextErrors
    })
  }

  const updateSimpleProductGeneral = (general: Partial<SimpleProduct['general']>) => {
    const fieldsToClear: Array<keyof SimpleProductValidationErrors> = []

    if ('name' in general) {
      fieldsToClear.push('name')
    }

    if ('shortDescription' in general) {
      fieldsToClear.push('shortDescription')
    }

    if ('regularPrice' in general) {
      fieldsToClear.push('regularPrice')
    }

    if (fieldsToClear.length > 0) {
      clearSimpleProductErrors(fieldsToClear)
    }

    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      general: {
        ...currentProduct.general,
        ...general,
      },
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const updateSimpleProductInventory = (inventory: Partial<SimpleProduct['inventory']>) => {
    if ('sku' in inventory) {
      clearSimpleProductErrors(['sku'])
    }

    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      inventory: {
        ...currentProduct.inventory,
        ...inventory,
      },
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const updatePrimaryAttribute = (attribute: Partial<ProductAttribute>) => {
    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      attributes: currentProduct.attributes.map((currentAttribute, index) => (
        index === 0
          ? {
              ...currentAttribute,
              ...attribute,
            }
          : currentAttribute
      )),
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const updateSimpleProductImages = (images: ProductImage[]) => {
    const nextImages = images.map((image, index) => ({
      ...image,
      isPrimary: index === 0,
      order: index,
    }))

    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      media: {
        images: nextImages,
      },
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const handleAddProductImageClick = () => {
    productImageInputRef.current?.click()
  }

  const processProductImageFiles = (files: File[]) => {
    const selectedFiles = files.filter((file) => file.type.startsWith('image/'))

    if (selectedFiles.length === 0) {
      return
    }

    try {
      const uploadedImages = selectedFiles.map((file, index): ProductImage => {
        const previewUrl = URL.createObjectURL(file)

        return {
          id: createClientId('img'),
          url: previewUrl,
          altText: file.name,
          isPrimary: productImages.length === 0 && index === 0,
          order: productImages.length + index,
          localFile: file,
          previewUrl,
        }
      })
      const nextImages = [...productImages, ...uploadedImages]

      updateSimpleProductImages(nextImages)
      setActiveProductImageId(uploadedImages[0].id)
      setProductImageCarouselStart(Math.max(0, nextImages.length - 4))
    } catch (error) {
      setProductModalError(error instanceof Error ? error.message : 'No fue posible agregar la imagen.')
    }
  }

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    processProductImageFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const handleProductImageDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    processProductImageFiles(Array.from(event.dataTransfer.files ?? []))
  }

  const handleProductImageDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
  }

  const getProductImageDisplayUrl = (image: ProductImage) => (
    image.previewUrl ?? productImageObjectUrls[image.id] ?? resolveApiUrl(apiBaseUrl, image.url)
  )

  const handleSelectProductImage = (imageId: string) => {
    setActiveProductImageId(imageId)
    setIsProductImageExpanded(false)
  }

  const handleOpenProductImageExpanded = () => {
    if (activeProductImage) {
      setIsProductImageExpanded(true)
    }
  }

  const handleCloseProductImageExpanded = () => {
    setIsProductImageExpanded(false)
  }

  const handlePreviousProductImage = () => {
    if (!activeProductImage) {
      return
    }

    const currentIndex = productImages.findIndex((image) => image.id === activeProductImage.id)
    const previousIndex = currentIndex <= 0 ? productImages.length - 1 : currentIndex - 1

    setActiveProductImageId(productImages[previousIndex]?.id ?? null)
  }

  const handleNextProductImage = () => {
    if (!activeProductImage) {
      return
    }

    const currentIndex = productImages.findIndex((image) => image.id === activeProductImage.id)
    const nextIndex = currentIndex >= productImages.length - 1 ? 0 : currentIndex + 1

    setActiveProductImageId(productImages[nextIndex]?.id ?? null)
  }

  const handlePreviousSelectedProductImage = () => {
    if (!activeSelectedProductImage) {
      return
    }

    const currentIndex = selectedProductImages.findIndex((image) => image.id === activeSelectedProductImage.id)
    const previousIndex = currentIndex <= 0 ? selectedProductImages.length - 1 : currentIndex - 1

    setSelectedProductImageId(selectedProductImages[previousIndex]?.id ?? null)
  }

  const handleNextSelectedProductImage = () => {
    if (!activeSelectedProductImage) {
      return
    }

    const currentIndex = selectedProductImages.findIndex((image) => image.id === activeSelectedProductImage.id)
    const nextIndex = currentIndex >= selectedProductImages.length - 1 ? 0 : currentIndex + 1

    setSelectedProductImageId(selectedProductImages[nextIndex]?.id ?? null)
  }

  const handleDeleteActiveProductImage = () => {
    if (!activeProductImage) {
      return
    }

    const activeImageIndex = productImages.findIndex((image) => image.id === activeProductImage.id)
    const nextImages = productImages.filter((image) => image.id !== activeProductImage.id)
    const nextActiveImage = nextImages[activeImageIndex] ?? nextImages[activeImageIndex - 1] ?? nextImages[0] ?? null

    if (activeProductImage.previewUrl) {
      URL.revokeObjectURL(activeProductImage.previewUrl)
    }

    if (!isLocalProductImage(activeProductImage)) {
      setDeletedProductImageIds((currentImageIds) => (
        currentImageIds.includes(activeProductImage.id)
          ? currentImageIds
          : [...currentImageIds, activeProductImage.id]
      ))
    }

    updateSimpleProductImages(nextImages)
    setActiveProductImageId(nextActiveImage?.id ?? null)
    setProductImageCarouselStart((currentStart) => Math.min(currentStart, Math.max(0, nextImages.length - 4)))
    setIsProductImageExpanded(false)
  }

  const uploadProductImage = async (
    productId: string,
    image: ProductImage,
    requestOptions: ApiRequestOptions,
  ) => {
    if (!image.localFile) {
      return image
    }

    const formData = new FormData()
    formData.append('file', image.localFile, image.localFile.name)

    return requestArticulosApi<ProductImage>(
      requestOptions,
      `/${productId}/imagenes`,
      {
        method: 'POST',
        body: formData,
      },
    )
  }

  const syncProductImages = async (
    productId: string,
    images: ProductImage[],
    requestOptions: ApiRequestOptions,
  ) => {
    for (const imageId of deletedProductImageIds) {
      await requestArticulosApi<SimpleProduct>(
        requestOptions,
        `/${productId}/imagenes/${imageId}`,
        { method: 'DELETE' },
      )
    }

    const persistedImages: ProductImage[] = []

    for (const image of images) {
      const persistedImage = isLocalProductImage(image)
        ? await uploadProductImage(productId, image, requestOptions)
        : image

      persistedImages.push({
        id: persistedImage.id,
        url: persistedImage.url,
        altText: persistedImage.altText,
        isPrimary: persistedImages.length === 0,
        order: persistedImages.length,
      })
    }

    const orderedProduct = await requestArticulosApi<SimpleProduct>(
      requestOptions,
      `/${productId}/imagenes`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          images: persistedImages.map((image, index) => ({
            id: image.id,
            isPrimary: index === 0,
          })),
        }),
      },
    )

    setDeletedProductImageIds([])

    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }
    })

    return orderedProduct
  }

  const handleTrackInventoryChange = (isTracked: boolean) => {
    updateSimpleProductInventory({
      trackingMode: isTracked ? 'tracked' : 'untracked',
      quantity: isTracked ? simpleProductDraft.inventory.quantity ?? 1 : null,
      reservationPolicy: isTracked ? simpleProductDraft.inventory.reservationPolicy ?? 'disabled' : null,
      lowStockThreshold: isTracked ? simpleProductDraft.inventory.lowStockThreshold : null,
      stockStatus: isTracked ? 'in_stock' : simpleProductDraft.inventory.stockStatus,
    })
  }

  const buildSimpleProductToSave = (): SimpleProduct => {
    const now = new Date().toISOString()

    return {
      ...simpleProductDraft,
      general: {
        ...simpleProductDraft.general,
        name: simpleProductDraft.general.name.trim(),
        shortDescription: simpleProductDraft.general.shortDescription.trim(),
        longDescription: simpleProductDraft.general.longDescription.trim(),
      },
      inventory: {
        ...simpleProductDraft.inventory,
        sku: simpleProductDraft.inventory.sku.trim(),
      },
      attributes: simpleProductDraft.attributes
        .map((attribute) => ({
          ...attribute,
          name: attribute.name.trim(),
          values: attribute.values.map((value) => value.trim()).filter(Boolean),
        }))
        .filter((attribute) => attribute.name || attribute.values.length > 0),
      metadata: {
        ...simpleProductDraft.metadata,
        updatedAt: now,
      },
    }
  }

  const buildProductWritePayload = (product: SimpleProduct, includeMedia = false): ProductWritePayload => ({
    type: 'simple',
    general: product.general,
    inventory: {
      ...product.inventory,
      quantity: product.inventory.trackingMode === 'tracked' ? product.inventory.quantity : null,
      reservationPolicy: product.inventory.trackingMode === 'tracked' ? product.inventory.reservationPolicy : null,
      lowStockThreshold: product.inventory.trackingMode === 'tracked' ? product.inventory.lowStockThreshold : null,
    },
    attributes: [],
    ...(includeMedia
      ? {
          media: {
            images: product.media.images
              .filter((image) => !isLocalProductImage(image))
              .map((image, index) => ({
                id: image.id,
                url: image.url,
                altText: image.altText,
                isPrimary: index === 0,
                order: index,
              })),
          },
        }
      : {}),
  })

  const validateSimpleProductGeneral = (product: SimpleProduct) => {
    const validationErrors: SimpleProductValidationErrors = {}

    if (!product.general.name) {
      validationErrors.name = 'El nombre del producto es obligatorio.'
    }

    if (!product.general.shortDescription) {
      validationErrors.shortDescription = 'La descripción corta es obligatoria.'
    }

    if (product.general.regularPrice === null) {
      validationErrors.regularPrice = 'El precio regular es obligatorio.'
    }

    return validationErrors
  }

  const validateSimpleProductInventory = (product: SimpleProduct) => {
    const validationErrors: SimpleProductValidationErrors = {}

    if (!product.inventory.sku) {
      validationErrors.sku = 'El SKU es obligatorio.'
    }

    return validationErrors
  }

  const handleProductModalPrimaryAction = async () => {
    const productToSave = buildSimpleProductToSave()

    if (activeProductTab === 'general') {
      const validationErrors = validateSimpleProductGeneral(productToSave)

      if (Object.keys(validationErrors).length > 0) {
        setSimpleProductErrors(validationErrors)

        return
      }

      clearSimpleProductErrors(['name', 'shortDescription', 'regularPrice'])
      setActiveProductTab('inventario')

      return
    }

    if (activeProductTab === 'inventario') {
      const validationErrors = validateSimpleProductInventory(productToSave)

      if (Object.keys(validationErrors).length > 0) {
        setSimpleProductErrors(validationErrors)

        return
      }

      clearSimpleProductErrors(['sku'])
      setActiveProductTab('atributos')

      return
    }

    const validationErrors = {
      ...validateSimpleProductGeneral(productToSave),
      ...validateSimpleProductInventory(productToSave),
    }

    if (Object.keys(validationErrors).length > 0) {
      setSimpleProductErrors(validationErrors)
      setActiveProductTab(validationErrors.name || validationErrors.shortDescription || validationErrors.regularPrice ? 'general' : 'inventario')

      return
    }

    if (!apiRequestOptions) {
      setProductModalError('Inicia sesión para guardar artículos.')

      return
    }

    setIsSavingProduct(true)
    setApiError(null)

    if (productModalMode === 'edit') {
      try {
        const updatedProductWithoutImages = await requestArticulosApi<SimpleProduct>(
          apiRequestOptions,
          `/${productToSave.id}/editar`,
          {
            method: 'PATCH',
            body: JSON.stringify(buildProductWritePayload(productToSave)),
          },
        )
        const updatedProduct = await syncProductImages(
          updatedProductWithoutImages.id,
          productImages,
          apiRequestOptions,
        )

        replaceProductInList(updatedProduct)
      } catch (error) {
        setProductModalError(error instanceof Error ? error.message : 'No fue posible actualizar el artículo.')
        setIsSavingProduct(false)

        return
      }
    } else {
      try {
        const createdProduct = await requestArticulosApi<SimpleProduct>(
          apiRequestOptions,
          '/agregar',
          {
            method: 'POST',
            body: JSON.stringify(buildProductWritePayload(productToSave, true)),
          },
        )
        const productWithImages = await syncProductImages(
          createdProduct.id,
          productImages,
          apiRequestOptions,
        )

        setSelectedProductId(productWithImages.id)
        setCurrentProductPage(1)
        fetchProducts(1, activeSearchQuery)
      } catch (error) {
        setProductModalError(error instanceof Error ? error.message : 'No fue posible crear el artículo.')
        setIsSavingProduct(false)

        return
      }
    }

    setSimpleProductDraft(createEmptySimpleProduct())
    setSimpleProductErrors({})
    setActiveProductTab('general')
    setProductModalMode('create')
    setDeletedProductImageIds([])
    setProductImageObjectUrls({})
    clearAdjustment()
    setIsSavingProduct(false)
    handleCloseActionModal()
  }

  const renderProductImagePanel = (variant: 'full' | 'compact' = 'full') => (
    <aside className={`articulos-ui__product-image-panel articulos-ui__product-image-panel--${variant}`}>
      <input
        accept='image/*'
        className='articulos-ui__product-image-input'
        multiple
        onChange={handleProductImageUpload}
        ref={productImageInputRef}
        type='file'
      />
      <header className='articulos-ui__product-image-header'>
        {variant === 'full' && <h3>Imágenes del producto</h3>}
        <button className='articulos-ui__product-image-button' onClick={handleAddProductImageClick} type='button'>
          <span aria-hidden='true'>+</span>
          Agregar imagen
        </button>
      </header>

      {variant === 'full' && (
        <button
          className='articulos-ui__product-image-dropzone'
          onClick={handleAddProductImageClick}
          onDragOver={handleProductImageDragOver}
          onDrop={handleProductImageDrop}
          type='button'
        >
          <span className='articulos-ui__product-image-drop-icon' aria-hidden='true'>▧</span>
          <span>
            <strong>Arrastra y suelta imágenes aquí</strong>
            <small>o selecciona archivos desde tu dispositivo</small>
          </span>
        </button>
      )}

      <div className='articulos-ui__product-image-preview' aria-label='Vista previa de imagen del producto'>
        {activeProductImage ? (
          <>
            <button
              aria-label='Eliminar imagen'
              className='articulos-ui__product-image-delete'
              onClick={handleDeleteActiveProductImage}
              type='button'
            >
              ⌫
            </button>
            <div
              aria-label={activeProductImage.altText || simpleProductDraft.general.name || 'Imagen del producto'}
              className='articulos-ui__product-image-canvas'
              role='img'
              style={{ backgroundImage: `url(${getProductImageDisplayUrl(activeProductImage)})` }}
            />
            {activeProductImage.isPrimary && variant === 'full' && (
              <span className='articulos-ui__product-image-primary'>
                <span aria-hidden='true'>★</span>
                Principal
              </span>
            )}
            <div className='articulos-ui__product-image-zoom-layer'>
              <button
                aria-label='Ampliar imagen'
                className='articulos-ui__product-image-zoom'
                onClick={handleOpenProductImageExpanded}
                type='button'
              >
                ⌕
              </button>
            </div>
          </>
        ) : (
          <span aria-hidden='true'>▧</span>
        )}
      </div>

      <div className='articulos-ui__product-thumbs'>
        <button
          className='articulos-ui__product-thumbs-arrow'
          disabled={productImages.length < 2}
          onClick={handlePreviousProductImage}
          type='button'
          aria-label='Imagen anterior'
        >
          ‹
        </button>
        {Array.from({ length: 4 }).map((_, index) => {
          const image = visibleProductImages[index]

          return image ? (
            <button
              aria-label={`Seleccionar imagen ${productImageCarouselStart + index + 1}`}
              className={`articulos-ui__product-thumb ${activeProductImage?.id === image.id ? 'articulos-ui__product-thumb--active' : ''}`}
              key={image.id}
              onClick={() => handleSelectProductImage(image.id)}
              type='button'
            >
              <img src={getProductImageDisplayUrl(image)} alt={image.altText || `Imagen ${productImageCarouselStart + index + 1}`} />
              {image.isPrimary && <span aria-hidden='true'>★</span>}
            </button>
          ) : (
            <button
              aria-label='Agregar imagen'
              className='articulos-ui__product-thumb articulos-ui__product-thumb--empty'
              key={`empty-${index}`}
              onClick={handleAddProductImageClick}
              type='button'
            >
              +
            </button>
          )
        })}
        <button
          className='articulos-ui__product-thumbs-arrow'
          disabled={productImages.length < 2}
          onClick={handleNextProductImage}
          type='button'
          aria-label='Imagen siguiente'
        >
          ›
        </button>
      </div>

      {variant === 'full' && (
        <p className='articulos-ui__product-image-count'>
          {productImages.length === 0 ? '0 de 4 imágenes' : `${Math.min(productImageCarouselStart + 1, productImages.length)} de ${productImages.length} imágenes`}
        </p>
      )}
    </aside>
  )

  const productPrimaryActionLabel = activeProductTab === 'atributos' ? 'Guardar' : 'Guardar y continuar'
  const productModalModeLabel = productModalMode === 'edit' ? 'Editar' : 'Agregar'
  const resultsEmptyMessage = isLoadingProducts
    ? 'Cargando artículos...'
    : apiError ?? 'Sin coincidencias para mostrar.'

  return (
    <section className='articulos-ui'>
      <header className='articulos-ui__topbar'>
        {topActions.map((action) => {
          const isActionDisabled = (
            isLoadingProducts ||
            isSavingProduct ||
            isDeletingProduct ||
            isAdjustingProduct ||
            (action.id === 'eliminar' && Boolean(pendingDeleteProductId))
          )

          return (
            <button
              key={action.id}
              className='articulos-ui__top-action'
              onClick={() => handleOpenActionModal(action.id)}
              disabled={isActionDisabled}
              type='button'
            >
              <span className='articulos-ui__top-icon' aria-hidden='true'>
                {action.icon}
              </span>
              <span className='articulos-ui__top-text'>
                {action.label} {action.shortcut}
              </span>
            </button>
          )
        })}
      </header>

      <div className='articulos-ui__main-wrap'>
        <div className='articulos-ui__main'>
          <section className='articulos-ui__left-column'>
            <div className='articulos-ui__search-row'>
              <button type='button' className='articulos-ui__search-filter' aria-label='Filtrar búsqueda'>
                🔻
              </button>
              <input
                className='articulos-ui__search-input'
                type='text'
                placeholder='Ingresa código de barras, folio o nombre del artículo que quieres consultar.'
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearchProducts()
                  }
                }}
              />
              <button
                type='button'
                className='articulos-ui__search-button'
                aria-label='Buscar artículo'
                disabled={isLoadingProducts}
                onClick={handleSearchProducts}
              >
                🔎
              </button>
            </div>

            <div className='articulos-ui__results'>
              <div className='articulos-ui__results-head' role='row'>
                {resultColumns.map((column) => (
                  <div key={column.id} className={`articulos-ui__results-cell ${column.className ?? ''}`} role='columnheader'>
                    {column.label ?? (
                      <span aria-hidden='true' className='articulos-ui__head-icon'>
                        {column.icon}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className='articulos-ui__results-body' role='rowgroup'>
                {simpleProducts.length === 0 ? (
                  <p className='articulos-ui__results-empty'>{resultsEmptyMessage}</p>
                ) : (
                  paginatedProducts.map((product) => {
                    const isProductSelected = selectedProductId === product.id
                    const isProductDeletePending = pendingDeleteProductId === product.id

                    return (
                      <div
                        aria-label={isProductDeletePending ? 'Cancelar eliminación del artículo' : undefined}
                        aria-selected={isProductSelected}
                        className={`articulos-ui__results-row ${isProductSelected ? 'articulos-ui__results-row--selected' : ''} ${isProductDeletePending ? 'articulos-ui__results-row--deleting' : ''}`}
                        key={product.id}
                        onClick={() => handleSelectProduct(product.id)}
                        onDoubleClick={() => handleEditProduct(product)}
                        role='row'
                      >
                      <div className='articulos-ui__results-data articulos-ui__results-cell--description' role='cell'>
                        <strong>{product.inventory.sku || product.id}</strong>
                        <span>{product.general.name || 'Producto sin nombre'}</span>
                      </div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--stock' role='cell'>
                        {adjustingProductId === product.id ? (
                          <div
                            className='articulos-ui__stock-adjuster'
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                          >
                            <input
                              aria-invalid={Boolean(adjustmentError)}
                              aria-label='Nueva cantidad de existencias'
                              className='articulos-ui__stock-adjuster-input'
                              disabled={isAdjustingProduct}
                              inputMode='numeric'
                              onChange={(event) => {
                                setAdjustmentQuantityDraft(event.target.value)
                                setAdjustmentError(null)
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault()
                                  confirmProductAdjustment()
                                }

                                if (event.key === 'Escape') {
                                  event.preventDefault()
                                  clearAdjustment()
                                }
                              }}
                              type='text'
                              value={adjustmentQuantityDraft}
                            />
                          </div>
                        ) : (
                          product.inventory.quantity ?? '-'
                        )}
                      </div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--price' role='cell'>
                        {formatProductPrice(product.general.regularPrice)}
                      </div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--icon' role='cell'>-</div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--icon' role='cell'>-</div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--icon' role='cell'>-</div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--icon' role='cell'>-</div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--icon' role='cell'>-</div>
                      {isProductDeletePending ? (
                        <span className='articulos-ui__results-row-cancel' aria-hidden='true'>
                          Cancelar
                        </span>
                      ) : null}
                    </div>
                    )
                  })
                )}
              </div>
            </div>

            <footer className='articulos-ui__pagination'>
              <button
                aria-label='Página anterior'
                className='articulos-ui__page-arrow'
                disabled={!canGoToPreviousProductPage}
                onClick={handlePreviousProductPage}
                type='button'
              >
                ◀
              </button>

              <div className='articulos-ui__page-meta'>
                <span className='articulos-ui__page-label'>Página</span>
                <input className='articulos-ui__page-input' type='text' value={currentProductPageLabel} readOnly />
                <span className='articulos-ui__page-separator'>de</span>
                <input className='articulos-ui__page-input' type='text' value={totalProductPages} readOnly />
              </div>

              <button
                aria-label='Página siguiente'
                className='articulos-ui__page-arrow'
                disabled={!canGoToNextProductPage}
                onClick={handleNextProductPage}
                type='button'
              >
                ▶
              </button>
            </footer>
          </section>

          <aside className='articulos-ui__right-column'>
            <h2 className='articulos-ui__detail-title'>Artículo Seleccionado</h2>

            <div className='articulos-ui__preview'>
              <button
                type='button'
                className='articulos-ui__preview-arrow'
                aria-label='Imagen anterior'
                disabled={selectedProductImages.length < 2}
                onClick={handlePreviousSelectedProductImage}
              >
                ❮
              </button>
              <div className='articulos-ui__preview-placeholder' aria-label='Imagen del artículo'>
                {activeSelectedProductImage ? (
                  <div
                    aria-label={activeSelectedProductImage.altText || selectedProduct?.general.name || 'Imagen del artículo'}
                    className='articulos-ui__preview-image'
                    role='img'
                    style={{ backgroundImage: `url(${getProductImageDisplayUrl(activeSelectedProductImage)})` }}
                  />
                ) : (
                  <span aria-hidden='true'>📷</span>
                )}
              </div>
              <button
                type='button'
                className='articulos-ui__preview-arrow'
                aria-label='Imagen siguiente'
                disabled={selectedProductImages.length < 2}
                onClick={handleNextSelectedProductImage}
              >
                ❯
              </button>
            </div>

            {selectedProduct ? (
              <dl className='articulos-ui__detail-list'>
                <div>
                  <dt>SKU</dt>
                  <dd>{selectedProduct.inventory.sku}</dd>
                </div>
                <div>
                  <dt>Nombre</dt>
                  <dd>{selectedProduct.general.name}</dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>{formatProductPrice(selectedProduct.general.regularPrice)}</dd>
                </div>
                <div>
                  <dt>Existencias</dt>
                  <dd>{selectedProduct.inventory.quantity ?? '-'}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{stockStatusLabels[selectedProduct.inventory.stockStatus]}</dd>
                </div>
              </dl>
            ) : (
              <div className='articulos-ui__detail-empty'>
                <span>-</span>
                <span>-</span>
              </div>
            )}
          </aside>
        </div>
      </div>

      {topActions.map((action) => {
        const modalContent = actionModalContent[action.id]

        if (action.id === 'agregar') {
          return (
            <Modal
              key={action.id}
              isOpen={isProductModalOpen}
              onClose={handleCloseActionModal}
              width='calc(100vw - 40px)'
              maxWidth='calc(100vw - 40px)'
              height='calc(100vh - 40px)'
              showCloseButton={false}
              className='articulos-ui__product-modal-shell'
              bodyClassName='articulos-ui__product-modal-body'
            >
              <div className='articulos-ui__product-modal'>
                <header className='articulos-ui__product-modal-header'>
                  <div className='articulos-ui__product-modal-title-row'>
                    <span className='articulos-ui__product-modal-icon' aria-hidden='true'>▧</span>
                    <h2 className='articulos-ui__product-modal-title'>Datos del producto</h2>
                    <span className='articulos-ui__product-modal-mode' aria-hidden='true'>•</span>
                    <span className='articulos-ui__product-modal-mode'>{productModalModeLabel}</span>
                  </div>

                  <div className='articulos-ui__product-modal-controls'>
                    <label className='articulos-ui__product-type-label'>
                      <span className='articulos-ui__product-type-text'>Tipo de producto</span>
                      <select
                        className='articulos-ui__product-type-select'
                        value={productType}
                        onChange={(event) => setProductType(event.target.value as ProductTypeOption)}
                      >
                        {productTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      aria-label='Cerrar ventana modal'
                      className='articulos-ui__product-modal-close'
                      onClick={handleCloseActionModal}
                      type='button'
                    >
                      ×
                    </button>
                  </div>
                </header>

                <main className='articulos-ui__product-modal-main'>
                  <nav className='articulos-ui__product-tabs' aria-label='Secciones del producto'>
                    {productTabs.map((tab) => (
                      <button
                        key={tab.id}
                        className={`articulos-ui__product-tab ${activeProductTab === tab.id ? 'articulos-ui__product-tab--active' : ''}`}
                        onClick={() => setActiveProductTab(tab.id)}
                        type='button'
                      >
                        <span className='articulos-ui__product-tab-icon' aria-hidden='true'>
                          {tab.id === 'general' ? '▤' : tab.id === 'inventario' ? '□' : '◇'}
                        </span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>

                  <div className='articulos-ui__product-tab-panel'>
                      {activeProductTab === 'general' ? (
                        <div className='articulos-ui__product-general-layout'>
                          <div className='articulos-ui__product-general-grid'>
                            <label className='articulos-ui__product-field'>
                              <span className='articulos-ui__product-label'>
                                Nombre del producto <span className='articulos-ui__product-required'>*</span>
                              </span>
                              <input
                                aria-invalid={Boolean(simpleProductErrors.name)}
                                className='articulos-ui__product-input'
                                onChange={(event) => updateSimpleProductGeneral({ name: event.target.value })}
                                required
                                type='text'
                                value={simpleProductDraft.general.name}
                              />
                              {simpleProductErrors.name && (
                                <span className='articulos-ui__product-error'>{simpleProductErrors.name}</span>
                              )}
                            </label>

                            <label className='articulos-ui__product-field'>
                              <span className='articulos-ui__product-label'>Descripción corta</span>
                              <input
                                aria-invalid={Boolean(simpleProductErrors.shortDescription)}
                                className='articulos-ui__product-input'
                                maxLength={SHORT_DESCRIPTION_MAX_LENGTH}
                                onChange={(event) => updateSimpleProductGeneral({ shortDescription: event.target.value })}
                                required
                                type='text'
                                value={simpleProductDraft.general.shortDescription}
                              />
                              <span className='articulos-ui__product-counter'>
                                {simpleProductDraft.general.shortDescription.length}/{SHORT_DESCRIPTION_MAX_LENGTH}
                              </span>
                              {simpleProductErrors.shortDescription && (
                                <span className='articulos-ui__product-error'>{simpleProductErrors.shortDescription}</span>
                              )}
                            </label>

                            <label className='articulos-ui__product-field'>
                              <span className='articulos-ui__product-label'>Descripción amplia</span>
                              <textarea
                                className='articulos-ui__product-textarea'
                                maxLength={LONG_DESCRIPTION_MAX_LENGTH}
                                onChange={(event) => updateSimpleProductGeneral({ longDescription: event.target.value })}
                                value={simpleProductDraft.general.longDescription}
                              />
                              <span className='articulos-ui__product-counter'>
                                {simpleProductDraft.general.longDescription.length}/{LONG_DESCRIPTION_MAX_LENGTH}
                              </span>
                            </label>

                            <div className='articulos-ui__product-price-grid'>
                              <label className='articulos-ui__product-price-field'>
                                <span className='articulos-ui__product-label'>
                                  Precio regular <span className='articulos-ui__product-required'>*</span>
                                </span>
                                <span className='articulos-ui__product-price-input-wrap'>
                                  <span className='articulos-ui__product-price-prefix' aria-hidden='true'>$</span>
                                  <input
                                    aria-invalid={Boolean(simpleProductErrors.regularPrice)}
                                    className='articulos-ui__product-input articulos-ui__product-input--price'
                                    inputMode='decimal'
                                    onChange={(event) => updateSimpleProductGeneral({ regularPrice: parseNumberInput(event.target.value) })}
                                    required
                                    type='text'
                                    value={simpleProductDraft.general.regularPrice ?? ''}
                                  />
                                </span>
                                {simpleProductErrors.regularPrice && (
                                  <span className='articulos-ui__product-error'>{simpleProductErrors.regularPrice}</span>
                                )}
                              </label>

                              <label className='articulos-ui__product-price-field'>
                                <span className='articulos-ui__product-label'>Precio rebajado</span>
                                <span className='articulos-ui__product-price-input-wrap'>
                                  <span className='articulos-ui__product-price-prefix' aria-hidden='true'>$</span>
                                  <input
                                    className='articulos-ui__product-input articulos-ui__product-input--price'
                                    inputMode='decimal'
                                    onChange={(event) => updateSimpleProductGeneral({ salePrice: parseNumberInput(event.target.value) })}
                                    type='text'
                                    value={simpleProductDraft.general.salePrice ?? ''}
                                  />
                                </span>
                              </label>
                            </div>

                            <p className='articulos-ui__product-price-note'>
                              <span aria-hidden='true'>i</span>
                              Si el precio rebajado está vacío, el producto no tendrá descuento.
                            </p>
                          </div>

                          {renderProductImagePanel()}
                        </div>
                      ) : activeProductTab === 'inventario' ? (
                        <div className='articulos-ui__inventory-layout'>
                          <div className='articulos-ui__inventory-form'>
                          <label className='articulos-ui__inventory-field'>
                            <span className='articulos-ui__inventory-label articulos-ui__inventory-label--link'>SKU</span>
                            <input
                              aria-invalid={Boolean(simpleProductErrors.sku)}
                              className='articulos-ui__inventory-input'
                              onChange={(event) => updateSimpleProductInventory({ sku: event.target.value })}
                              required
                              type='text'
                              value={simpleProductDraft.inventory.sku}
                            />
                            <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre SKU'>
                              ?
                            </button>
                            {simpleProductErrors.sku && (
                              <span className='articulos-ui__inventory-error'>{simpleProductErrors.sku}</span>
                            )}
                          </label>

                          <div className='articulos-ui__inventory-field articulos-ui__inventory-field--check'>
                            <span className='articulos-ui__inventory-label'>Gestión de inventario</span>
                            <label className='articulos-ui__inventory-check-label'>
                              <input
                                checked={trackInventory}
                                className='articulos-ui__inventory-checkbox'
                                onChange={(event) => handleTrackInventoryChange(event.target.checked)}
                                type='checkbox'
                              />
                              <span>Hacer seguimiento de la cantidad de inventario de este producto</span>
                            </label>
                          </div>

                          {trackInventory ? (
                            <>
                              <label className='articulos-ui__inventory-field'>
                                <span className='articulos-ui__inventory-label'>Cantidad</span>
                                <input
                                  className='articulos-ui__inventory-input'
                                  min='0'
                                  onChange={(event) => updateSimpleProductInventory({ quantity: parseNumberInput(event.target.value) })}
                                  type='number'
                                  value={simpleProductDraft.inventory.quantity ?? ''}
                                />
                                <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre cantidad'>
                                  ?
                                </button>
                              </label>

                              <fieldset className='articulos-ui__inventory-field articulos-ui__inventory-reservations'>
                                <legend className='articulos-ui__inventory-label'>¿Permitir reservas?</legend>
                                <div className='articulos-ui__inventory-radio-stack'>
                                  <label className='articulos-ui__inventory-radio-label'>
                                    <input
                                      checked={simpleProductDraft.inventory.reservationPolicy === 'disabled'}
                                      name='inventory-reservations'
                                      onChange={() => updateSimpleProductInventory({ reservationPolicy: 'disabled' })}
                                      type='radio'
                                    />
                                    <span>No permitir</span>
                                  </label>
                                  <label className='articulos-ui__inventory-radio-label'>
                                    <input
                                      checked={simpleProductDraft.inventory.reservationPolicy === 'allowed'}
                                      name='inventory-reservations'
                                      onChange={() => updateSimpleProductInventory({ reservationPolicy: 'allowed' })}
                                      type='radio'
                                    />
                                    <span>Permitir</span>
                                  </label>
                                </div>
                              </fieldset>

                              <label className='articulos-ui__inventory-field'>
                                <span className='articulos-ui__inventory-label'>Umbral de pocos productos (1)</span>
                                <input
                                  className='articulos-ui__inventory-input'
                                  onChange={(event) => updateSimpleProductInventory({ lowStockThreshold: parseNumberInput(event.target.value) })}
                                  type='text'
                                  value={simpleProductDraft.inventory.lowStockThreshold ?? ''}
                                />
                                <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre umbral de pocas existencias'>
                                  ?
                                </button>
                              </label>
                            </>
                          ) : (
                            <fieldset className='articulos-ui__inventory-field articulos-ui__inventory-reservations'>
                              <legend className='articulos-ui__inventory-label'>Estado de inventario</legend>
                              <div className='articulos-ui__inventory-radio-stack'>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input
                                    checked={simpleProductDraft.inventory.stockStatus === 'in_stock'}
                                    name='inventory-status'
                                    onChange={() => updateSimpleProductInventory({ stockStatus: 'in_stock' })}
                                    type='radio'
                                  />
                                  <span>Hay existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input
                                    checked={simpleProductDraft.inventory.stockStatus === 'out_of_stock'}
                                    name='inventory-status'
                                    onChange={() => updateSimpleProductInventory({ stockStatus: 'out_of_stock' })}
                                    type='radio'
                                  />
                                  <span>Sin existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input
                                    checked={simpleProductDraft.inventory.stockStatus === 'backorder'}
                                    name='inventory-status'
                                    onChange={() => updateSimpleProductInventory({ stockStatus: 'backorder' })}
                                    type='radio'
                                  />
                                  <span>Se puede reservar</span>
                                </label>
                              </div>
                              <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre estado de inventario'>
                                ?
                              </button>
                            </fieldset>
                          )}
                          </div>

                          {renderProductImagePanel('compact')}
                        </div>
                      ) : (
                        <div className='articulos-ui__attributes-form'>
                          <header className='articulos-ui__attributes-toolbar'>
                            <div className='articulos-ui__attributes-actions'>
                              <button className='articulos-ui__attributes-button articulos-ui__attributes-button--primary' type='button'>
                                Añadir nuevo
                              </button>
                              <button className='articulos-ui__attributes-select' type='button'>
                                <span>Añadir existente</span>
                                <span aria-hidden='true'>⌄</span>
                              </button>
                            </div>
                            <button className='articulos-ui__attributes-link' type='button'>
                              Ampliar / Cerrar
                            </button>
                          </header>

                          <section className='articulos-ui__attribute-card'>
                            <header className='articulos-ui__attribute-card-head'>
                              <h3>Atributo nuevo</h3>
                              <div className='articulos-ui__attribute-card-actions'>
                                <button className='articulos-ui__attribute-delete' type='button'>
                                  Eliminar
                                </button>
                                <button className='articulos-ui__attribute-icon-button' type='button' aria-label='Reordenar atributo'>
                                  ≡
                                </button>
                                <button className='articulos-ui__attribute-icon-button' type='button' aria-label='Contraer atributo'>
                                  ▴
                                </button>
                              </div>
                            </header>

                            <div className='articulos-ui__attribute-fields'>
                              <div className='articulos-ui__attribute-left'>
                                <label className='articulos-ui__attribute-field'>
                                  <span>Nombre:</span>
                                  <input
                                    className='articulos-ui__attribute-input'
                                    onChange={(event) => updatePrimaryAttribute({ name: event.target.value })}
                                    type='text'
                                    placeholder='por ejemplo, la longitud o el peso'
                                    value={primaryAttribute.name}
                                  />
                                </label>

                                <label className='articulos-ui__attribute-visible'>
                                  <input
                                    checked={primaryAttribute.visible}
                                    onChange={(event) => updatePrimaryAttribute({ visible: event.target.checked })}
                                    type='checkbox'
                                  />
                                  <span>Visible en la página de productos</span>
                                </label>
                              </div>

                              <label className='articulos-ui__attribute-field articulos-ui__attribute-field--values'>
                                <span>Valor(es):</span>
                                <textarea
                                  className='articulos-ui__attribute-textarea'
                                  onChange={(event) => updatePrimaryAttribute({
                                    values: event.target.value.split('|').map((value) => value.trim()),
                                  })}
                                  placeholder='Introduce un texto descriptivo. Utiliza «|» para separar los distintos valores.'
                                  value={primaryAttribute.values.join(' | ')}
                                />
                              </label>
                            </div>

                            <footer className='articulos-ui__attribute-footer'>
                              <button className='articulos-ui__attribute-save' type='button' disabled>
                                Guardar atributos
                              </button>
                              <button className='articulos-ui__attributes-link' type='button'>
                                Ampliar / Cerrar
                              </button>
                            </footer>
                          </section>
                        </div>
                      )}
                  </div>
                </main>

                <footer className='articulos-ui__product-modal-footer'>
                  <button
                    className='articulos-ui__product-save'
                    disabled={isSavingProduct}
                    onClick={handleProductModalPrimaryAction}
                    type='button'
                  >
                    {isSavingProduct ? 'Guardando...' : productPrimaryActionLabel}
                  </button>
                </footer>

                {activeProductImage && isProductImageExpanded && (
                  <div
                    className='articulos-ui__product-image-expanded'
                    role='dialog'
                    aria-modal='true'
                    aria-label={activeProductImage.altText || simpleProductDraft.general.name || 'Imagen ampliada'}
                  >
                    <button
                      aria-label='Cerrar imagen ampliada'
                      className='articulos-ui__product-image-expanded-close'
                      onClick={handleCloseProductImageExpanded}
                      type='button'
                    >
                      ×
                    </button>
                    <img
                      alt={activeProductImage.altText || simpleProductDraft.general.name || 'Imagen ampliada'}
                      className='articulos-ui__product-image-expanded-img'
                      src={getProductImageDisplayUrl(activeProductImage)}
                    />
                  </div>
                )}
              </div>
            </Modal>
          )
        }

        if (action.id === 'editar') {
          return null
        }

        return (
          <Modal
            key={action.id}
            isOpen={openActionId === action.id}
            onClose={handleCloseActionModal}
            title={modalContent.title}
            width='min(92vw, 520px)'
          >
            <div className='articulos-ui__action-modal'>
              <div className='articulos-ui__action-modal-icon' aria-hidden='true'>
                {action.icon}
              </div>
              <div className='articulos-ui__action-modal-copy'>
                <p className='articulos-ui__action-modal-text'>{modalContent.description}</p>
                <p className='articulos-ui__action-modal-shortcut'>
                  Acceso rápido: <strong>{action.shortcut}</strong>
                </p>
              </div>

              <div className='articulos-ui__action-modal-actions'>
                <button
                  className='articulos-ui__action-modal-button articulos-ui__action-modal-button--primary'
                  onClick={handleCloseActionModal}
                  type='button'
                >
                  Continuar
                </button>
                <button
                  className='articulos-ui__action-modal-button'
                  onClick={handleCloseActionModal}
                  type='button'
                >
                  Cerrar
                </button>
              </div>
            </div>
          </Modal>
        )
      })}

      <Modal
        isOpen={Boolean(productModalError)}
        onClose={handleCloseProductModalError}
        title='Editar artículo'
        width='min(92vw, 420px)'
      >
        <div className='articulos-ui__action-modal'>
          <p className='articulos-ui__action-modal-text'>{productModalError}</p>

          <div className='articulos-ui__action-modal-actions'>
            <button
              className='articulos-ui__action-modal-button articulos-ui__action-modal-button--primary'
              onClick={handleCloseProductModalError}
              type='button'
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
