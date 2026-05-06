import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { Navbar } from './navbar'

type DashButton = {
  id: string
  nombre: string
  imageUrl: string
  route: string
  privilegeLevel?: number
}

export const Dashito = () => {
  return (
    <div className='dashContainer'>

        <Navbar/>

        <Outlet />
    </div>
  )
}

export const DashHome = () => {
  const { apiBaseUrl } = useSession()
  // TODO: reemplazar con el nivel real del usuario autenticado.
  const currentUserPrivilege = 3

  const dashButtons: DashButton[] = [
    {
      id: 'user-conf',
      nombre: 'UserConf',
      imageUrl: '/logo192.png',
      route: `${apiBaseUrl}/userconf/`,
    },
    {
      id: 'wp-sync',
      nombre: 'wpSync',
      imageUrl: '/logo192.png',
      route: '',
    },
    {
      id: 'config-ticket',
      nombre: 'Config Ticket',
      imageUrl: '/logo192.png',
      route: '/menuConfiguracion',
    },
    {
      id: 'in-messenger',
      nombre: 'InMessenger',
      imageUrl: '/logo192.png',
      route: '',
    },
    {
      id: 'system-configuration',
      nombre: 'System Configuration',
      imageUrl: '/logo192.png',
      route: '/menuConfiguracion',
    },
    {
      id: 'imprimir',
      nombre: 'Imprimir',
      imageUrl: '/logo192.png',
      route: '',
    },
    {
      id: 'node-conf',
      nombre: 'NodeConf',
      imageUrl: '/logo192.png',
      route: '',
    },
  ]

  const visibleButtons = dashButtons.filter((button) => {
    if (button.privilegeLevel === undefined) {
      return true
    }
    // 1 = superadmin y 5 = cliente; un número menor tiene más privilegios.
    return currentUserPrivilege <= button.privilegeLevel
  })

  return (
    <section className='menu-grid-container'>
      <header className='menu-grid-header'>
        <h2 className='menu-grid-title'>Acceso al dashboard principal BUSINESS SYSTEM</h2>
        <p className='menu-grid-subtitle'>Selecciona una opción</p>
      </header>

      <div className='menu-grid'>
        {visibleButtons.map((button) => {
          const isServerRoute = button.route.startsWith('http')

          if (isServerRoute) {
            return (
              <a key={button.id} href={button.route} className='menu-grid__button'>
                <img className='menu-grid__icon' src={button.imageUrl} alt={button.nombre} />
                <span className='menu-grid__label'>{button.nombre}</span>
              </a>
            )
          }

          return (
            <Link key={button.id} to={button.route} className='menu-grid__button'>
              <img className='menu-grid__icon' src={button.imageUrl} alt={button.nombre} />
              <span className='menu-grid__label'>{button.nombre}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
