import React from 'react'
import Home from './Allpagecomponents/Home'

// export const serverurl="https://damaskbackend-production.up.railway.app"
export const secondserverurl="http://localhost:8080"
export const frontendurl="http://khancosmetics.vercel.app"
export { default as rafiworldlogo } from "../public/RafiWorld.jpg"
const page = () => {
  return (
    <div>
    
      <Home />
    </div>
  )
}

export default page