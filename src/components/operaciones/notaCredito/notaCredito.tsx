import React from 'react'
import './style.css'

type ToolbarAction = {
  id: string
  label: string
  shortcut?: string
  icon: string
  tone?: 'success' | 'danger' | 'primary' | 'warning' | 'neutral'
}

type CreditNoteColumn = {
  id: string
  label: string
  className?: string
}

type SummaryRow = {
  id: string
  label: string
  value: string
}

type InfoRow = {
  id: string
  label: string
  value: string
  icon: string
}

type ItemAction = {
  id: string
  label: string
  shortcut?: string
  icon: string
  tone?: 'danger' | 'primary'
}

const toolbarActions: ToolbarAction[] = [
  { id: 'cerrar', label: 'Cerrar', shortcut: '(ESC)', icon: 'CK', tone: 'success' },
  { id: 'nuevo', label: 'Nuevo', shortcut: '(Ctrl + N)', icon: '▤', tone: 'primary' },
  { id: 'editar', label: 'Editar', shortcut: '(F4)', icon: '✎', tone: 'warning' },
  { id: 'remover', label: 'Remover', shortcut: '(F6)', icon: '−', tone: 'danger' },
  { id: 'cliente', label: 'Cliente', shortcut: '(Alt + C)', icon: '♟', tone: 'neutral' },
  { id: 'vender', label: 'Vender', shortcut: '(Alt + V)', icon: '♚', tone: 'neutral' },
  { id: 'mas-opciones', label: 'Más opciones', icon: '⋯', tone: 'neutral' },
]

const creditNoteColumns: CreditNoteColumn[] = [
  { id: 'cantidad', label: 'Cantidad', className: 'nota-credito__col--qty' },
  { id: 'unidad', label: 'Unidad', className: 'nota-credito__col--unit' },
  { id: 'descripcion', label: 'Descripción', className: 'nota-credito__col--description' },
  { id: 'precio', label: 'Precio', className: 'nota-credito__col--money' },
  { id: 'importe', label: 'Importe', className: 'nota-credito__col--money' },
]

const summaryRows: SummaryRow[] = [
  { id: 'subtotal', label: 'Subtotal', value: '$0.00' },
  { id: 'descuentos', label: 'Descuentos', value: '$0.00' },
  { id: 'retenciones', label: 'Retenciones', value: '$0.00' },
]

const infoRows: InfoRow[] = [
  { id: 'documento-origen', icon: '✚', label: 'Documento origen:', value: '-' },
  { id: 'vendedor', icon: '♙', label: 'Vendedor:', value: '-' },
  { id: 'condicion-pago', icon: '◼', label: 'Condición de pago:', value: '-' },
  { id: 'tipo-cambio', icon: '◉', label: 'Tipo de cambio:', value: '-' },
]

const itemActions: ItemAction[] = [
  { id: 'agregar', label: 'Agregar producto', shortcut: '(F2)', icon: '+', tone: 'primary' },
  { id: 'buscar', label: 'Buscar producto', shortcut: '(F2)', icon: '⌕', tone: 'primary' },
  { id: 'remover', label: 'Remover línea', shortcut: '(F6)', icon: '−', tone: 'danger' },
  { id: 'cargar', label: 'Cargar ítems de origen', icon: '▰', tone: 'primary' },
]

export const NotaCredito = () => {
  return (
    <section className='nota-credito' aria-label='Gestión de nota de crédito'>
      <header className='nota-credito__toolbar' aria-label='Acciones de nota de crédito'>
        {toolbarActions.map((action) => (
          <button
            className={`nota-credito__toolbar-action nota-credito__toolbar-action--${action.id} ${
              action.tone ? `nota-credito__toolbar-action--${action.tone}` : ''
            }`}
            key={action.id}
            type='button'
          >
            <span className='nota-credito__toolbar-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='nota-credito__toolbar-label'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
      </header>

      <main className='nota-credito__workspace'>
        <section className='nota-credito__capture-card' aria-label='Datos de la nota de crédito'>
          <div className='nota-credito__capture-left'>
            <label className='nota-credito__search-field'>
              <span>Origen:</span>
              <div className='nota-credito__search-control'>
                <button type='button' aria-label='Buscar origen'>⌕</button>
                <input type='search' placeholder='Buscar factura, venta o documento...' />
              </div>
            </label>

            <label className='nota-credito__search-field'>
              <span className='nota-credito__label-icon'>
                <span aria-hidden='true'>♟</span>
                Cliente:
              </span>
              <div className='nota-credito__search-control'>
                <button type='button' aria-label='Buscar cliente'>⌕</button>
                <input type='search' placeholder='Buscar cliente...' />
              </div>
            </label>
          </div>

          <div className='nota-credito__capture-right'>
            <label className='nota-credito__checkbox'>
              <span>Generar CFDI:</span>
              <input type='checkbox' />
            </label>

            <label className='nota-credito__field nota-credito__field--date'>
              <span>Fecha:</span>
              <input type='date' aria-label='Fecha' />
            </label>

            <label className='nota-credito__field nota-credito__field--series'>
              <span>Serie:</span>
              <input type='text' aria-label='Serie' readOnly />
            </label>

            <label className='nota-credito__field nota-credito__field--currency'>
              <span className='nota-credito__label-icon'>
                <span aria-hidden='true'>$</span>
                Moneda:
              </span>
              <select aria-label='Moneda' defaultValue=''>
                <option value='' disabled>
                  Seleccione moneda
                </option>
              </select>
            </label>

            <label className='nota-credito__field nota-credito__field--folio'>
              <span className='nota-credito__label-icon'>
                <span aria-hidden='true'>NC</span>
                Folio:
              </span>
              <input type='text' aria-label='Folio' readOnly />
            </label>
          </div>
        </section>

        <div className='nota-credito__document-row'>
          <label className='nota-credito__search-field nota-credito__search-field--document'>
            <span className='nota-credito__label-icon'>
              <span aria-hidden='true'>▥</span>
              Documento:
            </span>
            <div className='nota-credito__search-control'>
              <button type='button' aria-label='Seleccionar documento relacionado'>▧</button>
              <input type='search' placeholder='Buscar documento relacionado...' />
              <button type='button' aria-label='Buscar documento relacionado'>⌕</button>
            </div>
          </label>
        </div>

        <div className='nota-credito__content-grid'>
          <section className='nota-credito__main-panel' aria-label='Artículos de la nota de crédito'>
            <div className='nota-credito__table' role='table' aria-label='Artículos agregados'>
              <div className='nota-credito__table-head' role='row'>
                {creditNoteColumns.map((column) => (
                  <div
                    className={`nota-credito__head-cell ${column.className ?? ''}`}
                    key={column.id}
                    role='columnheader'
                  >
                    {column.label}
                  </div>
                ))}
              </div>

              <div className='nota-credito__table-empty' role='row'>
                <div className='nota-credito__empty-icon' aria-hidden='true'>
                  ◇
                </div>
                <p>Aún no hay artículos agregados.</p>
                <span>Agregue productos a la nota de crédito.</span>
              </div>
            </div>

            <div className='nota-credito__item-actions' aria-label='Acciones de artículos'>
              {itemActions.map((action) => (
                <button
                  className={`nota-credito__item-action ${
                    action.tone ? `nota-credito__item-action--${action.tone}` : ''
                  }`}
                  key={action.id}
                  type='button'
                >
                  <span aria-hidden='true'>{action.icon}</span>
                  {action.label} {action.shortcut}
                </button>
              ))}
            </div>
          </section>

          <aside className='nota-credito__sidebar' aria-label='Resumen de la nota de crédito'>
            <section className='nota-credito__side-card nota-credito__summary-card'>
              <h2>Resumen de la nota de crédito</h2>
              <div className='nota-credito__summary-list'>
                {summaryRows.map((row) => (
                  <div className='nota-credito__summary-row' key={row.id}>
                    <span>{row.label}:</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
                <div className='nota-credito__summary-total'>
                  <span>Total:</span>
                  <strong>$0.00</strong>
                </div>
              </div>
            </section>

            <section className='nota-credito__side-card'>
              <h2>Información adicional</h2>
              <dl className='nota-credito__info-list'>
                {infoRows.map((row) => (
                  <div key={row.id}>
                    <dt>
                      <span aria-hidden='true'>{row.icon}</span>
                      {row.label}
                    </dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className='nota-credito__side-card'>
              <h2>Acciones rápidas</h2>
              <div className='nota-credito__quick-actions'>
                <button type='button'>▤ Ver documento origen</button>
                <button type='button'>▣ Observaciones</button>
              </div>
            </section>
          </aside>
        </div>

        <section className='nota-credito__details' aria-label='Detalles adicionales'>
          <label className='nota-credito__field nota-credito__field--seller'>
            <span className='nota-credito__label-icon'>
              <span aria-hidden='true'>♚</span>
              Vendedor:
            </span>
            <select aria-label='Vendedor' defaultValue=''>
              <option value='' disabled>
                Seleccione vendedor...
              </option>
            </select>
          </label>

          <label className='nota-credito__comment'>
            <span className='nota-credito__label-icon'>
              <span aria-hidden='true'>▥</span>
              Comentario:
            </span>
            <textarea placeholder='Ingrese comentarios u observaciones de la nota de crédito...' />
          </label>

          <label className='nota-credito__field nota-credito__field--withholdings'>
            <span>Retenciones:</span>
            <input type='text' value='$0.00' readOnly aria-label='Retenciones' />
          </label>
        </section>

        <footer className='nota-credito__total-bar' aria-label='Total de la nota de crédito'>
          <span className='nota-credito__total-indicator'>
            <span aria-hidden='true'>▥</span>
            0.0
          </span>
          <strong>
            Total: <span>$0.00</span>
          </strong>
        </footer>
      </main>
    </section>
  )
}
