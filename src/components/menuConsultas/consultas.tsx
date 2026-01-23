import React from 'react'
import { Link } from 'react-router-dom'

type MenuButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Consultas = () => {
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3
  const menuOperacionesButtons: MenuButton[] = [
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
    id: 'traspasos_sal',
    nombre: 'Traspasos Sal',
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
    id: 'traspasos_ent',
    nombre: 'Traspasos Ent',
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
    id: 'pagos_cfdi',
    nombre: 'Pagos CFDI',
    imageUrl: '',
    route: '',
  },
  {
    id: 'traspasos',
    nombre: 'Traspasos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cancelacion',
    nombre: 'Cancelación',
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
    id: 'estado',
    nombre: 'Estado',
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
    id: 'pedidos',
    nombre: 'Pedidos',
    imageUrl: '',
    route: '',
  },
  {
    id: 'membresias',
    nombre: 'Membresías',
    imageUrl: '',
    route: '',
  },
  {
    id: 'cfdi_traslado',
    nombre: 'CFDI Traslado',
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
    id: 'checador',
    nombre: 'Checador',
    imageUrl: '',
    route: '',
  },
  {
    id: 'inv_inicial',
    nombre: 'Inv. Inicial',
    imageUrl: '',
    route: '',
  },
  {
    id: 'ajuste_inv',
    nombre: 'Ajuste Inv.',
    imageUrl: '',
    route: '',
  },
  {
    id: 'lotes',
    nombre: 'Lotes',
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
    id: 'asistencia',
    nombre: 'Asistencia',
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
              <h2 className='menu-grid-title'>Consultas</h2>
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