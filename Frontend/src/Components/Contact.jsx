import React from 'react'
import Avatar from './Avatar';

function Contact({id,username,onClick,selected,online}) {
  return (
    <div 
      onClick={() => onClick(id)} 
      key={id} 
      className={'flex items-center gap-2  border-b border-gray-100 cursor-pointer ' + (selected ? 'bg-blue-50' : '')}
    >
      {selected && (
        <div className='w-1 h-12 bg-blue-500 rounded-r-md'></div>
      )}
      <div className='flex items-center gap-2 py-2 pl-4'>
        <Avatar userId={id} username={username} online={online}/>
        <span className='text-gray-800 '>{username }</span>
      </div>
    </div>
  )
}

export default Contact