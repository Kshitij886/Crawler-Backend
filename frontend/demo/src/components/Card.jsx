import React from 'react'

const Card = ({title, subtitle, right, children, className = "" }) => {
  return(
    <div className={`bg-white rounded-2xl shadow-sm border border-zinc-200 ${className}`}>
      {(right || title ) && (
        <div className="flex items-center justify-between px-5 pt-4">
          <div>

          {title && <h3 className="text-zinc-900 text-base font-semibold">{title}</h3>}
          {subtitle && (<p className="text-xs text-zinc-500 leading-5 mt-0.5">{subtitle}</p> )}
        </div>
        {right}
        </div>
      )}
      <div className={`${title ? "px-5 pb-5 pt-3" : "p-5"}`}>{children}</div>
      </div>
  )

}
export default Card
