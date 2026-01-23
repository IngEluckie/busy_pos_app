import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Procesos = () => {
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3
  const menuOperacionesButtons: MenuButton[] = [
  {
    id: 'imagenes',
    nombre: 'Imágenes',
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
    id: 'promociones',
    nombre: 'Promociones',
    imageUrl: '',
    route: '',
  },
  {
    id: 'asistencia',
    nombre: 'Asistencia',
    imageUrl: '',
    route: '',
  },
  {
    id: 'acceso',
    nombre: 'Acceso',
    imageUrl: '',
    route: '',
  },
  {
    id: 'produccion',
    nombre: 'Producción',
    imageUrl: '',
    route: '',
  },
  {
    id: 'respaldos',
    nombre: 'Respaldos',
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
    id: 'categoria',
    nombre: 'Categoría',
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
    id: 'localizacion',
    nombre: 'Localización',
    imageUrl: '',
    route: '',
  },
  {
    id: 'domicilios',
    nombre: 'Domicilios',
    imageUrl: '',
    route: '',
  },
  {
    id: 'claves_sat',
    nombre: 'Claves SAT',
    imageUrl: '',
    route: '',
  },
  {
    id: 'importar',
    nombre: 'Importar',
    imageUrl: '',
    route: '',
  },
  {
    id: 'exportar',
    nombre: 'Exportar',
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
              <h2 className='menu-grid-title'>Procesos</h2>
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