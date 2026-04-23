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

export const Articulos = () => {
  const [openActionId, setOpenActionId] = useState<ActionButton['id'] | null>(null)

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
