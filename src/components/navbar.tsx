import React from 'react'
import { Link } from 'react-router-dom'
import './globalStyles.css'
import { useSession } from '../context/SessionContext'

// Import images
import operacionesIcon from './allMedia/icons/operaciones.png'
import consultasIcon from './allMedia/icons/consultas.png'
import procesosIcon from './allMedia/icons/procesos.png'
import reportesIcon from './allMedia/icons/reportes.png'
import estadisticasIcon from './allMedia/icons/estadisticas.png'
import configuracionIcon from './allMedia/icons/configuracion.png'

export const Navbar = () => {
  const { user } = useSession()
  const usernameLabel = user?.username || user?.fullname || 'Usuario'

  return (
    <nav className="navbar">
      <div className="navbar__section navbar__section--left">
        <Link className="navbar__button" to="/menuOperaciones">
          <img className="navbar__button-icon" src={operacionesIcon} alt="" aria-hidden="true" />
          Operaciones
        </Link>
        <Link className="navbar__button" to="/menuConsultas">
          <img className="navbar__button-icon" src={consultasIcon} alt="" aria-hidden="true" />
          Consultas
        </Link>
        <Link className="navbar__button" to="/menuProcesos">
          <img className="navbar__button-icon" src={procesosIcon} alt="" aria-hidden="true" />
          Procesos
        </Link>
        <Link className="navbar__button" to="/menuReportes">
          <img className="navbar__button-icon" src={reportesIcon} alt="" aria-hidden="true" />
          Reportes
        </Link>
        <Link className="navbar__button" to="/menuEstadisticas">
          <img className="navbar__button-icon" src={estadisticasIcon} alt="" aria-hidden="true" />
          Estadísticas
        </Link>
        <Link className="navbar__button" to="/menuConfiguracion">
          <img className="navbar__button-icon" src={configuracionIcon} alt="" aria-hidden="true" />
          Configuración
        </Link>
      </div>
      <div className="navbar__section navbar__section--center">
        <a className="navbar__logo-link" href="/">
          {/*<img className="navbar__logo" src={topLogo} alt="Logo" />*/}
        </a>
      </div>
      <div className="navbar__section navbar__section--right">
        <div className="navbar__panel">
          <div className="navbar__panel-labels">
            <span className="navbar__panel-title">nombre caja</span>
            <span className="navbar__panel-version">versión v1.0.0</span>
          </div>
          <div className="navbar__panel-body">
            <div className="navbar__panel-item">
              <div className="navbar__panel-icon" aria-hidden="true">!!</div>
              <span className="navbar__panel-text">Notifications</span>
            </div>
            <div className="navbar__panel-item">
              <div className="navbar__panel-icon" aria-hidden="true">?</div>
              <span className="navbar__panel-text">Info</span>
            </div>
            <div className="navbar__panel-item">
              <div className="navbar__panel-icon" aria-hidden="true">👤</div>
              <span className="navbar__panel-text">{usernameLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
