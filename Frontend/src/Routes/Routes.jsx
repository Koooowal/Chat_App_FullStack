import { useContext } from "react";
import AuthForm from "../Components/AuthForm";
import { UserContext } from "../Context/userContext";
import Chat from "../Components/Chat";

export default function Routes() {
  const {username,id} = useContext(UserContext)
  if(username){
    return (
      <Chat/>
    )
  }
  return (
    <AuthForm/>
  )
}
