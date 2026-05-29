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

type ProductTab = 'general' | 'inventario' | 'atributos' | 'variaciones'
type ProductType = 'simple' | 'variable'
type ProductTypeOption = 'Producto simple' | 'Producto variable' | 'Producto compuesto' | 'Servicio'
type ProductModalMode = 'create' | 'edit'
type InventoryTrackingMode = 'tracked' | 'untracked'
type ReservationPolicy = 'disabled' | 'allowed'
type StockStatus = 'in_stock' | 'out_of_stock' | 'backorder'
type ProductStatus = 'draft' | 'active'

type AttributeCatalogValue = {
  id: string
  attributeId: string
  value: string
  slug: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type AttributeCatalogItem = {
  id: string
  name: string
  slug: string
  sortOrder: number
  values: AttributeCatalogValue[]
  createdAt: string
  updatedAt: string
}

type AttributeCatalogResponse = {
  items: AttributeCatalogItem[]
  page: number
  limit: number
  total: number
}

type ProductAttributeValue = {
  id: string
  value: string
}

type ProductAttribute = {
  id: string
  attributeId: string
  name: string
  values: ProductAttributeValue[]
  visible: boolean
  usedForVariations: boolean
}

type ProductImage = {
  id: string
  url: string
  altText?: string | null
  isPrimary: boolean
  order: number
  localFile?: File
  previewUrl?: string
}

type ProductGeneral = {
  name: string
  shortDescription: string
  longDescription: string
  regularPrice: number | null
  salePrice: number | null
}

type ProductInventory = {
  sku: string
  trackingMode: InventoryTrackingMode
  quantity: number | null
  reservationPolicy: ReservationPolicy | null
  lowStockThreshold: number | null
  stockStatus: StockStatus
}

type ProductMetadata = {
  createdAt: string
  updatedAt: string
  isActive: boolean
  status?: ProductStatus
}

type ProductVariationAttributeValue = {
  attributeId: string
  attributeName: string
  attributeValueId: string
  value: string
}

type ProductVariation = {
  id: string
  sku: string | null
  attributeValues: ProductVariationAttributeValue[]
  media: {
    images: ProductImage[]
  }
  quantity: number | null
  stockStatus: StockStatus
  regularPrice: number | null
  salePrice: number | null
  trackingMode?: InventoryTrackingMode
  reservationPolicy?: ReservationPolicy | null
  lowStockThreshold?: number | null
  isEnabled: boolean
  isActive: boolean
}

type BaseProduct = {
  id: string
  type: ProductType
  general: ProductGeneral
  attributes: ProductAttribute[]
  media: {
    images: ProductImage[]
  }
  metadata: ProductMetadata
}

type SimpleProduct = BaseProduct & {
  type: 'simple'
  inventory: ProductInventory
}

type VariableProduct = BaseProduct & {
  type: 'variable'
  inventory: null
  variations: ProductVariation[]
}

type Product = SimpleProduct | VariableProduct

type SimpleProductValidationErrors = Partial<Record<'name' | 'shortDescription' | 'regularPrice' | 'sku' | 'attributes', string>>

type ProductListResponse = {
  items: Product[]
  page: number
  limit: number
  total: number
}

type ProductWritePayload = {
  type: ProductType
  general: ProductGeneral
  inventory?: ProductInventory
  attributes: Array<{
    attributeId: string
    valueIds: string[]
    visible: boolean
    usedForVariations: boolean
  }>
  media?: {
    images: ProductImage[]
  }
}

type VariationWritePayload = Partial<{
  sku: string | null
  regularPrice: number | null
  salePrice: number | null
  trackingMode: InventoryTrackingMode
  quantity: number | null
  reservationPolicy: ReservationPolicy | null
  lowStockThreshold: number | null
  stockStatus: StockStatus
  isEnabled: boolean
}>

type VariableDraftReadiness = {
  isReady: boolean
  missingCount: number
  requiredCount: number
  variationErrors: Record<string, string>
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
  { id: 'variaciones', label: 'Variaciones' },
]

const productTypeOptions: ProductTypeOption[] = ['Producto simple', 'Producto variable', 'Producto compuesto', 'Servicio']
const PRODUCTS_PER_PAGE = 20
const SHORT_DESCRIPTION_MAX_LENGTH = 150
const LONG_DESCRIPTION_MAX_LENGTH = 1000
const PRODUCT_DELETE_DELAY_MS = 5000

const productTypeOptionToType = (option: ProductTypeOption): ProductType => (
  option === 'Producto variable' ? 'variable' : 'simple'
)

const productTypeToOption = (type: ProductType): ProductTypeOption => (
  type === 'variable' ? 'Producto variable' : 'Producto simple'
)

const isVariableProduct = (product: Product): product is VariableProduct => product.type === 'variable'

const isSimpleProduct = (product: Product): product is SimpleProduct => product.type === 'simple'

const createClientId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const createEmptyProductAttribute = (): ProductAttribute => ({
  id: createClientId('attr'),
  attributeId: '',
  name: '',
  values: [],
  visible: true,
  usedForVariations: false,
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

const createEmptyVariableProduct = (): VariableProduct => {
  const now = new Date().toISOString()

  return {
    id: createClientId('prod'),
    type: 'variable',
    general: {
      name: '',
      shortDescription: '',
      longDescription: '',
      regularPrice: null,
      salePrice: null,
    },
    inventory: null,
    attributes: [
      {
        ...createEmptyProductAttribute(),
        usedForVariations: true,
      },
    ],
    variations: [],
    media: {
      images: [],
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      isActive: true,
      status: 'draft',
    },
  }
}

const createEmptyProductByType = (type: ProductType): Product => (
  type === 'variable' ? createEmptyVariableProduct() : createEmptySimpleProduct()
)

const createEditableProductDraft = (product: Product): Product => ({
  ...product,
  attributes: product.attributes.length > 0 ? product.attributes : [createEmptyProductAttribute()],
  ...(isVariableProduct(product) ? { variations: (product.variations ?? []).map(normalizeProductVariation) } : {}),
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

const formatProductTypeLabel = (product: Product) => (
  isVariableProduct(product) ? 'Variable' : 'Simple'
)

const getProductStatusLabel = (product: Product) => {
  if (isVariableProduct(product)) {
    return product.metadata.status === 'active' ? 'Activo' : 'Borrador'
  }

  return product.metadata.isActive ? 'Activo' : 'Inactivo'
}

const getVariationLabel = (variation: ProductVariation) => (
  variation.attributeValues.map((attributeValue) => `${attributeValue.attributeName}: ${attributeValue.value}`).join(' / ')
)

const normalizeProductVariation = (variation: ProductVariation): ProductVariation => ({
  ...variation,
  media: {
    images: variation.media?.images ?? [],
  },
})

const getEnabledActiveVariations = (product: VariableProduct) => (
  product.variations.filter((variation) => variation.isEnabled && variation.isActive)
)

const getVariableDraftReadiness = (product: VariableProduct): VariableDraftReadiness => {
  const requiredVariations = getEnabledActiveVariations(product)
  const variationErrors: Record<string, string> = {}

  requiredVariations.forEach((variation) => {
    if (!variation.sku?.trim()) {
      variationErrors[variation.id] = 'Captura un SKU para esta variación habilitada.'
    }
  })

  return {
    isReady: requiredVariations.length > 0 && Object.keys(variationErrors).length === 0,
    missingCount: Object.keys(variationErrors).length,
    requiredCount: requiredVariations.length,
    variationErrors,
  }
}

const buildVariationWritePayload = (variation: ProductVariation): VariationWritePayload => ({
  sku: variation.sku?.trim() || null,
  quantity: variation.quantity,
  stockStatus: variation.stockStatus,
  regularPrice: variation.regularPrice,
  salePrice: variation.salePrice,
  isEnabled: variation.isEnabled,
})

const getSharedVariationData = (variation: ProductVariation) => ({
  quantity: variation.quantity,
  stockStatus: variation.stockStatus,
  regularPrice: variation.regularPrice,
  salePrice: variation.salePrice,
  isEnabled: variation.isEnabled,
})

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

  if (typeof detail === 'string') {
    const detailMessageMap: Record<string, string> = {
      'Attribute not found': 'El atributo ya no existe o no está disponible.',
      'Attribute value not found': 'El valor del atributo ya no existe o no está disponible.',
      'Product attributes must be unique': 'No puedes repetir el mismo atributo en el producto.',
      'Product attribute values must be unique': 'No puedes repetir valores dentro de un atributo.',
      'Attribute already exists': 'Ese atributo ya existe.',
      'Attribute value already exists': 'Ese valor ya existe para el atributo.',
      'Attribute is used by products': 'No se puede eliminar porque está en uso.',
      'Attribute value is used by products': 'No se puede eliminar porque está en uso.',
      'Variable product must have enabled variations': 'El producto debe tener al menos una variación habilitada.',
      'Variation SKU is required': 'Todas las variaciones habilitadas deben tener SKU.',
      'Duplicate variation SKU': 'Hay SKUs duplicados en las variaciones.',
      'Tracked variation quantity is required': 'Las variaciones con inventario rastreado necesitan cantidad.',
      'Article is not variable': 'Este endpoint solo aplica para productos variables.',
      'Variation not found': 'La variación no existe o ya no está activa.',
      'Image order must include every product image': 'El orden debe incluir todas las imágenes de la variación.',
    }

    return detailMessageMap[detail] ?? detail
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

  if (response.status === 413) {
    return 'El archivo de imagen excede el límite permitido.'
  }

  if (response.status === 415) {
    return 'El tipo de imagen no es compatible.'
  }

  if (response.status === 422) {
    return 'La API rechazó los datos del artículo. Revisa los campos capturados.'
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
  const [simpleProductDraft, setSimpleProductDraft] = useState<Product>(() => createEmptySimpleProduct())
  const [simpleProducts, setSimpleProducts] = useState<Product[]>([])
  const [currentProductPage, setCurrentProductPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [pendingDeleteProductId, setPendingDeleteProductId] = useState<string | null>(null)
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null)
  const [adjustingVariationId, setAdjustingVariationId] = useState<string | null>(null)
  const [adjustmentQuantityDraft, setAdjustmentQuantityDraft] = useState('')
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [simpleProductErrors, setSimpleProductErrors] = useState<SimpleProductValidationErrors>({})
  const [productModalError, setProductModalError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [attributeCatalog, setAttributeCatalog] = useState<AttributeCatalogItem[]>([])
  const [attributeCatalogError, setAttributeCatalogError] = useState<string | null>(null)
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false)
  const [isSavingAttributeCatalog, setIsSavingAttributeCatalog] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState('')
  const [newAttributeValues, setNewAttributeValues] = useState('')
  const [newAttributeValueDrafts, setNewAttributeValueDrafts] = useState<Record<string, string>>({})
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [isAdjustingProduct, setIsAdjustingProduct] = useState(false)
  const [savingVariationIds, setSavingVariationIds] = useState<string[]>([])
  const [savingVariationImageIds, setSavingVariationImageIds] = useState<string[]>([])
  const [variationErrors, setVariationErrors] = useState<Record<string, string>>({})
  const [useSameVariationData, setUseSameVariationData] = useState(true)
  const [activeProductImageId, setActiveProductImageId] = useState<string | null>(null)
  const [productImageCarouselStart, setProductImageCarouselStart] = useState(0)
  const [isProductImageExpanded, setIsProductImageExpanded] = useState(false)
  const [selectedProductImageId, setSelectedProductImageId] = useState<string | null>(null)
  const [deletedProductImageIds, setDeletedProductImageIds] = useState<string[]>([])
  const [productImageObjectUrls, setProductImageObjectUrls] = useState<Record<string, string>>({})
  const productImageInputRef = useRef<HTMLInputElement | null>(null)
  const fetchedProductImageObjectUrlsRef = useRef<string[]>([])
  const requestedProductImageIdsRef = useRef<Set<string>>(new Set())
  const deleteDelayTimeoutRef = useRef<number | null>(null)

  const isVariableDraft = isVariableProduct(simpleProductDraft)
  const simpleDraftInventory = isSimpleProduct(simpleProductDraft) ? simpleProductDraft.inventory : createEmptySimpleProduct().inventory
  const trackInventory = isSimpleProduct(simpleProductDraft) && simpleDraftInventory.trackingMode === 'tracked'
  const isProductModalOpen = openActionId === 'agregar' || openActionId === 'editar'
  const visibleProductTabs = productTabs.filter((tab) => {
    if (isVariableDraft && tab.id === 'inventario') {
      return false
    }

    if (!isVariableDraft && tab.id === 'variaciones') {
      return false
    }

    return true
  })
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
  const selectedVariableProduct = selectedProduct && isVariableProduct(selectedProduct) ? selectedProduct : null
  const selectedProductImages = useMemo(() => (
    selectedProduct
      ? [...selectedProduct.media.images].sort((firstImage, secondImage) => firstImage.order - secondImage.order)
      : []
  ), [selectedProduct])
  const draftVariationImageSignature = isVariableDraft
    ? simpleProductDraft.variations
        .map((variation) => variation.media.images.map((image) => `${image.id}:${image.url}`).join(','))
        .join('|')
    : ''
  const draftVariationImages = useMemo(() => (
    isVariableDraft
      ? simpleProductDraft.variations.flatMap((variation) => variation.media.images)
      : []
  // Recompute image loading only when variation image identity changes, not while editing row fields.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [draftVariationImageSignature, isVariableDraft])
  const activeSelectedProductImage = selectedProductImages.find((image) => image.id === selectedProductImageId) ?? selectedProductImages[0] ?? null
  const canUseApi = isAuthenticated && Boolean(accessToken && tokenType)
  const apiRequestOptions = accessToken && tokenType
    ? { accessToken, apiBaseUrl, tokenType }
    : null
  const selectedProductAttributeIds = simpleProductDraft.attributes
    .map((attribute) => attribute.attributeId)
    .filter(Boolean)
  const variableDraftReadiness = isVariableDraft ? getVariableDraftReadiness(simpleProductDraft) : null

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

  const fetchAttributeCatalog = useCallback(async () => {
    if (!accessToken || !tokenType) {
      setAttributeCatalog([])
      setAttributeCatalogError('Inicia sesión para consultar atributos.')

      return
    }

    setIsLoadingAttributes(true)
    setAttributeCatalogError(null)

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
      })
      const response = await requestArticulosApi<AttributeCatalogResponse>(
        { accessToken, apiBaseUrl, tokenType },
        `/atributos?${params.toString()}`,
      )

      setAttributeCatalog(response.items)
    } catch (error) {
      setAttributeCatalogError(error instanceof Error ? error.message : 'No fue posible cargar atributos.')
    } finally {
      setIsLoadingAttributes(false)
    }
  }, [accessToken, apiBaseUrl, tokenType])

  useEffect(() => {
    fetchProducts(currentProductPage, activeSearchQuery)
  }, [activeSearchQuery, currentProductPage, fetchProducts])

  useEffect(() => {
    if (isProductModalOpen) {
      fetchAttributeCatalog()
    }
  }, [fetchAttributeCatalog, isProductModalOpen])

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

    const imagesToLoad = [...productImages, ...selectedProductImages, ...draftVariationImages]

    imagesToLoad.forEach((image) => {
      if (
        image.previewUrl
        || isLocalProductImage(image)
        || productImageObjectUrls[image.id]
        || requestedProductImageIdsRef.current.has(image.id)
      ) {
        return
      }

      requestedProductImageIdsRef.current.add(image.id)

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
  }, [accessToken, apiBaseUrl, draftVariationImages, productImageObjectUrls, productImages, selectedProductImages, tokenType])

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
    setAdjustingVariationId(null)
    setAdjustmentQuantityDraft('')
    setAdjustmentError(null)
  }

  const startProductAdjustment = (product: Product) => {
    setSelectedProductId(product.id)
    setAdjustingProductId(product.id)
    if (isVariableProduct(product)) {
      const firstVariation = getEnabledActiveVariations(product)[0] ?? product.variations[0] ?? null
      setAdjustingVariationId(firstVariation?.id ?? null)
      setAdjustmentQuantityDraft(String(firstVariation?.quantity ?? 0))
    } else {
      setAdjustingVariationId(null)
      setAdjustmentQuantityDraft(String(product.inventory.quantity ?? 0))
    }
    setAdjustmentError(null)
  }

  const parseAdjustmentQuantity = () => {
    if (!/^\d+$/.test(adjustmentQuantityDraft.trim())) {
      return null
    }

    return Number(adjustmentQuantityDraft)
  }

  const replaceProductInList = (updatedProduct: Product) => {
    setSimpleProducts((currentProducts) => (
      currentProducts.map((product) => (
        product.id === updatedProduct.id ? updatedProduct : product
      ))
    ))
    setSelectedProductId(updatedProduct.id)
  }

  const applyUpdatedProductPreservingVariationDraft = (updatedProduct: Product) => {
    replaceProductInList(updatedProduct)

    setSimpleProductDraft((currentProduct) => (
      currentProduct.id === updatedProduct.id
        ? mergeProductWithCurrentVariationDraft(updatedProduct, currentProduct)
        : currentProduct
    ))
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

    const productToAdjust = simpleProducts.find((product) => product.id === adjustingProductId)
    const isVariableAdjustment = productToAdjust && isVariableProduct(productToAdjust)

    if (isVariableAdjustment && !adjustingVariationId) {
      setAdjustmentError('Selecciona una variación para ajustar.')

      return
    }

    setIsAdjustingProduct(true)
    setAdjustmentError(null)
    setApiError(null)

    try {
      const updatedProduct = await requestArticulosApi<Product>(
        apiRequestOptions,
        isVariableAdjustment
          ? `/${adjustingProductId}/variaciones/${adjustingVariationId}/ajustar`
          : `/${adjustingProductId}/ajustar`,
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

  const handleSelectAdjustmentVariation = (variationId: string) => {
    setAdjustingVariationId(variationId)
    const variation = selectedVariableProduct?.variations.find((item) => item.id === variationId)
    setAdjustmentQuantityDraft(String(variation?.quantity ?? 0))
    setAdjustmentError(null)
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

  const startProductDeleteDelay = (product: Product, requestOptions: ApiRequestOptions | null) => {
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
      const nextType: ProductType = 'simple'
      clearAdjustment()
      setProductModalMode('create')
      setSimpleProductDraft(createEmptyProductByType(nextType))
      setProductType('Producto simple')
      setActiveProductImageId(null)
      setProductImageCarouselStart(0)
      setIsProductImageExpanded(false)
      setDeletedProductImageIds([])
      setProductImageObjectUrls({})
      requestedProductImageIdsRef.current.clear()
      setSimpleProductErrors({})
      setUseSameVariationData(true)
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
      setProductType(productTypeToOption(selectedProduct.type))
      setSimpleProductDraft(createEditableProductDraft(selectedProduct))
      setActiveProductImageId(selectedProduct.media.images.find((image) => image.isPrimary)?.id ?? selectedProduct.media.images[0]?.id ?? null)
      setProductImageCarouselStart(0)
      setIsProductImageExpanded(false)
      setDeletedProductImageIds([])
      setProductImageObjectUrls({})
      requestedProductImageIdsRef.current.clear()
      setSimpleProductErrors({})
      setUseSameVariationData(isVariableProduct(selectedProduct))
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

      if (isSimpleProduct(selectedProduct) && selectedProduct.inventory.trackingMode !== 'tracked') {
        setProductModalError('El producto no maneja cantidad de inventario.')

        return
      }

      if (isVariableProduct(selectedProduct) && selectedProduct.variations.length === 0) {
        setProductModalError('El producto variable no tiene variaciones para ajustar.')

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
        const clonedProduct = await requestArticulosApi<Product>(
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

  const handleEditProduct = (product: Product) => {
    if (pendingDeleteProductId || adjustingProductId === product.id) {
      return
    }

    clearAdjustment()
    setSelectedProductId(product.id)
    setProductModalMode('edit')
    setProductType(productTypeToOption(product.type))
    setSimpleProductDraft(createEditableProductDraft(product))
    setActiveProductImageId(product.media.images.find((image) => image.isPrimary)?.id ?? product.media.images[0]?.id ?? null)
    setProductImageCarouselStart(0)
    setIsProductImageExpanded(false)
    setDeletedProductImageIds([])
    setProductImageObjectUrls({})
    requestedProductImageIdsRef.current.clear()
    setSimpleProductErrors({})
    setUseSameVariationData(isVariableProduct(product))
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

  const handleProductTypeChange = (option: ProductTypeOption) => {
    const nextType = productTypeOptionToType(option)

    setProductType(option)
    setSimpleProductDraft((currentProduct) => {
      if (currentProduct.type === nextType) {
        return currentProduct
      }

      const nextProduct = createEmptyProductByType(nextType)

      return {
        ...nextProduct,
        general: currentProduct.general,
        attributes: currentProduct.attributes.map((attribute) => ({
          ...attribute,
          usedForVariations: nextType === 'variable' ? true : attribute.usedForVariations,
        })),
        media: currentProduct.media,
      }
    })
    setActiveProductTab('general')
    setSimpleProductErrors({})
    setVariationErrors({})
    setUseSameVariationData(nextType === 'variable')
  }

  const updateSimpleProductGeneral = (general: Partial<ProductGeneral>) => {
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

  const updateSimpleProductInventory = (inventory: Partial<ProductInventory>) => {
    if (!isSimpleProduct(simpleProductDraft)) {
      return
    }

    if ('sku' in inventory) {
      clearSimpleProductErrors(['sku'])
    }

    setSimpleProductDraft((currentProduct) => {
      if (!isSimpleProduct(currentProduct)) {
        return currentProduct
      }

      return {
        ...currentProduct,
        inventory: {
          ...currentProduct.inventory,
          ...inventory,
        },
        metadata: {
          ...currentProduct.metadata,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  const updateProductAttribute = (attributeId: string, attribute: Partial<ProductAttribute>) => {
    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      attributes: currentProduct.attributes.map((currentAttribute) => (
        currentAttribute.id === attributeId
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

  const handleAddProductAttribute = () => {
    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      attributes: [
        ...currentProduct.attributes,
        {
          ...createEmptyProductAttribute(),
          usedForVariations: isVariableProduct(currentProduct),
        },
      ],
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const handleRemoveProductAttribute = (attributeId: string) => {
    setSimpleProductDraft((currentProduct) => {
      const nextAttributes = currentProduct.attributes.filter((attribute) => attribute.id !== attributeId)

      return {
        ...currentProduct,
        attributes: nextAttributes.length > 0 ? nextAttributes : [createEmptyProductAttribute()],
        metadata: {
          ...currentProduct.metadata,
          updatedAt: new Date().toISOString(),
        },
      }
    })
  }

  const handleSelectProductAttribute = (productAttributeId: string, catalogAttributeId: string) => {
    const catalogAttribute = attributeCatalog.find((attribute) => attribute.id === catalogAttributeId)

    updateProductAttribute(productAttributeId, {
      attributeId: catalogAttribute?.id ?? '',
      name: catalogAttribute?.name ?? '',
      values: catalogAttribute?.values.map((value) => ({
        id: value.id,
        value: value.value,
      })) ?? [],
    })
  }

  const updateProductAttributeValues = (
    productAttributeId: string,
    getNextValues: (currentValues: ProductAttributeValue[]) => ProductAttributeValue[],
  ) => {
    setSimpleProductDraft((currentProduct) => ({
      ...currentProduct,
      attributes: currentProduct.attributes.map((currentAttribute) => (
        currentAttribute.id === productAttributeId
          ? {
              ...currentAttribute,
              values: getNextValues(currentAttribute.values),
            }
          : currentAttribute
      )),
      metadata: {
        ...currentProduct.metadata,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  const handleAddProductAttributeValue = (productAttributeId: string, valueId: string) => {
    if (!valueId) {
      return
    }

    const productAttribute = simpleProductDraft.attributes.find((attribute) => attribute.id === productAttributeId)
    const catalogAttribute = attributeCatalog.find((attribute) => attribute.id === productAttribute?.attributeId)
    const catalogValue = catalogAttribute?.values.find((value) => value.id === valueId)

    if (!catalogValue) {
      return
    }

    updateProductAttributeValues(productAttributeId, (currentValues) => (
      currentValues.some((value) => value.id === catalogValue.id)
        ? currentValues
        : [
            ...currentValues,
            {
              id: catalogValue.id,
              value: catalogValue.value,
            },
          ]
    ))
  }

  const handleRemoveProductAttributeValue = (productAttributeId: string, valueId: string) => {
    updateProductAttributeValues(productAttributeId, (currentValues) => (
      currentValues.filter((value) => value.id !== valueId)
    ))
  }

  const createAttributeCatalogItem = async () => {
    const trimmedName = newAttributeName.trim()
    const valuesToCreate = newAttributeValues
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean)

    if (!trimmedName) {
      setAttributeCatalogError('Ingresa el nombre del atributo.')

      return
    }

    if (!apiRequestOptions) {
      setAttributeCatalogError('Inicia sesión para crear atributos.')

      return
    }

    setIsSavingAttributeCatalog(true)
    setAttributeCatalogError(null)

    try {
      const createdAttribute = await requestArticulosApi<AttributeCatalogItem>(
        apiRequestOptions,
        '/atributos',
        {
          method: 'POST',
          body: JSON.stringify({
            name: trimmedName,
            sortOrder: attributeCatalog.length,
          }),
        },
      )
      const createdValues: AttributeCatalogValue[] = []

      for (const value of valuesToCreate) {
        const createdValue = await requestArticulosApi<AttributeCatalogValue>(
          apiRequestOptions,
          `/atributos/${createdAttribute.id}/valores`,
          {
            method: 'POST',
            body: JSON.stringify({
              value,
              sortOrder: createdValues.length,
            }),
          },
        )

        createdValues.push(createdValue)
      }

      const nextAttribute = {
        ...createdAttribute,
        values: createdValues,
      }

      setAttributeCatalog((currentCatalog) => [...currentCatalog, nextAttribute])
      setSimpleProductDraft((currentProduct) => ({
        ...currentProduct,
        attributes: currentProduct.attributes.map((attribute, index) => (
          index === currentProduct.attributes.length - 1 && !attribute.attributeId
            ? {
                ...attribute,
                attributeId: nextAttribute.id,
                name: nextAttribute.name,
                values: createdValues.map((value) => ({ id: value.id, value: value.value })),
              }
            : attribute
        )),
      }))
      setNewAttributeName('')
      setNewAttributeValues('')
    } catch (error) {
      setAttributeCatalogError(error instanceof Error ? error.message : 'No fue posible crear el atributo.')
    } finally {
      setIsSavingAttributeCatalog(false)
    }
  }

  const createAttributeCatalogValue = async (productAttribute: ProductAttribute) => {
    const trimmedValue = (newAttributeValueDrafts[productAttribute.id] ?? '').trim()

    if (!trimmedValue) {
      setAttributeCatalogError('Ingresa el valor del atributo.')

      return
    }

    if (!apiRequestOptions || !productAttribute.attributeId) {
      setAttributeCatalogError('Selecciona un atributo antes de crear valores.')

      return
    }

    const catalogAttribute = attributeCatalog.find((attribute) => attribute.id === productAttribute.attributeId)

    setIsSavingAttributeCatalog(true)
    setAttributeCatalogError(null)

    try {
      const createdValue = await requestArticulosApi<AttributeCatalogValue>(
        apiRequestOptions,
        `/atributos/${productAttribute.attributeId}/valores`,
        {
          method: 'POST',
          body: JSON.stringify({
            value: trimmedValue,
            sortOrder: catalogAttribute?.values.length ?? 0,
          }),
        },
      )

      setAttributeCatalog((currentCatalog) => (
        currentCatalog.map((attribute) => (
          attribute.id === productAttribute.attributeId
            ? {
                ...attribute,
                values: [...attribute.values, createdValue],
              }
            : attribute
        ))
      ))
      updateProductAttributeValues(productAttribute.id, (currentValues) => (
        currentValues.some((value) => value.id === createdValue.id)
          ? currentValues
          : [
              ...currentValues,
              {
                id: createdValue.id,
                value: createdValue.value,
              },
            ]
      ))
      setNewAttributeValueDrafts((currentDrafts) => ({
        ...currentDrafts,
        [productAttribute.id]: '',
      }))
    } catch (error) {
      setAttributeCatalogError(error instanceof Error ? error.message : 'No fue posible crear el valor.')
    } finally {
      setIsSavingAttributeCatalog(false)
    }
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
      await requestArticulosApi<Product>(
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

    const orderedProduct = await requestArticulosApi<Product>(
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
    if (!isSimpleProduct(simpleProductDraft)) {
      return
    }

    updateSimpleProductInventory({
      trackingMode: isTracked ? 'tracked' : 'untracked',
      quantity: isTracked ? simpleDraftInventory.quantity ?? 1 : null,
      reservationPolicy: isTracked ? simpleDraftInventory.reservationPolicy ?? 'disabled' : null,
      lowStockThreshold: isTracked ? simpleDraftInventory.lowStockThreshold : null,
      stockStatus: isTracked ? 'in_stock' : simpleDraftInventory.stockStatus,
    })
  }

  const buildSimpleProductToSave = (): Product => {
    const now = new Date().toISOString()
    const cleanAttributes = simpleProductDraft.attributes
      .map((attribute) => ({
        ...attribute,
        name: attribute.name.trim(),
        values: attribute.values.filter((value) => value.id),
        usedForVariations: isSimpleProduct(simpleProductDraft) ? false : attribute.usedForVariations,
      }))
      .filter((attribute) => attribute.attributeId && attribute.values.length > 0)

    const general = {
      ...simpleProductDraft.general,
      name: simpleProductDraft.general.name.trim(),
      shortDescription: simpleProductDraft.general.shortDescription.trim(),
      longDescription: simpleProductDraft.general.longDescription.trim(),
    }
    const metadata = {
      ...simpleProductDraft.metadata,
      updatedAt: now,
    }

    if (isSimpleProduct(simpleProductDraft)) {
      return {
        ...simpleProductDraft,
        general,
        inventory: {
          ...simpleProductDraft.inventory,
          sku: simpleProductDraft.inventory.sku.trim(),
        },
        attributes: cleanAttributes,
        metadata,
      }
    }

    return {
      ...simpleProductDraft,
      general,
      inventory: null,
      variations: simpleProductDraft.variations ?? [],
      attributes: cleanAttributes,
      metadata,
    }
  }

  const buildProductWritePayload = (product: Product, includeMedia = false): ProductWritePayload => ({
    type: product.type,
    general: product.general,
    ...(isSimpleProduct(product)
      ? {
          inventory: {
            ...product.inventory,
            quantity: product.inventory.trackingMode === 'tracked' ? product.inventory.quantity : null,
            reservationPolicy: product.inventory.trackingMode === 'tracked' ? product.inventory.reservationPolicy : null,
            lowStockThreshold: product.inventory.trackingMode === 'tracked' ? product.inventory.lowStockThreshold : null,
          },
        }
      : {}),
    attributes: product.attributes.map((attribute) => ({
      attributeId: attribute.attributeId,
      valueIds: attribute.values.map((value) => value.id),
      visible: attribute.visible,
      usedForVariations: isSimpleProduct(product) ? false : attribute.usedForVariations,
    })),
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

  const validateSimpleProductGeneral = (product: Product) => {
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

  const validateSimpleProductInventory = (product: Product) => {
    const validationErrors: SimpleProductValidationErrors = {}

    if (isVariableProduct(product)) {
      return validationErrors
    }

    if (!product.inventory.sku) {
      validationErrors.sku = 'El SKU es obligatorio.'
    }

    return validationErrors
  }

  const validateSimpleProductAttributes = (product: Product) => {
    const attributeIds = new Set<string>()

    for (const attribute of product.attributes) {
      if (attributeIds.has(attribute.attributeId)) {
        return 'No puedes repetir el mismo atributo en el producto.'
      }

      attributeIds.add(attribute.attributeId)

      const valueIds = new Set<string>()
      const catalogAttribute = attributeCatalog.find((catalogItem) => catalogItem.id === attribute.attributeId)

      for (const value of attribute.values) {
        if (valueIds.has(value.id)) {
          return 'No puedes repetir valores dentro de un atributo.'
        }

        if (catalogAttribute && !catalogAttribute.values.some((catalogValue) => catalogValue.id === value.id)) {
          return 'Los valores seleccionados deben pertenecer al atributo elegido.'
        }

        valueIds.add(value.id)
      }
    }

    return null
  }

  const validateVariableProductAttributes = (product: Product) => {
    if (!isVariableProduct(product)) {
      return null
    }

    const variationAttributes = product.attributes.filter((attribute) => attribute.usedForVariations && attribute.values.length > 0)

    if (variationAttributes.length === 0) {
      return 'Selecciona al menos un atributo usado para variaciones con valores.'
    }

    return null
  }

  const updateDraftVariation = (variationId: string, variation: Partial<ProductVariation>) => {
    setSimpleProductDraft((currentProduct) => {
      if (!isVariableProduct(currentProduct)) {
        return currentProduct
      }

      return {
        ...currentProduct,
        variations: currentProduct.variations.map((currentVariation) => (
          currentVariation.id === variationId
            ? {
                ...currentVariation,
                ...variation,
              }
            : currentVariation
        )),
      }
    })

    if ('sku' in variation) {
      setVariationErrors((currentErrors) => {
        const nextErrors = { ...currentErrors }
        delete nextErrors[variationId]

        return nextErrors
      })
    }
  }

  const applySharedVariationData = (
    variationData: Partial<Pick<ProductVariation, 'quantity' | 'stockStatus' | 'regularPrice' | 'salePrice' | 'isEnabled'>>,
  ) => {
    setSimpleProductDraft((currentProduct) => {
      if (!isVariableProduct(currentProduct)) {
        return currentProduct
      }

      return {
        ...currentProduct,
        variations: currentProduct.variations.map((currentVariation) => (
          currentVariation.isActive
            ? {
                ...currentVariation,
                ...variationData,
              }
            : currentVariation
        )),
      }
    })
  }

  const updateVariationSharedField = (
    variationId: string,
    variationData: Partial<Pick<ProductVariation, 'quantity' | 'stockStatus' | 'regularPrice' | 'salePrice' | 'isEnabled'>>,
  ) => {
    if (useSameVariationData) {
      applySharedVariationData(variationData)

      return
    }

    updateDraftVariation(variationId, variationData)
  }

  const handleUseSameVariationDataChange = (isChecked: boolean) => {
    setUseSameVariationData(isChecked)

    if (!isChecked || !isVariableProduct(simpleProductDraft)) {
      return
    }

    const sourceVariation = simpleProductDraft.variations.find((variation) => variation.isActive)

    if (sourceVariation) {
      applySharedVariationData(getSharedVariationData(sourceVariation))
    }
  }

  const mergeVariationWithLocalEdits = (
    serverVariation: ProductVariation,
    currentVariation: ProductVariation,
    savedPayload?: VariationWritePayload,
  ): ProductVariation => {
    const normalizedVariation = normalizeProductVariation(serverVariation)
    const currentPayload = buildVariationWritePayload(currentVariation)
    const hasLocalEditsAfterSave = savedPayload
      ? (
          currentPayload.sku !== savedPayload.sku
          || currentPayload.quantity !== savedPayload.quantity
          || currentPayload.stockStatus !== savedPayload.stockStatus
          || currentPayload.regularPrice !== savedPayload.regularPrice
          || currentPayload.salePrice !== savedPayload.salePrice
          || currentPayload.isEnabled !== savedPayload.isEnabled
        )
      : (
          currentPayload.sku !== (normalizedVariation.sku?.trim() || null)
          || currentPayload.quantity !== normalizedVariation.quantity
          || currentPayload.stockStatus !== normalizedVariation.stockStatus
          || currentPayload.regularPrice !== normalizedVariation.regularPrice
          || currentPayload.salePrice !== normalizedVariation.salePrice
          || currentPayload.isEnabled !== normalizedVariation.isEnabled
        )

    return hasLocalEditsAfterSave
      ? {
          ...normalizedVariation,
          sku: currentVariation.sku,
          quantity: currentVariation.quantity,
          stockStatus: currentVariation.stockStatus,
          regularPrice: currentVariation.regularPrice,
          salePrice: currentVariation.salePrice,
          isEnabled: currentVariation.isEnabled,
        }
      : normalizedVariation
  }

  const mergeProductWithCurrentVariationDraft = (
    serverProduct: Product,
    currentProduct: Product,
    savedVariationId?: string,
    savedPayload?: VariationWritePayload,
  ): Product => {
    if (!isVariableProduct(serverProduct) || !isVariableProduct(currentProduct) || serverProduct.id !== currentProduct.id) {
      return createEditableProductDraft(serverProduct)
    }

    const editableServerProduct = createEditableProductDraft(serverProduct) as VariableProduct

    return {
      ...editableServerProduct,
      variations: serverProduct.variations.map((serverVariation) => {
        const currentVariation = currentProduct.variations.find((variation) => variation.id === serverVariation.id)

        if (!currentVariation) {
          return normalizeProductVariation(serverVariation)
        }

        return mergeVariationWithLocalEdits(
          serverVariation,
          currentVariation,
          serverVariation.id === savedVariationId ? savedPayload : undefined,
        )
      }),
    }
  }

  const getSortedVariationImages = (variation: ProductVariation) => (
    [...variation.media.images].sort((firstImage, secondImage) => firstImage.order - secondImage.order)
  )

  const updateVariationImageOrder = async (
    variationId: string,
    images: ProductImage[],
  ) => {
    if (!apiRequestOptions || !isVariableProduct(simpleProductDraft)) {
      setProductModalError('Inicia sesión para actualizar imágenes de variación.')

      return
    }

    if (images.length === 0) {
      return
    }

    setSavingVariationImageIds((currentIds) => [...currentIds.filter((id) => id !== variationId), variationId])
    setVariationErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[variationId]

      return nextErrors
    })

    try {
      const updatedProduct = await requestArticulosApi<Product>(
        apiRequestOptions,
        `/${simpleProductDraft.id}/variaciones/${variationId}/imagenes`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            images: images.map((image, index) => ({
              id: image.id,
              isPrimary: index === 0,
            })),
          }),
        },
      )

      applyUpdatedProductPreservingVariationDraft(updatedProduct)
    } catch (error) {
      setVariationErrors((currentErrors) => ({
        ...currentErrors,
        [variationId]: error instanceof Error ? error.message : 'No fue posible actualizar las imágenes de la variación.',
      }))
    } finally {
      setSavingVariationImageIds((currentIds) => currentIds.filter((id) => id !== variationId))
    }
  }

  const handleVariationImageUpload = async (
    variationId: string,
    files: File[],
  ) => {
    if (!apiRequestOptions || !isVariableProduct(simpleProductDraft)) {
      setProductModalError('Inicia sesión para agregar imágenes de variación.')

      return
    }

    const variation = simpleProductDraft.variations.find((currentVariation) => currentVariation.id === variationId)
    const selectedFiles = files.filter((file) => file.type.startsWith('image/'))

    if (!variation || selectedFiles.length === 0 || !variation.isActive) {
      return
    }

    setSavingVariationImageIds((currentIds) => [...currentIds.filter((id) => id !== variationId), variationId])
    setVariationErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[variationId]

      return nextErrors
    })

    try {
      const uploadedImages: ProductImage[] = []

      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file, file.name)

        const uploadedImage = await requestArticulosApi<ProductImage>(
          apiRequestOptions,
          `/${simpleProductDraft.id}/variaciones/${variationId}/imagenes`,
          {
            method: 'POST',
            body: formData,
          },
        )

        uploadedImages.push(uploadedImage)
      }

      const nextImages = [...getSortedVariationImages(variation), ...uploadedImages].map((image, index) => ({
        ...image,
        isPrimary: index === 0,
        order: index,
      }))

      await updateVariationImageOrder(variationId, nextImages)
    } catch (error) {
      setVariationErrors((currentErrors) => ({
        ...currentErrors,
        [variationId]: error instanceof Error ? error.message : 'No fue posible agregar la imagen de la variación.',
      }))
    } finally {
      setSavingVariationImageIds((currentIds) => currentIds.filter((id) => id !== variationId))
    }
  }

  const handleDeleteVariationImage = async (
    variationId: string,
    imageId: string,
  ) => {
    if (!apiRequestOptions || !isVariableProduct(simpleProductDraft)) {
      setProductModalError('Inicia sesión para borrar imágenes de variación.')

      return
    }

    setSavingVariationImageIds((currentIds) => [...currentIds.filter((id) => id !== variationId), variationId])
    setVariationErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[variationId]

      return nextErrors
    })

    try {
      const updatedProduct = await requestArticulosApi<Product>(
        apiRequestOptions,
        `/${simpleProductDraft.id}/variaciones/${variationId}/imagenes/${imageId}`,
        { method: 'DELETE' },
      )

      applyUpdatedProductPreservingVariationDraft(updatedProduct)
    } catch (error) {
      setVariationErrors((currentErrors) => ({
        ...currentErrors,
        [variationId]: error instanceof Error ? error.message : 'No fue posible borrar la imagen de la variación.',
      }))
    } finally {
      setSavingVariationImageIds((currentIds) => currentIds.filter((id) => id !== variationId))
    }
  }

  const handleMoveVariationImage = (
    variation: ProductVariation,
    imageId: string,
    direction: -1 | 1,
  ) => {
    const images = getSortedVariationImages(variation)
    const currentIndex = images.findIndex((image) => image.id === imageId)
    const nextIndex = currentIndex + direction

    if (currentIndex === -1 || nextIndex < 0 || nextIndex >= images.length) {
      return
    }

    const nextImages = [...images]
    const currentImage = nextImages[currentIndex]
    nextImages[currentIndex] = nextImages[nextIndex]
    nextImages[nextIndex] = currentImage

    updateVariationImageOrder(variation.id, nextImages)
  }

  const handleMakeVariationImagePrimary = (
    variation: ProductVariation,
    imageId: string,
  ) => {
    const images = getSortedVariationImages(variation)
    const selectedImage = images.find((image) => image.id === imageId)

    if (!selectedImage || images[0]?.id === imageId) {
      return
    }

    updateVariationImageOrder(variation.id, [
      selectedImage,
      ...images.filter((image) => image.id !== imageId),
    ])
  }

  const persistVariation = async (variationId: string, payload?: VariationWritePayload) => {
    if (!apiRequestOptions || !isVariableProduct(simpleProductDraft)) {
      setProductModalError('Inicia sesión para guardar variaciones.')

      return
    }

    const variationToSave = simpleProductDraft.variations.find((variation) => variation.id === variationId)

    if (!variationToSave) {
      setVariationErrors((currentErrors) => ({
        ...currentErrors,
        [variationId]: 'La variación ya no está disponible.',
      }))

      return
    }

    const payloadToSave = payload ?? buildVariationWritePayload(variationToSave)

    setSavingVariationIds((currentIds) => [...currentIds.filter((id) => id !== variationId), variationId])
    setVariationErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[variationId]

      return nextErrors
    })

    try {
      const response = await requestArticulosApi<ProductVariation | Product>(
        apiRequestOptions,
        `/${simpleProductDraft.id}/variaciones/${variationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payloadToSave),
        },
      )

      if ('type' in response) {
        setSimpleProductDraft((currentProduct) => {
          return mergeProductWithCurrentVariationDraft(response, currentProduct, variationId, payloadToSave)
        })
        replaceProductInList(response)
      } else {
        const normalizedVariation = normalizeProductVariation(response)

        setSimpleProductDraft((currentProduct) => {
          if (!isVariableProduct(currentProduct)) {
            return currentProduct
          }

          return {
            ...currentProduct,
            variations: currentProduct.variations.map((currentVariation) => {
              if (currentVariation.id !== normalizedVariation.id) {
                return currentVariation
              }

              return mergeVariationWithLocalEdits(normalizedVariation, currentVariation, payloadToSave)
            }),
          }
        })
        setSimpleProducts((currentProducts) => (
          currentProducts.map((product) => (
            product.id === simpleProductDraft.id && isVariableProduct(product)
              ? {
                  ...product,
                  variations: product.variations.map((variation) => (
                    variation.id === normalizedVariation.id ? normalizedVariation : variation
                  )),
                }
              : product
          ))
        ))
      }
    } catch (error) {
      setVariationErrors((currentErrors) => ({
        ...currentErrors,
        [variationId]: error instanceof Error ? error.message : 'No fue posible guardar la variación.',
      }))
    } finally {
      setSavingVariationIds((currentIds) => currentIds.filter((id) => id !== variationId))
    }
  }

  const saveVariableDraftVariations = async (
    productId: string,
    sourceProduct: VariableProduct,
    baseProduct: Product,
  ) => {
    let nextProduct = isVariableProduct(baseProduct)
      ? mergeProductWithCurrentVariationDraft(baseProduct, sourceProduct)
      : baseProduct
    const variationsToSave = sourceProduct.variations.filter((variation) => variation.isActive)

    for (const variation of variationsToSave) {
      const payloadToSave = buildVariationWritePayload(variation)
      const response = await requestArticulosApi<ProductVariation | Product>(
        apiRequestOptions as ApiRequestOptions,
        `/${productId}/variaciones/${variation.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payloadToSave),
        },
      )

      if ('type' in response) {
        nextProduct = mergeProductWithCurrentVariationDraft(response, sourceProduct, variation.id, payloadToSave)
      } else if (isVariableProduct(nextProduct)) {
        const normalizedVariation = normalizeProductVariation(response)

        nextProduct = {
          ...nextProduct,
          variations: nextProduct.variations.map((currentVariation) => (
            currentVariation.id === normalizedVariation.id
              ? mergeVariationWithLocalEdits(normalizedVariation, variation, payloadToSave)
              : currentVariation
          )),
        }
      }
    }

    return nextProduct
  }

  const saveVariableProductStatus = async (
    sourceProduct: VariableProduct,
    savedProduct: Product,
  ) => {
    const readiness = getVariableDraftReadiness(sourceProduct)
    let nextProduct = savedProduct
    const productId = savedProduct.id

    if (readiness.isReady) {
      const activatedProduct = await requestArticulosApi<Product>(
        apiRequestOptions as ApiRequestOptions,
        `/${productId}/activar`,
        { method: 'POST' },
      )

      nextProduct = mergeProductWithCurrentVariationDraft(activatedProduct, savedProduct)
    } else if (isVariableProduct(savedProduct) && savedProduct.metadata.status === 'active') {
      const draftProduct = await requestArticulosApi<Product>(
        apiRequestOptions as ApiRequestOptions,
        `/${productId}/borrador`,
        { method: 'POST' },
      )

      nextProduct = mergeProductWithCurrentVariationDraft(draftProduct, savedProduct)
    }

    return {
      product: nextProduct,
      readiness,
    }
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
      setActiveProductTab(isVariableProduct(productToSave) ? 'atributos' : 'inventario')

      return
    }

    if (activeProductTab === 'inventario' && isSimpleProduct(productToSave)) {
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
    const attributeValidationError = validateSimpleProductAttributes(productToSave) ?? validateVariableProductAttributes(productToSave)

    if (Object.keys(validationErrors).length > 0) {
      setSimpleProductErrors(validationErrors)
      setActiveProductTab(validationErrors.name || validationErrors.shortDescription || validationErrors.regularPrice ? 'general' : 'inventario')

      return
    }

    if (attributeValidationError) {
      setProductModalError(attributeValidationError)
      setActiveProductTab('atributos')

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
        const updatedProductWithoutImages = await requestArticulosApi<Product>(
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

        if (isVariableProduct(productToSave) && isVariableProduct(updatedProduct)) {
          const productWithSavedVariations = await saveVariableDraftVariations(
            updatedProduct.id,
            productToSave,
            updatedProduct,
          )
          const { product: finalProduct, readiness } = await saveVariableProductStatus(
            productToSave,
            productWithSavedVariations,
          )

          replaceProductInList(finalProduct)
          setSimpleProductDraft(createEditableProductDraft(finalProduct))
          setVariationErrors(readiness.isReady ? {} : readiness.variationErrors)
          setActiveProductTab('variaciones')
          setIsSavingProduct(false)

          return
        }

        replaceProductInList(updatedProduct)
        if (isVariableProduct(updatedProduct)) {
          setSimpleProductDraft(createEditableProductDraft(updatedProduct))
          setActiveProductTab('variaciones')
          setIsSavingProduct(false)

          return
        }
      } catch (error) {
        setProductModalError(error instanceof Error ? error.message : 'No fue posible actualizar el artículo.')
        setIsSavingProduct(false)

        return
      }
    } else {
      try {
        const createdProduct = await requestArticulosApi<Product>(
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
        if (isVariableProduct(productToSave) && isVariableProduct(productWithImages)) {
          const productWithSavedVariations = productToSave.variations.length > 0
            ? await saveVariableDraftVariations(
                productWithImages.id,
                {
                  ...productToSave,
                  id: productWithImages.id,
                },
                productWithImages,
              )
            : productWithImages
          const { product: finalProduct, readiness } = await saveVariableProductStatus(
            {
              ...productToSave,
              id: productWithImages.id,
            },
            productWithSavedVariations,
          )

          replaceProductInList(finalProduct)
          setSimpleProductDraft(createEditableProductDraft(finalProduct))
          setProductModalMode('edit')
          setActiveProductTab('variaciones')
          setVariationErrors(readiness.isReady ? {} : readiness.variationErrors)
          setIsSavingProduct(false)

          return
        }
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
    requestedProductImageIdsRef.current.clear()
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

  const renderVariationImageManager = (variation: ProductVariation) => {
    const variationImages = getSortedVariationImages(variation)
    const isBusy = savingVariationImageIds.includes(variation.id)
    const isEditable = variation.isActive && !isBusy

    return (
      <div className='articulos-ui__variation-images'>
        <div className='articulos-ui__variation-image-strip' aria-label={`Imágenes de ${getVariationLabel(variation)}`}>
          {variationImages.length === 0 ? (
            <span className='articulos-ui__variation-images-empty'>Sin imágenes</span>
          ) : (
            variationImages.map((image, index) => (
              <div
                className={`articulos-ui__variation-image-thumb ${image.isPrimary || index === 0 ? 'articulos-ui__variation-image-thumb--primary' : ''}`}
                key={image.id}
              >
                <button
                  aria-label='Usar como imagen principal'
                  className='articulos-ui__variation-image-preview'
                  disabled={!isEditable || index === 0}
                  onClick={() => handleMakeVariationImagePrimary(variation, image.id)}
                  type='button'
                >
                  <img src={getProductImageDisplayUrl(image)} alt={image.altText || `Imagen ${index + 1}`} />
                </button>
                <div className='articulos-ui__variation-image-actions'>
                  <button
                    aria-label='Mover imagen a la izquierda'
                    disabled={!isEditable || index === 0}
                    onClick={() => handleMoveVariationImage(variation, image.id, -1)}
                    type='button'
                  >
                    ‹
                  </button>
                  <button
                    aria-label='Eliminar imagen'
                    disabled={!isEditable}
                    onClick={() => handleDeleteVariationImage(variation.id, image.id)}
                    type='button'
                  >
                    ×
                  </button>
                  <button
                    aria-label='Mover imagen a la derecha'
                    disabled={!isEditable || index === variationImages.length - 1}
                    onClick={() => handleMoveVariationImage(variation, image.id, 1)}
                    type='button'
                  >
                    ›
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <label
          className={`articulos-ui__variation-image-add ${!isEditable ? 'articulos-ui__variation-image-add--disabled' : ''}`}
          aria-disabled={!isEditable}
        >
          <input
            accept='image/*'
            disabled={!isEditable}
            multiple
            onChange={(event) => {
              handleVariationImageUpload(variation.id, Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
            type='file'
          />
          <span aria-hidden='true'>+</span>
          {isBusy ? 'Guardando...' : 'Agregar'}
        </label>
      </div>
    )
  }

  const productPrimaryActionLabel = (
    activeProductTab === 'atributos'
      ? isVariableDraft && productModalMode === 'create'
        ? 'Guardar y generar variaciones'
        : 'Guardar'
      : activeProductTab === 'variaciones'
        ? 'Guardar'
        : 'Guardar y continuar'
  )
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
                    const enabledVariations = isVariableProduct(product) ? getEnabledActiveVariations(product) : []
                    const variableStock = enabledVariations.reduce<number | null>((total, variation) => (
                      variation.quantity === null ? total : (total ?? 0) + variation.quantity
                    ), null)

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
                        <strong>{isSimpleProduct(product) ? product.inventory.sku || product.id : product.id}</strong>
                        <span>
                          {product.general.name || 'Producto sin nombre'}
                          <small className='articulos-ui__results-product-meta'>
                            {formatProductTypeLabel(product)} · {getProductStatusLabel(product)}
                          </small>
                        </span>
                      </div>
                      <div className='articulos-ui__results-data articulos-ui__results-cell--stock' role='cell'>
                        {adjustingProductId === product.id ? (
                          <div
                            className='articulos-ui__stock-adjuster'
                            onClick={(event) => event.stopPropagation()}
                            onDoubleClick={(event) => event.stopPropagation()}
                          >
                            {isVariableProduct(product) && (
                              <select
                                aria-label='Variación a ajustar'
                                className='articulos-ui__stock-adjuster-select'
                                disabled={isAdjustingProduct}
                                onChange={(event) => handleSelectAdjustmentVariation(event.target.value)}
                                value={adjustingVariationId ?? ''}
                              >
                                <option value=''>Variación</option>
                                {product.variations.map((variation) => (
                                  <option key={variation.id} value={variation.id}>
                                    {variation.sku || getVariationLabel(variation)}
                                  </option>
                                ))}
                              </select>
                            )}
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
                          isVariableProduct(product)
                            ? variableStock ?? '-'
                            : product.inventory.quantity ?? '-'
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
                  <dt>{isVariableProduct(selectedProduct) ? 'Tipo' : 'SKU'}</dt>
                  <dd>{isVariableProduct(selectedProduct) ? 'Producto variable' : selectedProduct.inventory.sku}</dd>
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
                  <dt>{isVariableProduct(selectedProduct) ? 'Variaciones' : 'Existencias'}</dt>
                  <dd>
                    {isVariableProduct(selectedProduct)
                      ? `${getEnabledActiveVariations(selectedProduct).length}/${selectedProduct.variations.length}`
                      : selectedProduct.inventory.quantity ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>
                    {isVariableProduct(selectedProduct)
                      ? getProductStatusLabel(selectedProduct)
                      : stockStatusLabels[selectedProduct.inventory.stockStatus]}
                  </dd>
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
                        onChange={(event) => handleProductTypeChange(event.target.value as ProductTypeOption)}
                        disabled={productModalMode === 'edit'}
                      >
                        {productTypeOptions.map((option) => (
                          <option
                            disabled={option === 'Producto compuesto' || option === 'Servicio'}
                            key={option}
                            value={option}
                          >
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
                    {visibleProductTabs.map((tab) => (
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
                              value={simpleDraftInventory.sku}
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
                                  value={simpleDraftInventory.quantity ?? ''}
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
                                      checked={simpleDraftInventory.reservationPolicy === 'disabled'}
                                      name='inventory-reservations'
                                      onChange={() => updateSimpleProductInventory({ reservationPolicy: 'disabled' })}
                                      type='radio'
                                    />
                                    <span>No permitir</span>
                                  </label>
                                  <label className='articulos-ui__inventory-radio-label'>
                                    <input
                                      checked={simpleDraftInventory.reservationPolicy === 'allowed'}
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
                                  value={simpleDraftInventory.lowStockThreshold ?? ''}
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
                                    checked={simpleDraftInventory.stockStatus === 'in_stock'}
                                    name='inventory-status'
                                    onChange={() => updateSimpleProductInventory({ stockStatus: 'in_stock' })}
                                    type='radio'
                                  />
                                  <span>Hay existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input
                                    checked={simpleDraftInventory.stockStatus === 'out_of_stock'}
                                    name='inventory-status'
                                    onChange={() => updateSimpleProductInventory({ stockStatus: 'out_of_stock' })}
                                    type='radio'
                                  />
                                  <span>Sin existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input
                                    checked={simpleDraftInventory.stockStatus === 'backorder'}
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

                        </div>
                      ) : activeProductTab === 'variaciones' && isVariableDraft ? (
                        <div className='articulos-ui__variations-panel'>
                          <header className='articulos-ui__variations-header'>
                            <div>
                              <h3>Variaciones generadas</h3>
                              <p>
                                {simpleProductDraft.variations.length === 0
                                  ? 'Guarda los atributos usados para variaciones para generar combinaciones.'
                                  : `${getEnabledActiveVariations(simpleProductDraft).length} variaciones habilitadas de ${simpleProductDraft.variations.length}`}
                              </p>
                              {variableDraftReadiness && variableDraftReadiness.missingCount > 0 && (
                                <p className='articulos-ui__variations-draft-note'>
                                  *En borrador, faltan {variableDraftReadiness.missingCount}/{variableDraftReadiness.requiredCount} datos*
                                </p>
                              )}
                            </div>
                            <label className='articulos-ui__variations-shared-toggle'>
                              <input
                                checked={useSameVariationData}
                                disabled={simpleProductDraft.variations.filter((variation) => variation.isActive).length < 2}
                                onChange={(event) => handleUseSameVariationDataChange(event.target.checked)}
                                type='checkbox'
                              />
                              <span>Usar mismos datos en todas las variaciones. Esta acción excluye SKU y carrusel de imágenes.</span>
                            </label>
                          </header>

                          {simpleProductDraft.variations.length === 0 ? (
                            <div className='articulos-ui__variations-empty'>
                              <span>Sin variaciones</span>
                            </div>
                          ) : (
                            <div className='articulos-ui__variations-table-wrap'>
                              <table className='articulos-ui__variations-table'>
                                <thead>
                                  <tr>
                                    <th>Variación</th>
                                    <th>SKU</th>
                                    <th>Cantidad</th>
                                    <th>Estado</th>
                                    <th>Precio</th>
                                    <th>Rebajado</th>
                                    <th>Habilitada</th>
                                    <th>Imágenes</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {simpleProductDraft.variations.map((variation) => {
                                    const isSavingVariation = savingVariationIds.includes(variation.id)
                                    const variationError = variationErrors[variation.id]
                                    const variationIsIncomplete = variation.isEnabled && variation.isActive && !variation.sku?.trim()

                                    return (
                                      <React.Fragment key={variation.id}>
                                      <tr className={variationError || variationIsIncomplete ? 'articulos-ui__variation-row--error' : ''}>
                                        <td>
                                          <strong>{getVariationLabel(variation)}</strong>
                                          {!variation.isActive && <span>Inactiva</span>}
                                        </td>
                                        <td>
                                          <input
                                            aria-invalid={Boolean(variationError || variationIsIncomplete)}
                                            className='articulos-ui__variation-input'
                                            onChange={(event) => updateDraftVariation(variation.id, { sku: event.target.value })}
                                            type='text'
                                            value={variation.sku ?? ''}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            className='articulos-ui__variation-input articulos-ui__variation-input--number'
                                            min='0'
                                            onChange={(event) => updateVariationSharedField(variation.id, { quantity: parseNumberInput(event.target.value) })}
                                            type='number'
                                            value={variation.quantity ?? ''}
                                          />
                                        </td>
                                        <td>
                                          <select
                                            className='articulos-ui__variation-input'
                                            onChange={(event) => {
                                              const stockStatus = event.target.value as StockStatus
                                              updateVariationSharedField(variation.id, { stockStatus })
                                            }}
                                            value={variation.stockStatus}
                                          >
                                            <option value='in_stock'>Hay existencias</option>
                                            <option value='out_of_stock'>Sin existencias</option>
                                            <option value='backorder'>Se puede reservar</option>
                                          </select>
                                        </td>
                                        <td>
                                          <input
                                            className='articulos-ui__variation-input articulos-ui__variation-input--number'
                                            inputMode='decimal'
                                            onChange={(event) => updateVariationSharedField(variation.id, { regularPrice: parseNumberInput(event.target.value) })}
                                            type='text'
                                            value={variation.regularPrice ?? ''}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            className='articulos-ui__variation-input articulos-ui__variation-input--number'
                                            inputMode='decimal'
                                            onChange={(event) => updateVariationSharedField(variation.id, { salePrice: parseNumberInput(event.target.value) })}
                                            type='text'
                                            value={variation.salePrice ?? ''}
                                          />
                                        </td>
                                        <td>
                                          <label className='articulos-ui__variation-check'>
                                            <input
                                              checked={variation.isEnabled}
                                              onChange={(event) => {
                                                updateVariationSharedField(variation.id, { isEnabled: event.target.checked })
                                              }}
                                              type='checkbox'
                                            />
                                          </label>
                                        </td>
                                        <td>
                                          {renderVariationImageManager(variation)}
                                        </td>
                                        <td>
                                          <button
                                            className='articulos-ui__variation-save'
                                            disabled={isSavingVariation}
                                            onClick={() => persistVariation(variation.id)}
                                            type='button'
                                          >
                                            {isSavingVariation ? '...' : 'Guardar'}
                                          </button>
                                        </td>
                                      </tr>
                                      {(variationError || variationIsIncomplete) && (
                                        <tr className='articulos-ui__variation-row--error'>
                                          <td className='articulos-ui__variation-error' colSpan={9}>
                                            {variationError ?? 'Captura un SKU para esta variación habilitada.'}
                                          </td>
                                        </tr>
                                      )}
                                      </React.Fragment>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='articulos-ui__attributes-form'>
                          <header className='articulos-ui__attributes-toolbar'>
                            <div className='articulos-ui__attributes-actions'>
                              <button
                                className='articulos-ui__attributes-button articulos-ui__attributes-button--primary'
                                onClick={handleAddProductAttribute}
                                type='button'
                              >
                                Añadir bloque
                              </button>
                              <button
                                className='articulos-ui__attributes-button'
                                disabled={isLoadingAttributes}
                                onClick={fetchAttributeCatalog}
                                type='button'
                              >
                                {isLoadingAttributes ? 'Cargando...' : 'Recargar catálogo'}
                              </button>
                            </div>
                            <span className='articulos-ui__attributes-status'>
                              {attributeCatalog.length} atributos disponibles
                            </span>
                          </header>

                          <div className='articulos-ui__attributes-scroll'>
                            {attributeCatalogError && (
                              <p className='articulos-ui__attributes-error'>{attributeCatalogError}</p>
                            )}

                            <section className='articulos-ui__attribute-create'>
                              <h3>Nuevo atributo del catálogo</h3>
                              <div className='articulos-ui__attribute-create-grid'>
                                <label className='articulos-ui__attribute-field'>
                                  <span>Nombre:</span>
                                  <input
                                    className='articulos-ui__attribute-input'
                                    onChange={(event) => setNewAttributeName(event.target.value)}
                                    placeholder='Color, Talla, Material'
                                    type='text'
                                    value={newAttributeName}
                                  />
                                </label>
                                <label className='articulos-ui__attribute-field'>
                                  <span>Valores iniciales:</span>
                                  <input
                                    className='articulos-ui__attribute-input'
                                    onChange={(event) => setNewAttributeValues(event.target.value)}
                                    placeholder='Rojo | Azul | Verde'
                                    type='text'
                                    value={newAttributeValues}
                                  />
                                </label>
                                <button
                                  className='articulos-ui__attribute-save'
                                  disabled={isSavingAttributeCatalog}
                                  onClick={createAttributeCatalogItem}
                                  type='button'
                                >
                                  Crear atributo
                                </button>
                              </div>
                            </section>

                            {simpleProductDraft.attributes.map((productAttribute, index) => {
                              const catalogAttribute = attributeCatalog.find((attribute) => attribute.id === productAttribute.attributeId)
                              const selectedValueIds = productAttribute.values.map((value) => value.id)
                              const availableValues = catalogAttribute?.values.filter((value) => !selectedValueIds.includes(value.id)) ?? []

                              return (
                                <section className='articulos-ui__attribute-card' key={productAttribute.id}>
                                  <header className='articulos-ui__attribute-card-head'>
                                    <h3>{catalogAttribute?.name ?? `Atributo ${index + 1}`}</h3>
                                    <div className='articulos-ui__attribute-card-actions'>
                                      <button
                                        className='articulos-ui__attribute-delete'
                                        onClick={() => handleRemoveProductAttribute(productAttribute.id)}
                                        type='button'
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  </header>

                                  <div className='articulos-ui__attribute-fields'>
                                    <div className='articulos-ui__attribute-left'>
                                      <label className='articulos-ui__attribute-field'>
                                        <span>Atributo:</span>
                                        <select
                                          className='articulos-ui__attribute-input'
                                          onChange={(event) => handleSelectProductAttribute(productAttribute.id, event.target.value)}
                                          value={productAttribute.attributeId}
                                        >
                                          <option value=''>Selecciona un atributo</option>
                                          {attributeCatalog.map((attribute) => (
                                            <option
                                              disabled={selectedProductAttributeIds.includes(attribute.id) && attribute.id !== productAttribute.attributeId}
                                              key={attribute.id}
                                              value={attribute.id}
                                            >
                                              {attribute.name}
                                            </option>
                                          ))}
                                        </select>
                                      </label>

                                      {/*
                                      <label className='articulos-ui__attribute-visible'>
                                        <input
                                          checked={productAttribute.visible}
                                          onChange={(event) => updateProductAttribute(productAttribute.id, { visible: event.target.checked })}
                                          type='checkbox'
                                        />
                                        <span>Visible en la página de productos</span>
                                      </label>
                                      */}

                                      {isVariableDraft && (
                                        <label className='articulos-ui__attribute-visible'>
                                          <input
                                            checked={productAttribute.usedForVariations}
                                            onChange={(event) => updateProductAttribute(productAttribute.id, { usedForVariations: event.target.checked })}
                                            type='checkbox'
                                          />
                                          <span>Usado para variaciones</span>
                                        </label>
                                      )}
                                    </div>

                                    <div className='articulos-ui__attribute-field articulos-ui__attribute-field--values'>
                                      <span>Valores:</span>
                                      <small className='articulos-ui__attribute-help'>
                                        Los valores marcados son los disponibles para este producto.
                                      </small>
                                      <div
                                        className='articulos-ui__attribute-values-list'
                                        aria-label='Valores seleccionados para este producto'
                                      >
                                        {productAttribute.values.length > 0 ? (
                                          productAttribute.values.map((value) => (
                                            <span className='articulos-ui__attribute-value-chip' key={value.id}>
                                              <button
                                                aria-label={`Quitar valor ${value.value}`}
                                                className='articulos-ui__attribute-value-remove'
                                                onClick={() => handleRemoveProductAttributeValue(productAttribute.id, value.id)}
                                                type='button'
                                              >
                                                ×
                                              </button>
                                              <span>{value.value}</span>
                                            </span>
                                          ))
                                        ) : (
                                          <span className='articulos-ui__attribute-values-empty'>Sin valores seleccionados</span>
                                        )}
                                      </div>

                                      <select
                                        className='articulos-ui__attribute-input'
                                        disabled={!catalogAttribute || availableValues.length === 0}
                                        onChange={(event) => handleAddProductAttributeValue(productAttribute.id, event.target.value)}
                                        value=''
                                      >
                                        <option value=''>
                                          {!catalogAttribute
                                            ? 'Selecciona un atributo para agregar valores'
                                            : availableValues.length === 0
                                              ? 'Todos los valores están agregados'
                                              : 'Agregar valor existente'}
                                        </option>
                                        {availableValues.map((value) => (
                                          <option key={value.id} value={value.id}>
                                            {value.value}
                                          </option>
                                        ))}
                                      </select>

                                      <div className='articulos-ui__attribute-new-value'>
                                        <input
                                          className='articulos-ui__attribute-input'
                                          disabled={!catalogAttribute || isSavingAttributeCatalog}
                                          onChange={(event) => setNewAttributeValueDrafts((currentDrafts) => ({
                                            ...currentDrafts,
                                            [productAttribute.id]: event.target.value,
                                          }))}
                                          placeholder='Nuevo valor'
                                          type='text'
                                          value={newAttributeValueDrafts[productAttribute.id] ?? ''}
                                        />
                                        <button
                                          className='articulos-ui__attributes-button'
                                          disabled={!catalogAttribute || isSavingAttributeCatalog}
                                          onClick={() => createAttributeCatalogValue(productAttribute)}
                                          type='button'
                                        >
                                          Agregar valor
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </section>
                              )
                            })}
                          </div>
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
