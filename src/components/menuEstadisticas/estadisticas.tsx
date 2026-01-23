import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Estadisticas = () => {
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3
  const menuOperacionesButtons: MenuButton[] = [
  {
    id: 'dashboard',
    nombre: 'Dashboard',
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
    id: 'compras',
    nombre: 'Compras',
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
    id: 'articulos',
    nombre: 'Artículos',
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
  }
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
              <h2 className='menu-grid-title'>Estadísticas</h2>
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