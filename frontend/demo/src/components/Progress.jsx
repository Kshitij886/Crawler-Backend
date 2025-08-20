import React from 'react'

function Progress({value}) {
  return (
    <div className='w-full h-2 bg-zinc-100 rounded-full overflow-hidden'>
      <div
      className="h-full bg-zinc-900 transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
      
    </div>
  )
}

export default Progress
