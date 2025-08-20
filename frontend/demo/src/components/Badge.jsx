import React from 'react'

function Badge({children}) {
  return (
    <span className={'inline-flex items-center rounded-full border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700'}>
      {children}
    </span>
  )
}

export default Badge
