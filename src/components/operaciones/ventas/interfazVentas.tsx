import React from 'react'
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

export const InterfazVentas = () => {
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
            <div className='ventas-ui__product-preview' aria-label='Previsualización del producto' />

            <div className='ventas-ui__capture-fields'>
              <div className='ventas-ui__barcode-row'>
                <span className='ventas-ui__field-symbol' aria-hidden='true'>
                  ||||
                </span>
                <input className='ventas-ui__input ventas-ui__input--barcode' type='text' />
                <button className='ventas-ui__tiny-btn' type='button'>
                  🔎
                </button>
                <button className='ventas-ui__tiny-btn' type='button'>
                  💾
                </button>
                <div className='ventas-ui__date-wrap'>
                  <span className='ventas-ui__field-symbol' aria-hidden='true'>
                    🗓
                  </span>
                  <input className='ventas-ui__input ventas-ui__input--date' type='text' value='08/03/2026' readOnly />
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
                <input
                  className='ventas-ui__input ventas-ui__input--client'
                  type='text'
                  value='Público en General'
                  readOnly
                />
                <button className='ventas-ui__tiny-btn' type='button'>
                  Ⓟ
                </button>

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
            <div className='ventas-ui__table-body' />
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
              <span>Total: $ 0.00 MXN</span>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
