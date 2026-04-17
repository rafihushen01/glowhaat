
"use client"
import React from 'react'
import UserNav from './UserNav'
import UserHomebanner from './UserHomebanner'
import NewItem from "../Allpagecomponents/NewItem"
import CategoryShowcase from './UsersCategorySlider'
import BehaviorRecommendations from './BehaviorRecommendations'
import BrandFooter from './BrandFooter'


const UserDashboard = () => {
  return (
    <div className="min-h-screen bg-white">
      <UserNav />
      <main className="pt-[140px] lg:pt-[196px]">
        <section className="mx-auto  w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
          <UserHomebanner />
        </section>
        <section id="new-arrivals">
          <NewItem/>
        </section>
        <section id="shop-by-category" className="mt-10">
          <CategoryShowcase />
        </section>
        <section id="deals-you-cant-miss">
          <BehaviorRecommendations />
        </section>
      </main>
      <BrandFooter />
    </div>
  )
}

export default UserDashboard
