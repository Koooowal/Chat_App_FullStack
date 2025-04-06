import React, { useContext, useState } from 'react'
import apiRequest from '../Utility/apiRequest'
import { UserContext } from '../Context/userContext'

function AuthForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const {setUsername:setLoggedInUsername,setId} = useContext(UserContext);
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')
  
  const handleSubmit = async(e)=>{
    e.preventDefault()
    const url = isLoginOrRegister === 'login' ? '/login' : '/register'
    const {data} = await apiRequest.post(url, { username, password })
    setLoggedInUsername(username)
    setId(data._id)
  }
  
  return (
    <div className="flex items-center h-screen bg-blue-50">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
        <input 
          value={username} 
          onChange={e=>setUsername(e.target.value)} 
          type="text" 
          placeholder='Username' 
          className='block w-full p-2 mb-2 border rounded-sm '
        />
        <input 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          type="password" 
          placeholder='Password' 
          className='block w-full p-2 mb-2 border rounded-sm '
        />
        <button 
          className='block w-full p-2 text-white bg-blue-500 rounded-sm'
        >
           {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        <div className="mt-2 text-center">
          {isLoginOrRegister === 'register' && (
            <div>
              Already a member?
              <button className="ml-1" onClick={() => setIsLoginOrRegister('login')}>
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === 'login' && (
            <div>
              Don't have an account?
              <button className="ml-1" onClick={() => setIsLoginOrRegister('register')}>
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default AuthForm