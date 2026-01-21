import React from 'react'
import { Route, Routes, BrowserRouter } from 'react-router-dom'
import { Dashito } from '../components/dashito'

export const MainRouter = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Dashito/>}/>
        </Routes>
    </BrowserRouter>
  )
}
