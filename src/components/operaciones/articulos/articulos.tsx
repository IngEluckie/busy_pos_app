import React, { useState } from 'react'
import './style.css'
import { Modal } from '../../ventanaModal/modal'

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

const productTypeOptions = ['Producto simple', 'Producto compuesto', 'Servicio']

export const Articulos = () => {
  const [openActionId, setOpenActionId] = useState<ActionButton['id'] | null>(null)
  const [activeProductTab, setActiveProductTab] = useState<ProductTab>('general')
  const [productType, setProductType] = useState(productTypeOptions[0])
  const [trackInventory, setTrackInventory] = useState(true)

  const handleOpenActionModal = (actionId: ActionButton['id']) => {
    setOpenActionId(actionId)
  }

  const handleCloseActionModal = () => {
    setOpenActionId(null)
  }

  return (
    <section className='articulos-ui'>
      <header className='articulos-ui__topbar'>
        {topActions.map((action) => (
          <button
            key={action.id}
            className='articulos-ui__top-action'
            onClick={() => handleOpenActionModal(action.id)}
            type='button'
          >
            <span className='articulos-ui__top-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='articulos-ui__top-text'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
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
              />
              <button type='button' className='articulos-ui__search-button' aria-label='Buscar artículo'>
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
                <p className='articulos-ui__results-empty'>Sin coincidencias para mostrar.</p>
              </div>
            </div>

            <footer className='articulos-ui__pagination'>
              <button type='button' className='articulos-ui__page-arrow' aria-label='Página anterior'>
                ◀
              </button>

              <div className='articulos-ui__page-meta'>
                <span className='articulos-ui__page-label'>Página</span>
                <input className='articulos-ui__page-input' type='text' value='0' readOnly />
                <span className='articulos-ui__page-separator'>de</span>
                <input className='articulos-ui__page-input' type='text' value='0' readOnly />
              </div>

              <button type='button' className='articulos-ui__page-arrow' aria-label='Página siguiente'>
                ▶
              </button>
            </footer>
          </section>

          <aside className='articulos-ui__right-column'>
            <h2 className='articulos-ui__detail-title'>Artículo Seleccionado</h2>

            <div className='articulos-ui__preview'>
              <button type='button' className='articulos-ui__preview-arrow' aria-label='Imagen anterior'>
                ❮
              </button>
              <div className='articulos-ui__preview-placeholder' aria-label='Imagen del artículo'>
                📷
              </div>
              <button type='button' className='articulos-ui__preview-arrow' aria-label='Imagen siguiente'>
                ❯
              </button>
            </div>

            <div className='articulos-ui__detail-empty'>
              <span>-</span>
              <span>-</span>
            </div>
          </aside>
        </div>
      </div>

      {topActions.map((action) => {
        const modalContent = actionModalContent[action.id]

        if (action.id === 'agregar') {
          return (
            <Modal
              key={action.id}
              isOpen={openActionId === action.id}
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
                    <h2 className='articulos-ui__product-modal-title'>Datos del producto -</h2>
                    <label className='articulos-ui__product-type-label'>
                      <span className='articulos-ui__product-type-text'>Tipo de producto</span>
                      <select
                        className='articulos-ui__product-type-select'
                        value={productType}
                        onChange={(event) => setProductType(event.target.value)}
                      >
                        {productTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <button
                    aria-label='Cerrar ventana modal'
                    className='articulos-ui__product-modal-close'
                    onClick={handleCloseActionModal}
                    type='button'
                  >
                    ×
                  </button>
                </header>

                <div className='articulos-ui__product-modal-layout'>
                  <section className='articulos-ui__product-form-panel'>
                    <nav className='articulos-ui__product-tabs' aria-label='Secciones del producto'>
                      {productTabs.map((tab) => (
                        <button
                          key={tab.id}
                          className={`articulos-ui__product-tab ${activeProductTab === tab.id ? 'articulos-ui__product-tab--active' : ''}`}
                          onClick={() => setActiveProductTab(tab.id)}
                          type='button'
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>

                    <div className='articulos-ui__product-tab-panel'>
                      {activeProductTab === 'general' ? (
                        <div className='articulos-ui__product-general-grid'>
                          <label className='articulos-ui__product-field articulos-ui__product-field--name'>
                            <span className='articulos-ui__product-label'>Nombre del producto:</span>
                            <input className='articulos-ui__product-input' type='text' />
                          </label>

                          <label className='articulos-ui__product-field articulos-ui__product-field--short'>
                            <span className='articulos-ui__product-label'>Descripción corta:</span>
                            <input className='articulos-ui__product-input' type='text' />
                          </label>

                          <label className='articulos-ui__product-field articulos-ui__product-field--large'>
                            <span className='articulos-ui__product-label'>Descripción amplia:</span>
                            <textarea className='articulos-ui__product-textarea' />
                          </label>

                          <div className='articulos-ui__product-price-grid'>
                            <label className='articulos-ui__product-price-field'>
                              <span className='articulos-ui__product-label'>Precio regular:</span>
                              <input className='articulos-ui__product-input articulos-ui__product-input--price' type='text' inputMode='decimal' />
                            </label>

                            <label className='articulos-ui__product-price-field'>
                              <span className='articulos-ui__product-label'>Precio rebajado:</span>
                              <input className='articulos-ui__product-input articulos-ui__product-input--price' type='text' inputMode='decimal' />
                            </label>
                          </div>
                        </div>
                      ) : activeProductTab === 'inventario' ? (
                        <div className='articulos-ui__inventory-form'>
                          <label className='articulos-ui__inventory-field'>
                            <span className='articulos-ui__inventory-label articulos-ui__inventory-label--link'>SKU</span>
                            <input className='articulos-ui__inventory-input' type='text' />
                            <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre SKU'>
                              ?
                            </button>
                          </label>

                          <div className='articulos-ui__inventory-field articulos-ui__inventory-field--check'>
                            <span className='articulos-ui__inventory-label'>Gestión de inventario</span>
                            <label className='articulos-ui__inventory-check-label'>
                              <input
                                checked={trackInventory}
                                className='articulos-ui__inventory-checkbox'
                                onChange={(event) => setTrackInventory(event.target.checked)}
                                type='checkbox'
                              />
                              <span>Hacer seguimiento de la cantidad de inventario de este producto</span>
                            </label>
                          </div>

                          {trackInventory ? (
                            <>
                              <label className='articulos-ui__inventory-field'>
                                <span className='articulos-ui__inventory-label'>Cantidad</span>
                                <input className='articulos-ui__inventory-input' type='number' defaultValue='1' min='0' />
                                <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre cantidad'>
                                  ?
                                </button>
                              </label>

                              <fieldset className='articulos-ui__inventory-field articulos-ui__inventory-reservations'>
                                <legend className='articulos-ui__inventory-label'>¿Permitir reservas?</legend>
                                <div className='articulos-ui__inventory-radio-stack'>
                                  <label className='articulos-ui__inventory-radio-label'>
                                    <input name='inventory-reservations' type='radio' defaultChecked />
                                    <span>No permitir</span>
                                  </label>
                                  <label className='articulos-ui__inventory-radio-label'>
                                    <input name='inventory-reservations' type='radio' />
                                    <span>Permitir</span>
                                  </label>
                                </div>
                              </fieldset>

                              <label className='articulos-ui__inventory-field'>
                                <span className='articulos-ui__inventory-label'>Umbral de pocas existencias</span>
                                <input
                                  className='articulos-ui__inventory-input'
                                  type='text'
                                  placeholder='Umbral de la tienda (2)'
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
                                  <input name='inventory-status' type='radio' defaultChecked />
                                  <span>Hay existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input name='inventory-status' type='radio' />
                                  <span>Sin existencias</span>
                                </label>
                                <label className='articulos-ui__inventory-radio-label'>
                                  <input name='inventory-status' type='radio' />
                                  <span>Se puede reservar</span>
                                </label>
                              </div>
                              <button className='articulos-ui__inventory-help' type='button' aria-label='Ayuda sobre estado de inventario'>
                                ?
                              </button>
                            </fieldset>
                          )}
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
                                    type='text'
                                    placeholder='por ejemplo, la longitud o el peso'
                                  />
                                </label>

                                <label className='articulos-ui__attribute-visible'>
                                  <input type='checkbox' defaultChecked />
                                  <span>Visible en la página de productos</span>
                                </label>
                              </div>

                              <label className='articulos-ui__attribute-field articulos-ui__attribute-field--values'>
                                <span>Valor(es):</span>
                                <textarea
                                  className='articulos-ui__attribute-textarea'
                                  placeholder='Introduce un texto descriptivo. Utiliza «|» para separar los distintos valores.'
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
                  </section>

                  <aside className='articulos-ui__product-image-panel'>
                    <button className='articulos-ui__product-image-button' type='button'>
                      Agregar imagen
                    </button>

                    <div className='articulos-ui__product-image-preview' aria-label='Vista previa de imagen del producto'>
                      <span aria-hidden='true'>▥</span>
                    </div>

                    <div className='articulos-ui__product-thumbs'>
                      <button className='articulos-ui__product-thumbs-arrow' type='button' aria-label='Imagen anterior'>
                        ‹
                      </button>
                      <div className='articulos-ui__product-thumb articulos-ui__product-thumb--active' />
                      <div className='articulos-ui__product-thumb' />
                      <div className='articulos-ui__product-thumb' />
                      <div className='articulos-ui__product-thumb' />
                      <button className='articulos-ui__product-thumbs-arrow' type='button' aria-label='Imagen siguiente'>
                        ›
                      </button>
                    </div>

                    <button className='articulos-ui__product-save' type='button'>
                      Guardar
                    </button>
                  </aside>
                </div>
              </div>
            </Modal>
          )
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
    </section>
  )
}
