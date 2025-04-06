import {createContext} from "react";
import {useState,useEffect} from "react";
import apiRequest from "../Utility/apiRequest";

export const UserContext = createContext({});


export function UserContextProvider({children}) {
  const [username, setUsername] = useState(null)
  const [id, setId] = useState(null)

  useEffect(() => {
    apiRequest.get('/profile',{withCredentials:true}).then(response => {
      setId(response.data.userId);
      setUsername(response.data.username);
    });
  },[]);

  return (
    <UserContext.Provider value={{username, setUsername,id, setId}}>
      {children}
    </UserContext.Provider>
  )
}