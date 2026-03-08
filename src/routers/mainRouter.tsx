import React from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Dashito, DashHome } from '../components/dashito'

import { MenuOperaciones } from '../components/operaciones/menuOperaciones'
import { InterfazVentas } from '../components/operaciones/ventas/interfazVentas'
import { CorteCaja } from '../components/operaciones/corteCaja/corteCaja'
import { Articulos } from '../components/operaciones/articulos/articulos'
import { Clientes } from '../components/operaciones/clientes/clientes'

import { Consultas } from '../components/menuConsultas/consultas'
import { Procesos } from '../components/menuProcesos/procesos'
import { Reportes } from '../components/menuReportes/reportes'
import { Estadisticas } from '../components/menuEstadisticas/estadisticas'
import { Configuracion } from '../components/menuConfiguracion/configuracion'

export const MainRouter = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Dashito/>}>
                <Route index element={<DashHome/>} />
                <Route path='menuOperaciones' element={<MenuOperaciones/>} />
                <Route path='menuOperaciones/ventas' element={<InterfazVentas/>} />
                <Route path='menuOperaciones/corteCaja' element={<CorteCaja/>} />
                <Route path='menuOperaciones/articulos' element={<Articulos/>} />
                <Route path='menuOperaciones/clientes' element={<Clientes/>} />

                <Route path='menuConsultas' element={<Consultas/>}/>
                <Route path='menuProcesos' element={<Procesos/>}/>
                <Route path='menuReportes' element={<Reportes/>}/>
                <Route path='menuEstadisticas' element={<Estadisticas/>}/>
                <Route path='menuConfiguracion' element={<Configuracion/>}/>
            </Route>
        </Routes>
    </BrowserRouter>
  )
}
