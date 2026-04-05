
"use client"
import React from 'react'
import UserNav from './UserNav'
import UserHomebanner from './UserHomebanner'
import NewItem from './NewItem'
import CategoryShowcase from './UsersCategorySlider'
import BehaviorRecommendations from './BehaviorRecommendations'
import BrandFooter from './BrandFooter'


const UserDashboard = () => {
  return (
    <div>

      <UserNav />
      <div  className="mt-34"> 

   <UserHomebanner  />
      </div>
      <div>
        <NewItem />
      </div>
      <section id="shop-by-category" className="mt-10">
        <CategoryShowcase />
      </section>
      <section id="deals-you-cant-miss">
        <BehaviorRecommendations />
      </section>
      <BrandFooter />

    </div>
  )
}

export default UserDashboard
