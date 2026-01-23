import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './navbar'

export const Dashito = () => {
  return (
    <div className='dashContainer'>

        <Navbar/>

        <Outlet />
    </div>
  )
}

export const DashHome = () => {
  return (
    <>
      <h1>Bienvenidos a la app.</h1>
      <p>Primer versión del Dash principal del sistema punto de venta</p>
    </>
  )
}
