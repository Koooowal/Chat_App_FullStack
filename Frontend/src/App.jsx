import {UserContextProvider} from "./Context/userContext";
import Routes from "./Routes/Routes"

function App() {
  return (
    <UserContextProvider> 
      <Routes />
    </UserContextProvider>
  )
}

export default App
