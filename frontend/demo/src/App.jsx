import React from 'react'
import SignupPage from './components/SignupPage'
import Dashboard from './components/Dashboard.jsx'
import {BrowserRouter, Routes, Route } from 'react-router-dom'


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path = '/' element={<SignupPage/>}></Route>
      <Route path = '/dashboard' element={<Dashboard/>}></Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App
