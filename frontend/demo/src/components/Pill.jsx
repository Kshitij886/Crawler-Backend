import React from 'react'

function Pill({children, active, onClick}) {
  return (
    <button 
    onClick={onclick}
    className={`px-3 py-1.5 rounded-full text-xs border transition ${
      active? 'bg-zinc-900 text-white border-zinc-800'
      :'text-zinc-700 bg-white border-zinc-300 hover:bg-zinc-100 '
    }`}
    >
      {children}
    </button>
  )
}

export default Pill
