import { BrowserRouter, Route, Routes} from 'react-router-dom'
import Home from './Pages/Home.tsx'
import Room from './Pages/Room.tsx'
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/room/:roomId' element={<Room/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
