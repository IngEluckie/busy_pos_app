import React from 'react'
import './style.css'

type ClientAction = {
  id: string
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

type ClientInfoRow = {
  id: string
  icon: string
  label: string
  value: string
}

type ClientSummaryCard = {
  id: string
  icon: string
  value: string
  label: string
}

type ClientPanelAction = {
  id: string
  icon: string
  label: string
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

const clientInfoSections: ClientInfoRow[][] = [
  [
    { id: 'tipo', icon: '♟', label: 'Tipo de cliente:', value: '-' },
    { id: 'credito', icon: '$', label: 'Crédito:', value: '-' },
    { id: 'telefono', icon: '☎', label: 'Teléfono:', value: '-' },
    { id: 'rfc', icon: '▣', label: 'RFC:', value: '-' },
    { id: 'direccion', icon: '◆', label: 'Dirección:', value: '-' },
  ],
  [
    { id: 'limite', icon: '◆', label: 'Límite de crédito:', value: '-' },
    { id: 'saldo', icon: '$', label: 'Saldo actual:', value: '-' },
    { id: 'disponible', icon: '▰', label: 'Crédito disponible:', value: '-' },
  ],
  [
    { id: 'ultima-compra', icon: '▦', label: 'Última compra:', value: '-' },
    { id: 'fecha-registro', icon: '▦', label: 'Fecha de registro:', value: '-' },
  ],
]

const summaryCards: ClientSummaryCard[] = [
  { id: 'compras', icon: '🛒', value: '-', label: 'Compras' },
  { id: 'saldo', icon: '▰', value: '-', label: 'Saldo' },
  { id: 'credito', icon: '▭', value: '-', label: 'Crédito disponible' },
]

const panelActions: ClientPanelAction[] = [
  { id: 'editar', icon: '✎', label: 'Editar cliente' },
  { id: 'historial', icon: '◷', label: 'Ver historial' },
  { id: 'pago', icon: '▣', label: 'Registrar pago' },
  { id: 'estado-cuenta', icon: '▤', label: 'Estado de cuenta' },
]

export const Clientes = () => {
  return (
    <section className='clientes-ui'>
      <header className='clientes-ui__topbar' aria-label='Acciones de clientes'>
        {clientActions.map((action) => (
          <button
            key={action.id}
            aria-label={action.ariaLabel}
            className={`clientes-ui__top-action clientes-ui__top-action--${action.id}`}
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
                type='text'
                placeholder='Buscar por nombre, teléfono, RFC, folio o número de cliente.'
                readOnly
              />
              <button type='button' className='clientes-ui__search-button' aria-label='Buscar cliente'>
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
                <div className='clientes-ui__results-empty'>
                  <span className='clientes-ui__empty-icon' aria-hidden='true'>
                    ▱
                  </span>
                  <p>No hay clientes registrados.</p>
                  <p>Utiliza “Agregar (F3)” para registrar un nuevo cliente.</p>
                </div>
              </div>
            </div>

            <footer className='clientes-ui__pagination'>
              <button className='clientes-ui__page-arrow' type='button' aria-label='Página anterior' disabled>
                ◀
              </button>
              <div className='clientes-ui__page-meta'>
                <span className='clientes-ui__page-label'>Página</span>
                <input className='clientes-ui__page-input' type='text' value='1' readOnly />
                <span className='clientes-ui__page-separator'>de</span>
                <input className='clientes-ui__page-input' type='text' value='1' readOnly />
              </div>
              <button className='clientes-ui__page-arrow' type='button' aria-label='Página siguiente' disabled>
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
                    Seleccione un cliente
                    <span>para ver su información</span>
                  </p>
                </div>

                <div className='clientes-ui__info'>
                  {clientInfoSections.map((section, sectionIndex) => (
                    <dl className='clientes-ui__info-section' key={`section-${sectionIndex}`}>
                      {section.map((row) => (
                        <div className='clientes-ui__info-row' key={row.id}>
                          <dt>
                            <span aria-hidden='true'>{row.icon}</span>
                            {row.label}
                          </dt>
                          <dd>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ))}
                </div>

                <div className='clientes-ui__summary-grid'>
                  {summaryCards.map((card) => (
                    <div className={`clientes-ui__summary-card clientes-ui__summary-card--${card.id}`} key={card.id}>
                      <span className='clientes-ui__summary-icon' aria-hidden='true'>
                        {card.icon}
                      </span>
                      <strong>{card.value}</strong>
                      <span>{card.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='clientes-ui__panel-actions'>
                {panelActions.map((action) => (
                  <button className='clientes-ui__panel-action' key={action.id} type='button'>
                    <span aria-hidden='true'>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
