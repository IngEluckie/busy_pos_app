import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Configuracion = () => {
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3
  const menuOperacionesButtons: MenuButton[] = [
  {
    id: 'empresa',
    nombre: 'Empresa',
    imageUrl: '',
    route: '',
  },
  {
    id: 'roles',
    nombre: 'Roles',
    imageUrl: '',
    route: '',
  },
  {
    id: 'usuarios',
    nombre: 'Usuarios',
    imageUrl: '',
    route: '',
  },
  {
    id: 'empleados',
    nombre: 'Empleados',
    imageUrl: '',
    route: '',
  },
  {
    id: 'operatividad',
    nombre: 'Operatividad',
    imageUrl: '',
    route: '',
  },
  {
    id: 'sicar_connect',
    nombre: 'SICAR Connect',
    imageUrl: '',
    route: '',
  },
  {
    id: 'autofactura',
    nombre: 'Autofactura',
    imageUrl: '',
    route: '',
  },
  {
    id: 'nube_sicar',
    nombre: 'Nube SICAR',
    imageUrl: '',
    route: '',
  },
  {
    id: 'multiservicios',
    nombre: 'Multiservicios',
    imageUrl: '',
    route: '',
  },
  {
    id: 'push_service',
    nombre: 'Push Service',
    imageUrl: '',
    route: '',
  },
  {
    id: 'impresoras',
    nombre: 'Impresoras',
    imageUrl: '',
    route: '',
  },
  {
    id: 'perifericos',
    nombre: 'Periféricos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'tickets',
    nombre: 'Tickets',
    imageUrl: '',
    route: '',
  },
  {
    id: 'formatos',
    nombre: 'Formatos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'etiquetas',
    nombre: 'Etiquetas',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cfdi_series',
    nombre: 'CFDI Series',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cfdi_sellos',
    nombre: 'CFDI Sellos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'complementos',
    nombre: 'Complementos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'moneda',
    nombre: 'Moneda',
    imageUrl: '',
    route: '',
  },
  {
    id: 'impuestos',
    nombre: 'Impuestos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'categorias',
    nombre: 'Categorías',
    imageUrl: '',
    route: '',
  },
  {
    id: 'unidades',
    nombre: 'Unidades',
    imageUrl: '',
    route: '',
  },
  {
    id: 'tags',
    nombre: 'Tags',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cajas',
    nombre: 'Cajas',
    imageUrl: '',
    route: '',
  },
  {
    id: 'mesas',
    nombre: 'Mesas',
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
              <h2 className='menu-grid-title'>Configuración</h2>
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
