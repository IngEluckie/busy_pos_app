import React from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Dashito } from '../components/dashito'
import { MenuOperaciones } from '../components/operaciones/menuOperaciones'
import { Consultas } from '../components/menuConsultas/consultas'
import { Procesos } from '../components/menuProcesos/procesos'
import { Reportes } from '../components/menuReportes/reportes'
import { Estadisticas } from '../components/menuEstadisticas/estadisticas'
import { Configuracion } from '../components/menuConfiguracion/configuracion'

export const MainRouter = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Dashito/>}/>
            <Route path='/menuOperaciones' element={<MenuOperaciones/>}/>
            <Route path='/menuConsultas' element={<Consultas/>}/>
            <Route path='/menuProcesos' element={<Procesos/>}/>
            <Route path='/menuReportes' element={<Reportes/>}/>
            <Route path='/menuEstadisticas' element={<Estadisticas/>}/>
            <Route path='/menuConfiguracion' element={<Configuracion/>}/>
        </Routes>
    </BrowserRouter>
  )
}
