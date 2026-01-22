import React from 'react'
import './globalStyles.css'
import topLogo from './allMedia/logos/topLogo.png'

export const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar__section navbar__section--left">
        <button className="navbar__button" type="button">Operaciones</button>
        <button className="navbar__button" type="button">Consultas</button>
        <button className="navbar__button" type="button">Procesos</button>
        <button className="navbar__button" type="button">Reportes</button>
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
