import React from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Dashito, DashHome } from '../components/dashito'
import { FastLogin } from '../components/fastLogin'
import { Modal } from '../components/ventanaModal/modal'
import { useSession } from '../context/SessionContext'

import { MenuOperaciones } from '../components/operaciones/menuOperaciones'
import { InterfazVentas } from '../components/operaciones/ventas/interfazVentas'
import { CorteCaja } from '../components/operaciones/corteCaja/corteCaja'
import { Articulos } from '../components/operaciones/articulos/articulos'
import { Clientes } from '../components/operaciones/clientes/clientes'
import { TraspasosEntrada } from '../components/operaciones/traspasosEntrada/traspasosEntrada'
import { TraspasosSalida } from '../components/operaciones/traspasosSalida/traspasosSalida'
import { NotaCredito } from '../components/operaciones/notaCredito/notaCredito'
import { Factura } from '../components/operaciones/factura/factura'
import { TraspasosSolicitudes } from '../components/operaciones/traspasosSolicitudes/traspasosSolicitudes'


import { Consultas } from '../components/menuConsultas/consultas'
import { Procesos } from '../components/menuProcesos/procesos'
import { Reportes } from '../components/menuReportes/reportes'
import { Estadisticas } from '../components/menuEstadisticas/estadisticas'
import { Configuracion } from '../components/menuConfiguracion/configuracion'

const SessionGate = () => {
  const { isAuthenticated, isBootstrapping } = useSession()

  if (isBootstrapping) {
    return (
      <div className='session-bootstrap'>
        Validando sesión...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Modal
        closeOnBackdrop={false}
        isOpen
        onClose={() => undefined}
        showCloseButton={false}
        title='Inicio de sesión'
        width='min(92vw, 420px)'
      >
        <FastLogin />
      </Modal>
    )
  }

  return (
    <Routes>
        <Route path='/' element={<Dashito/>}>
            <Route index element={<DashHome/>} />
            <Route path='menuOperaciones' element={<MenuOperaciones/>} />
            <Route path='menuOperaciones/ventas' element={<InterfazVentas/>} />
            <Route path='menuOperaciones/corteCaja' element={<CorteCaja/>} />
            <Route path='menuOperaciones/articulos' element={<Articulos/>} />
            <Route path='menuOperaciones/clientes' element={<Clientes/>} />
            <Route path='menuOperaciones/traspasos-entradas' element={<TraspasosEntrada/>} />
            <Route path='menuOperaciones/traspasos-salidas' element={<TraspasosSalida/>} />
            <Route path='menuOperaciones/nota-credito' element={<NotaCredito/>} />
            <Route path='menuOperaciones/factura' element={<Factura/>} />
            <Route path='menuOperaciones/traspasos-solicitudes' element={<TraspasosSolicitudes/>} />

            <Route path='menuConsultas' element={<Consultas/>}/>
            <Route path='menuProcesos' element={<Procesos/>}/>
            <Route path='menuReportes' element={<Reportes/>}/>
            <Route path='menuEstadisticas' element={<Estadisticas/>}/>
            <Route path='menuConfiguracion' element={<Configuracion/>}/>
        </Route>
    </Routes>
  )
}


export const MainRouter = () => {
  return (
    <BrowserRouter>
        <SessionGate />
    </BrowserRouter>
  )
}
