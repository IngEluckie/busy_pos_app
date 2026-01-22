import React from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Dashito } from '../components/dashito'
import { MenuOperaciones } from '../components/operaciones/menuOperaciones'

export const MainRouter = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Dashito/>}/>
            <Route path='/menuOperaciones' element={<MenuOperaciones/>}/>
        </Routes>
    </BrowserRouter>
  )
}
