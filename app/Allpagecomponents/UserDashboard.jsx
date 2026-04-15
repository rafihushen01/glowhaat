
"use client"
import React from 'react'
import UserNav from './UserNav'
import UserHomebanner from './UserHomebanner'
import NewItem from "../Allpagecomponents/NewItem"
import CategoryShowcase from './UsersCategorySlider'
import BehaviorRecommendations from './BehaviorRecommendations'
import BrandFooter from './BrandFooter'
import KhanNotificationInbox from './KhanNotificationInbox'


const UserDashboard = () => {
  return (
    <div>

      <UserNav />
      <div  className="mt-34"> 

   <UserHomebanner  />
      </div>
      <section id="new-arrivals">
        <NewItem/>
      </section>
      <section id="shop-by-category" className="mt-10">
        <CategoryShowcase />
      </section>
      <section id="deals-you-cant-miss">
        <BehaviorRecommendations />
      </section>
      <section className="mx-auto mt-10 max-w-7xl px-4">
        <KhanNotificationInbox role="User" compact />
      </section>
      <BrandFooter />

    </div>
  )
}

export default UserDashboard
