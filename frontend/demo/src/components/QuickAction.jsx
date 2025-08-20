import React from 'react'

function QuickAction({title, subtitle, icon}) {
  return (
    <div className='rounded-2xl border border-zinc-200 p-4 hover:shadow-sm hover:-translate-y-0.5 transition bg-white'>
        <div className='h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-3'>
            <span>{icon}</span>
        </div>
        <div className=' font-semibold text-zinc-900'>{title}</div>
        <div className=' text-xs text-zinc-500 mt-0.5'>{subtitle}</div>
    </div>
  )
}

export default QuickAction
