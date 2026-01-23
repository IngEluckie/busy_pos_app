import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Reportes = () => {

  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3
  const menuOperacionesButtons: MenuButton[] = [
  {
    id: 'global',
    nombre: 'Global',
    imageUrl: '',
    route: '',
  },
  {
    id: 'ventas',
    nombre: 'Ventas',
    imageUrl: '',
    route: '',
  },
  {
    id: 'devoluciones',
    nombre: 'Devoluciones',
    imageUrl: '',
    route: '',
  },
  {
    id: 'utilidad',
    nombre: 'Utilidad',
    imageUrl: '',
    route: '',
  },
  {
    id: 'compras',
    nombre: 'Compras',
    imageUrl: '',
    route: '',
  },
  {
    id: 'notas_credito',
    nombre: 'Notas de Crédito',
    imageUrl: '',
    route: '',
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    imageUrl: '',
    route: '',
  },
  {
    id: 'proveedores',
    nombre: 'Proveedores',
    imageUrl: '',
    route: '',
  },
  {
    id: 'movimientos',
    nombre: 'Movimientos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cortes_caja',
    nombre: 'Cortes de Caja',
    imageUrl: '',
    route: '',
  },
  {
    id: 'articulos',
    nombre: 'Artículos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'clientes_catalogos',
    nombre: 'Clientes',
    imageUrl: '',
    route: '',
  },
  {
    id: 'proveedores_catalogos',
    nombre: 'Proveedores',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cotizacion',
    nombre: 'Cotización',
    imageUrl: '',
    route: '',
  },
  {
    id: 'farmacias',
    nombre: 'Farmacias',
    imageUrl: '',
    route: '',
  },
  {
    id: 'monedero',
    nombre: 'Monedero',
    imageUrl: '',
    route: '',
  },
  {
    id: 'contador',
    nombre: 'Contador',
    imageUrl: '',
    route: '',
  },
  {
    id: 'restaurant',
    nombre: 'Restaurant',
    imageUrl: '',
    route: '',
  },
  {
    id: 'vacaciones',
    nombre: 'Vacaciones',
    imageUrl: '',
    route: '',
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    imageUrl: '',
    route: '',
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
            <h2 className='menu-grid-title'>Reportes</h2>
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
