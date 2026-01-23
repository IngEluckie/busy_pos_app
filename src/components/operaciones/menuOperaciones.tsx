import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const MenuOperaciones = () => {
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3

  const menuOperacionesButtons: MenuButton[] = [
    {
      id: 'ventas',
      nombre: 'Ventas',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/ventas',
    },
    {
      id: 'devoluciones',
      nombre: 'Devoluciones',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/devoluciones',
    },
    {
      id: 'traspasos-salidas',
      nombre: 'Traspasos Sal',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/traspasos-salidas',
    },
    {
      id: 'compras',
      nombre: 'Compras',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/compras',
    },
    {
      id: 'nota-credito',
      nombre: 'Nota de crédito',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/nota-credito',
    },
    {
      id: 'traspasos-entradas',
      nombre: 'Traspasos Ent',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/traspasos-entradas',
    },
    {
      id: 'factura',
      nombre: 'Factura',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/factura',
    },
    {
      id: 'factura-cfdi',
      nombre: 'Factura CFDI',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/factura-cfdi',
    },
    {
      id: 'cotizacion',
      nombre: 'Cotización',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/cotizacion',
    },
    {
      id: 'pedidos',
      nombre: 'Pedidos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/pedidos',
    },
    {
      id: 'cfdi-traslado',
      nombre: 'CFDI Traslado',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/cfdi-traslado',
    },
    {
      id: 'comandero',
      nombre: 'Comandero',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/comandero',
    },
    {
      id: 'cocina',
      nombre: 'Cocina',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/cocina',
    },
    {
      id: 'traspasos-solicitudes',
      nombre: 'Traspasos (solicitudes)',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/traspasos-solicitudes',
    },
    {
      id: 'corte-caja',
      nombre: 'Corte de Caja',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/corte-caja',
    },
    {
      id: 'articulos',
      nombre: 'Artículos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/articulos',
      privilegeLevel: 3,
    },
    {
      id: 'paquetes',
      nombre: 'Paquetes',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/paquetes',
    },
    {
      id: 'insumos',
      nombre: 'Insumos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/insumos',
    },
    {
      id: 'platillos',
      nombre: 'Platillos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/platillos',
    },
    {
      id: 'combos',
      nombre: 'Combos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/combos',
    },
    {
      id: 'clientes',
      nombre: 'Clientes',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/clientes',
    },
    {
      id: 'proveedores',
      nombre: 'Proveedores',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/proveedores',
    },
    {
      id: 'prearticulos',
      nombre: 'Preartículos',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/prearticulos',
    },
    {
      id: 'inventario-inicial',
      nombre: 'Inv. Inicial',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/inventario-inicial',
    },
    {
      id: 'ajuste-inv',
      nombre: 'Ajuste Inv.',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/ajuste-inv',
    },
    {
      id: 'lotes-series',
      nombre: 'Lotes/Series',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/lotes-series',
    },
    {
      id: 'inv-en-ruta',
      nombre: 'Inv. en Ruta',
      imageUrl: '/logo192.png',
      route: '/menuOperaciones/inv-en-ruta',
    },
  ]

  const visibleButtons = menuOperacionesButtons.filter((button) => {
    if (button.privilegeLevel === undefined) {
      return true
    }
    // 1 = superadmin y 5 = cliente; un número menor tiene más privilegios.
    return currentUserPrivilege <= button.privilegeLevel
  })

  return (
    <section className='menu-grid-container'>
      <header className='menu-grid-header'>
        <h2 className='menu-grid-title'>Operaciones</h2>
        <p className='menu-grid-subtitle'>Selecciona una opción</p>
      </header>

      <div className='menu-grid'>
        {visibleButtons.map((button) => (
          <Link key={button.id} to={button.route} className='menu-grid__button'>
            <img className='menu-grid__icon' src={button.imageUrl} alt={button.nombre} />
            <span className='menu-grid__label'>{button.nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
