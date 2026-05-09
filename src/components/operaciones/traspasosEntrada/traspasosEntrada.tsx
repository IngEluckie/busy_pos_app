import React from 'react'
import './style.css'

type ToolbarAction = {
  id: string
  label: string
  shortcut?: string
  icon: string
  tone?: 'success' | 'danger' | 'primary'
}

type TransferColumn = {
  id: string
  label: string
  className?: string
}

type SummaryItem = {
  id: string
  label: string
  value: string
  icon: string
}

const toolbarActions: ToolbarAction[] = [
  { id: 'aplicar', label: 'Aplicar entrada', shortcut: '(F10)', icon: '+', tone: 'success' },
  { id: 'buscar', label: 'Buscar producto', shortcut: '(F2)', icon: '⌕', tone: 'primary' },
  { id: 'remover', label: 'Remover línea', shortcut: '(F6)', icon: '−', tone: 'danger' },
  { id: 'limpiar', label: 'Limpiar', shortcut: '(F7)', icon: '⌫' },
  { id: 'guardar', label: 'Guardar borrador', shortcut: '(Ctrl + S)', icon: '▣', tone: 'primary' },
  { id: 'cancelar', label: 'Cancelar', shortcut: '(Ctrl + Q)', icon: '×', tone: 'danger' },
]

const transferColumns: TransferColumn[] = [
  { id: 'cantidad', label: 'Cantidad', className: 'traspasos-entrada__col--qty' },
  { id: 'unidad', label: 'Unidad', className: 'traspasos-entrada__col--unit' },
  { id: 'factor', label: 'Factor', className: 'traspasos-entrada__col--factor' },
  { id: 'sku', label: 'Clave / SKU', className: 'traspasos-entrada__col--sku' },
  { id: 'descripcion', label: 'Descripción', className: 'traspasos-entrada__col--description' },
  { id: 'existencia', label: 'Exist. actual', className: 'traspasos-entrada__col--stock' },
  { id: 'nueva', label: 'Nueva exist.', className: 'traspasos-entrada__col--stock' },
  { id: 'costo', label: 'Costo', className: 'traspasos-entrada__col--money' },
  { id: 'importe', label: 'Importe', className: 'traspasos-entrada__col--money' },
  { id: 'acciones', label: 'Acciones', className: 'traspasos-entrada__col--actions' },
]

const summaryItems: SummaryItem[] = [
  { id: 'articulos', label: 'Artículos', value: '0', icon: '▣' },
  { id: 'unidades', label: 'Unidades', value: '0', icon: '≋' },
  { id: 'valor', label: 'Valor recibido', value: '$0.00', icon: '◷' },
]

export const TraspasosEntrada = () => {
  return (
    <section className='traspasos-entrada' aria-label='Gestión de traspasos de entrada'>
      <header className='traspasos-entrada__toolbar'>
        {toolbarActions.map((action) => (
          <button
            key={action.id}
            className={`traspasos-entrada__toolbar-action traspasos-entrada__toolbar-action--${action.id} ${
              action.tone ? `traspasos-entrada__toolbar-action--${action.tone}` : ''
            }`}
            type='button'
          >
            <span className='traspasos-entrada__toolbar-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='traspasos-entrada__toolbar-label'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
      </header>

      <main className='traspasos-entrada__workspace'>
        <section className='traspasos-entrada__document-card' aria-label='Datos del traspaso'>
          <div className='traspasos-entrada__form-grid'>
            <label className='traspasos-entrada__field'>
              <span>Sucursal origen:</span>
              <select aria-label='Sucursal origen' defaultValue=''>
                <option value='' disabled>
                  Seleccione sucursal
                </option>
              </select>
            </label>

            <label className='traspasos-entrada__field'>
              <span>Sucursal destino:</span>
              <select aria-label='Sucursal destino' defaultValue=''>
                <option value='' disabled>
                  Seleccione sucursal
                </option>
              </select>
            </label>

            <label className='traspasos-entrada__field'>
              <span>Folio:</span>
              <input type='text' aria-label='Folio' readOnly />
            </label>

            <label className='traspasos-entrada__field'>
              <span>Responsable:</span>
              <select aria-label='Responsable' defaultValue=''>
                <option value='' disabled>
                  Seleccione responsable
                </option>
              </select>
            </label>

            <div className='traspasos-entrada__field traspasos-entrada__field--status'>
              <span>Estado:</span>
              <strong>Borrador</strong>
            </div>

            <label className='traspasos-entrada__field'>
              <span>Fecha recepción:</span>
              <input type='date' aria-label='Fecha recepción' />
            </label>
          </div>
        </section>

        <div className='traspasos-entrada__content-grid'>
          <section className='traspasos-entrada__capture-panel' aria-label='Artículos del traspaso'>
            <div className='traspasos-entrada__search-row'>
              <div className='traspasos-entrada__search-box'>
                <span aria-hidden='true'>▥</span>
                <input type='search' placeholder='Buscar por código de barras, clave o descripción del artículo...' />
              </div>
              <button className='traspasos-entrada__add-button' type='button'>
                <span aria-hidden='true'>+</span>
                Agregar
              </button>
            </div>

            <div className='traspasos-entrada__table' role='table' aria-label='Artículos agregados'>
              <div className='traspasos-entrada__table-head' role='row'>
                {transferColumns.map((column) => (
                  <div
                    key={column.id}
                    className={`traspasos-entrada__head-cell ${column.className ?? ''}`}
                    role='columnheader'
                  >
                    {column.label}
                  </div>
                ))}
              </div>

              <div className='traspasos-entrada__table-empty' role='row'>
                <div className='traspasos-entrada__empty-icon' aria-hidden='true'>
                  ◇
                </div>
                <p>Aún no hay artículos agregados.</p>
                <span>Use el buscador o presione F2 para agregar productos.</span>
              </div>
            </div>

            <div className='traspasos-entrada__bottom-row'>
              <label className='traspasos-entrada__notes'>
                <span>Observaciones del traspaso:</span>
                <textarea placeholder='Ingrese comentarios u observaciones sobre este traspaso...' />
              </label>

              <div className='traspasos-entrada__bottom-summary' aria-label='Resumen inferior del traspaso'>
                {summaryItems.map((item) => (
                  <div key={item.id} className='traspasos-entrada__bottom-summary-item'>
                    <span className='traspasos-entrada__bottom-summary-label'>
                      <span aria-hidden='true'>{item.icon}</span>
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className='traspasos-entrada__sidebar' aria-label='Resumen y validaciones'>
            <section className='traspasos-entrada__side-card'>
              <h2>Resumen del traspaso</h2>
              <div className='traspasos-entrada__summary-list'>
                {summaryItems.map((item) => (
                  <div key={item.id} className='traspasos-entrada__summary-row'>
                    <span>
                      <span aria-hidden='true'>{item.icon}</span>
                      {item.label}:
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className='traspasos-entrada__side-card'>
              <h2>Validaciones</h2>
              <div className='traspasos-entrada__validation'>
                <strong>
                  <span aria-hidden='true'>✓</span>
                  Sin errores
                </strong>
                <p>Agregue artículos para validar el traspaso.</p>
              </div>
            </section>

            <section className='traspasos-entrada__side-card'>
              <h2>Información adicional</h2>
              <dl className='traspasos-entrada__info-list'>
                <div>
                  <dt>Documento origen:</dt>
                  <dd>-</dd>
                </div>
                <div>
                  <dt>Guía / Remisión:</dt>
                  <dd>-</dd>
                </div>
                <div>
                  <dt>Transportista:</dt>
                  <dd>-</dd>
                </div>
                <div>
                  <dt>Observaciones origen:</dt>
                  <dd>-</dd>
                </div>
              </dl>
            </section>

            <section className='traspasos-entrada__side-card'>
              <h2>Acciones rápidas</h2>
              <div className='traspasos-entrada__quick-actions'>
                <button type='button'>▤ Ver documento origen</button>
                <button type='button'>▣ Imprimir traspaso</button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </section>
  )
}
