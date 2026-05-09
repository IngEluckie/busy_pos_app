import React from 'react'
import './style.css'

type ToolbarAction = {
  id: string
  label: string
  shortcut: string
  icon: string
  tone?: 'danger' | 'success' | 'primary' | 'purple'
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

type InfoRow = {
  id: string
  label: string
  value: string
}

const toolbarActions: ToolbarAction[] = [
  { id: 'cerrar', label: 'Cerrar', shortcut: '(ESC)', icon: 'CK', tone: 'success' },
  { id: 'buscar', label: 'Buscar', shortcut: '(F2)', icon: '⌕', tone: 'primary' },
  { id: 'cantidad', label: 'Cantidad', shortcut: '(F5)', icon: '▥', tone: 'primary' },
  { id: 'remover', label: 'Remover', shortcut: '(F6)', icon: '−', tone: 'danger' },
  { id: 'sugerencia', label: 'Sugerencia', shortcut: '(F7)', icon: '✓', tone: 'success' },
  { id: 'cargar-sol', label: 'Cargar Sol', shortcut: '(F8)', icon: '◀', tone: 'purple' },
  { id: 'cargar-tra', label: 'Cargar Tra', shortcut: '(F9)', icon: '▶', tone: 'purple' },
  { id: 'compra', label: 'Compra', shortcut: '(F10)', icon: '▱', tone: 'primary' },
  { id: 'sucursal', label: 'Sucursal', shortcut: '(Alt+S)', icon: '▥', tone: 'primary' },
  { id: 'espera', label: 'Espera', shortcut: '(Alt+E)', icon: '⌛', tone: 'primary' },
  { id: 'rec', label: 'Rec.', shortcut: '(Alt+R)', icon: '↻', tone: 'primary' },
  { id: 'importar', label: 'Importar', shortcut: '(Alt+I)', icon: '▦', tone: 'success' },
]

const transferColumns: TransferColumn[] = [
  { id: 'cantidad', label: 'Cantidad', className: 'traspasos-salida__col--qty' },
  { id: 'factor', label: 'Factor', className: 'traspasos-salida__col--factor' },
  { id: 'sugerencia', label: 'Sugerencia', className: 'traspasos-salida__col--suggestion' },
  { id: 'origen', label: 'Origen', className: 'traspasos-salida__col--branch' },
  { id: 'existencia-origen', label: 'Exist. Origen', className: 'traspasos-salida__col--stock' },
  { id: 'destino', label: 'Destino', className: 'traspasos-salida__col--branch' },
  { id: 'existencia-destino', label: 'Exist. Destino', className: 'traspasos-salida__col--stock' },
  { id: 'descripcion', label: 'Descripción', className: 'traspasos-salida__col--description' },
  { id: 'l', label: 'L', className: 'traspasos-salida__col--mini' },
  { id: 'r', label: 'R', className: 'traspasos-salida__col--mini' },
  { id: 'p', label: 'P', className: 'traspasos-salida__col--mini' },
  { id: 'precio-compra', label: 'Precio U. Comp.', className: 'traspasos-salida__col--money' },
  { id: 'precio-venta', label: 'Precio U. Venta', className: 'traspasos-salida__col--money' },
]

const summaryItems: SummaryItem[] = [
  { id: 'articulos', label: 'Artículos', value: '0', icon: '♙' },
  { id: 'unidades', label: 'Unidades', value: '0', icon: '□' },
  { id: 'valor', label: 'Valor total', value: '$0.00', icon: '▣' },
]

const infoRows: InfoRow[] = [
  { id: 'usuario', label: 'Usuario:', value: '-' },
  { id: 'fecha', label: 'Fecha:', value: '-' },
  { id: 'sucursal-origen', label: 'Sucursal origen:', value: '-' },
  { id: 'sucursal-destino', label: 'Sucursal destino:', value: '-' },
]

export const TraspasosSalida = () => {
  return (
    <section className='traspasos-salida' aria-label='Gestión de traspasos de salida'>
      <header className='traspasos-salida__toolbar' aria-label='Acciones de traspaso de salida'>
        {toolbarActions.map((action) => (
          <button
            key={action.id}
            className={`traspasos-salida__toolbar-action traspasos-salida__toolbar-action--${action.id} ${
              action.tone ? `traspasos-salida__toolbar-action--${action.tone}` : ''
            }`}
            type='button'
          >
            <span className='traspasos-salida__toolbar-icon' aria-hidden='true'>
              {action.icon}
            </span>
            <span className='traspasos-salida__toolbar-label'>
              {action.label} {action.shortcut}
            </span>
          </button>
        ))}
      </header>

      <main className='traspasos-salida__workspace'>
        <section className='traspasos-salida__capture-card' aria-label='Datos del traspaso'>
          <div className='traspasos-salida__form-row'>
            <label className='traspasos-salida__field traspasos-salida__field--folio'>
              <span>Folio:</span>
              <input type='text' aria-label='Folio' readOnly />
            </label>

            <label className='traspasos-salida__field traspasos-salida__field--destination'>
              <span>Sucursal destino:</span>
              <select aria-label='Sucursal destino' defaultValue=''>
                <option value='' disabled>
                  Seleccione sucursal...
                </option>
              </select>
            </label>
          </div>

          <div className='traspasos-salida__form-row traspasos-salida__form-row--dense'>
            <label className='traspasos-salida__field traspasos-salida__field--inventory'>
              <span>Inventario:</span>
              <select aria-label='Inventario' defaultValue=''>
                <option value='' disabled>
                  Seleccione inventario
                </option>
              </select>
            </label>

            <label className='traspasos-salida__checkbox'>
              <input type='checkbox' />
              <span>Consultar Exist. Nube</span>
            </label>

            <label className='traspasos-salida__field traspasos-salida__field--sale-unit'>
              <span>Salida en:</span>
              <select aria-label='Salida en' defaultValue=''>
                <option value='' disabled>
                  Seleccione unidad
                </option>
              </select>
            </label>

            <label className='traspasos-salida__field traspasos-salida__field--code'>
              <span className='traspasos-salida__code-label'>
                <span aria-hidden='true'>▥</span>
                Clave:
              </span>
              <input type='search' aria-label='Clave' />
            </label>

            <button className='traspasos-salida__search-button' type='button' aria-label='Buscar por clave'>
              ⌕
            </button>
          </div>
        </section>

        <div className='traspasos-salida__content-grid'>
          <section className='traspasos-salida__main-panel' aria-label='Artículos del traspaso'>
            <div className='traspasos-salida__table' role='table' aria-label='Artículos agregados'>
              <div className='traspasos-salida__table-head' role='row'>
                {transferColumns.map((column) => (
                  <div
                    key={column.id}
                    className={`traspasos-salida__head-cell ${column.className ?? ''}`}
                    role='columnheader'
                  >
                    {column.label}
                  </div>
                ))}
              </div>

              <div className='traspasos-salida__table-empty' role='row'>
                <div className='traspasos-salida__empty-icon' aria-hidden='true'>
                  ◇
                </div>
                <p>Aún no hay artículos agregados.</p>
                <span>Agregue productos para generar el traspaso de salida.</span>
              </div>
            </div>

            <label className='traspasos-salida__comment'>
              <span>Comentario:</span>
              <input type='text' placeholder='Ingrese comentarios u observaciones del traspaso...' />
            </label>
          </section>

          <aside className='traspasos-salida__sidebar' aria-label='Resumen y acciones del traspaso'>
            <section className='traspasos-salida__side-card'>
              <h2>Resumen del traspaso</h2>
              <div className='traspasos-salida__summary-list'>
                {summaryItems.map((item) => (
                  <div className='traspasos-salida__summary-row' key={item.id}>
                    <span>
                      <span aria-hidden='true'>{item.icon}</span>
                      {item.label}:
                    </span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className='traspasos-salida__side-card'>
              <h2>Validaciones</h2>
              <div className='traspasos-salida__validation'>
                <strong>
                  <span aria-hidden='true'>✓</span>
                  Sin errores
                </strong>
                <p>Todo listo para generar el traspaso.</p>
              </div>
            </section>

            <section className='traspasos-salida__side-card'>
              <h2>Información adicional</h2>
              <dl className='traspasos-salida__info-list'>
                {infoRows.map((row) => (
                  <div key={row.id}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className='traspasos-salida__side-card'>
              <h2>Acciones rápidas</h2>
              <div className='traspasos-salida__quick-actions'>
                <button type='button'>▣ Guardar borrador</button>
                <button type='button'>▤ Imprimir traspaso</button>
              </div>
            </section>
          </aside>
        </div>

        <footer className='traspasos-salida__total-bar' aria-label='Total del traspaso'>
          <span className='traspasos-salida__total-indicator'>
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
