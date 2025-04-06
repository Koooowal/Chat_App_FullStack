import React from 'react'

function Avatar({ userId, username ,online}) {
  const colors = [
    'bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 
    'bg-purple-200', 'bg-pink-200', 'bg-orange-200', 'bg-teal-200',
    'bg-indigo-200', 'bg-lime-200', 'bg-rose-200', 'bg-emerald-200',
    'bg-cyan-200', 'bg-violet-200', 'bg-fuchsia-200', 'bg-amber-200'
  ]

  const userIdBase10 = parseInt(userId, 16)
  const colorIndex = userIdBase10 % colors.length
  const color = colors[colorIndex]

  return (
    <div className={`flex items-center justify-center w-8 h-8 font-bold rounded-full ${color} relative`}>
      <div className='w-full text-center opacity-70'>{username[0].toUpperCase()}</div>
      {online && <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-600 border-white rounded-full'></div>}
      {!online && <div className='absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-white rounded-full'></div>}
    </div>
  )
}

export default Avatar
