import React, { useEffect, useState, useContext, useRef } from 'react'
import { UserContext } from '../Context/userContext';
import Logo from './Logo';
import {uniqBy} from 'lodash';
import apiRequest from '../Utility/apiRequest';
import Contact from './Contact';

function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const {username,id,setId,setUsername} = useContext(UserContext);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesBoxRef = useRef(null);
  const [offlinePeople, setOfflinePeople] = useState({});
  
  useEffect(() => {
    connectToWs();
  },[]);
  
  function showOnlinePeople(onlineUsers){
    const people = {};
    onlineUsers.forEach(({userId,username}) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function connectToWs(){
    const ws = new WebSocket('ws://localhost:3000');
    setWs(ws);
    ws.addEventListener('message', handleMessage)
    ws.addEventListener('close', () => {
      setTimeout(() => {
        connectToWs();
      }, 1000);
    })
  }

  function handleMessage(e){
    const message = JSON.parse(e.data);
    if('online' in message){
      showOnlinePeople(message.online);
    }else if('text' in message){
      // Dodaj warunek sprawdzający, czy ta wiadomość jest dla bieżącego użytkownika
      if(message.sender === selectedUserId || message.recipient === id){
        setMessages(prev => [...prev, {...message}]);
      } else if(message.sender === id && message.tempId) {
        setMessages(prev => prev.map(m => 
          m._id === message.tempId ? 
            {...message, _id: message._id} : 
            m
        ));
      }
    }
  }

  function sendMessage(e,file=null){
    if(e) e.preventDefault(); 
    if(!newMessage.trim() && !file) {
      return;
    }
    const tempId = Date.now();
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessage,
      file,
      tempId 
    }))
    
    setMessages(prev => [...prev, {
      text: newMessage,
      sender: id, 
      recipient: selectedUserId,
      _id: tempId,
      file: file ? (file.data || null) : null 
    }]);
    
    setNewMessage('');
  }

  function logout(){
    apiRequest.post('/logout').then(() => {
      setUsername(null);
      setId(null);
      setWs(null);
    })
  }

  function sendFile(e){
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        data: reader.result,
        name: e.target.files[0].name,
      });
    }
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
  }

  useEffect(() => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if(selectedUserId){
      apiRequest.get(`/messages/${selectedUserId}`).then((res)=>{
        setMessages(res.data);
      })
    }
  },[selectedUserId]);

  useEffect(() => {
    apiRequest.get('/people').then((res)=>{
      const offlinePeopleArray = res.data
      .filter(p=>p._id !== id)
      .filter(p=> !Object.keys(onlinePeople).includes(p._id))
      const offlinePeople = {};
      offlinePeopleArray.forEach(({_id,username}) => {
        offlinePeople[_id] = username;
      });
      setOfflinePeople(offlinePeople);
    })
    
  },[onlinePeople]);

  const onlinePeopleExcludingSelf = {...onlinePeople};
  delete onlinePeopleExcludingSelf[id];

  const messagesWithoutDuplicates = uniqBy(messages,'_id');

  return (
    <div className='flex h-screen'>
      <div className="flex flex-col w-1/3 bg-white ">
        <div className='flex-grow'>
          <Logo/>
            {Object.keys(onlinePeopleExcludingSelf).map(userId => (
              <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExcludingSelf[userId]}
              onClick={() => {setSelectedUserId(userId)}}
              selected={userId === selectedUserId} />
            ))}
            {Object.keys(offlinePeople).map(userId => (
              <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId]}
              onClick={() => {setSelectedUserId(userId)}}
              selected={userId === selectedUserId} />
            ))}
        </div>
        <div className='flex items-center justify-center gap-20 p-2 text-center'>
          <div className='flex items-center gap-1 text-gray-600'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
            </svg>
            <span className='font-bold'>{username}</span>
          </div>
          <button 
          className='flex p-2 px-2 py-1 text-sm text-gray-500 bg-blue-100 border rounded-sm '
          onClick={logout}
          >
          Logout
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          </button>
        </div>
      </div>

      
      <div className="flex flex-col w-2/3 p-2 bg-blue-50">
        <div className='flex-grow'>
        {!selectedUserId ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-400'>
              &larr; Select a user to start chatting
            </div>
          </div>
        ) : (
          <div className='relative h-full'>
            <div 
              ref={messagesBoxRef} 
              className='absolute top-0 left-0 right-0 px-2 overflow-x-hidden overflow-y-scroll bottom-2'
            >
              {messagesWithoutDuplicates.length > 0 ? (
                messagesWithoutDuplicates.map((message, index) => (
              <div className={(message.sender === id ? 'text-right': 'text-left')} key={index}>
                <div className={
                  "inline-block p-2 my-2 rounded-md text-sm break-words max-w-[60%] " +
                  (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')
                }>
                  {message.text}
                  {message.file && (
                    <div className="mt-2">
                      <img 
                        src={message.file} 
                        alt="Uploaded image" 
                        className="max-w-full rounded-md" 
                        style={{maxHeight: '200px'}} 
                      />
                    </div>
                  )}
                </div>
              </div>
                ))
              ) : (
                <div className='text-center text-gray-400'>No messages yet</div>
              )}
            </div>
          </div>
        )}
        </div>
        {selectedUserId && <form className='flex gap-2 ' onSubmit={sendMessage}>
          <input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            type="text" 
            placeholder='Type your message here' 
            className="flex-grow p-2 bg-white border rounded-sm" 
          />
          <label type='button' className='p-2 text-gray-500 bg-gray-200 border border-gray-400 rounded-sm cursor-pointer'>
          <input type='file' className='hidden' onChange={sendFile}/>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
          </svg>
          </label>
          <button className='p-2 text-white bg-blue-500 rounded-sm' type='submit'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
          </button>  
        </form>}
      </div>
    </div>
  )
}

export default Chat