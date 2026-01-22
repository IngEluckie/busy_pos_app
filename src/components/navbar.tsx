import React from 'react'
import './globalStyles.css'

// Import images
import topLogo from './allMedia/logos/topLogo.png'
import operacionesIcon from './allMedia/icons/operaciones.png'
import consultasIcon from './allMedia/icons/consultas.png'
import procesosIcon from './allMedia/icons/procesos.png'
import reportesIcon from './allMedia/icons/reportes.png'
// import estadisticasIcon ...
// import configuracionIcon ...

export const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar__section navbar__section--left">
        <button className="navbar__button" type="button">
          <img className="navbar__button-icon" src={operacionesIcon} alt="" aria-hidden="true" />
          Operaciones
        </button>
        <button className="navbar__button" type="button">
          <img className="navbar__button-icon" src={consultasIcon} alt="" aria-hidden="true" />
          Consultas
        </button>
        <button className="navbar__button" type="button">
          <img className="navbar__button-icon" src={procesosIcon} alt="" aria-hidden="true" />
          Procesos
        </button>
        <button className="navbar__button" type="button">
          <img className="navbar__button-icon" src={reportesIcon} alt="" aria-hidden="true" />
          Reportes
        </button>
        <button className="navbar__button" type="button">Estadísticas</button>
        <button className="navbar__button" type="button">Configuración</button>
      </div>
      <div className="navbar__section navbar__section--center">
        <a className="navbar__logo-link" href="/">
          <img className="navbar__logo" src={topLogo} alt="Logo" />
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
              <span className="navbar__panel-text">Username</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
