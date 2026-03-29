"use client"
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { serverurl } from '../utils/constants/serverurl'


const UserHomebanner = () => {
    const [banners, setBanners] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [touchStart, setTouchStart] = useState(null)
    const [touchEnd, setTouchEnd] = useState(null)
    const timerRef = useRef(null)

    // ১. ডাটা ফেচিং এবং সর্টিং
  useEffect(() => {
    const fetchBanners = async () => {
        try {
            const res = await axios.get(`${serverurl}/homebanner/gethomebanners`)

            // 🔥 Ensure array exists
            const bannerArray = Array.isArray(res.data)
                ? res.data
                : res.data?.data || res.data?.banners || []

            if (bannerArray.length > 0) {
                const sortedBanners = [...bannerArray].sort(
                    (a, b) => (a?.bannernumber || 0) - (b?.bannernumber || 0)
                )
                setBanners(sortedBanners)
            } else {
                setBanners([])
            }

        } catch (error) {
            console.error("Banner fetching error:", error)
            setBanners([])
        } finally {
            setLoading(false)
        }
    }

    if (serverurl) fetchBanners()
}, [])


    // ২. অটো স্লাইড লজিক এবং Pause on Hover
    const startSlider = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            nextSlide()
        }, 13000)
    }

    const stopSlider = () => {
        if (timerRef.current) clearInterval(timerRef.current)
    }

    useEffect(() => {
        if (banners.length > 0) {
            startSlider()
        }
        return () => stopSlider()
    }, [currentIndex, banners.length])


    // ৩. নেভিগেশন ফাংশন
    const prevSlide = () => {
        const isFirstSlide = currentIndex === 0
        const newIndex = isFirstSlide ? banners.length - 1 : currentIndex - 1
        setCurrentIndex(newIndex)
    }

    const nextSlide = () => {
        const isLastSlide = currentIndex === banners.length - 1
        const newIndex = isLastSlide ? 0 : currentIndex + 1
        setCurrentIndex(newIndex)
    }

    const goToSlide = (slideIndex) => {
        setCurrentIndex(slideIndex)
    }

    // ৪. সোয়াইপ ফাংশনালিটি (Mobile Swipe)
    const onTouchStart = (e) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        stopSlider() // টাচ করার সময় স্লাইড বন্ধ থাকবে
    }

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe) nextSlide()
        if (isRightSwipe) prevSlide()
        
        startSlider() // টাচ শেষ হলে আবার চালু হবে
    }

    // ৫. লোডিং স্কেলেটন (Shimmer Effect)
    if (loading) {
        return (
            <div className='max-w-[1920px] mx-auto w-full py-4 px-2 md:px-0'>
                <div className="w-full h-[200px] sm:h-[350px] md:h-[500px] lg:h-[600px] rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center">
                    <span className="text-gray-400 font-medium">Loading Offers...</span>
                </div>
            </div>
        )
    }

    if (banners.length === 0) return null

    return (
        <div 
            className='max-w-[1920px] mx-auto w-full py-2 sm:py-4  md: group relative'
            onMouseEnter={stopSlider}
            onMouseLeave={startSlider}
        >
            {/* মেইন কন্টেইনার - Responsive Height for all devices */}
            {/* Mobile: 200px, Tablet: 400px, Laptop: 550px, 4K/Big Screen: 700px */}
            <div 
                className='w-full h-[200px] xs:h-[250px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] rounded-xl sm:rounded-2xl relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300'
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* ইমেজ স্ট্যাকিং (Crossfade Effect) */}
                {banners.map((banner, index) => (
                    <div
                        key={banner._id || index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                         <Link href={banner.navigationlink || "#"} className="w-full h-full block">
                            <div 
                                style={{ backgroundImage: `url(${banner.image})` }} 
                                className='w-full h-full bg-center bg-cover transform transition-transform duration-[5000ms] hover:scale-105'
                            >
                                {/* Dark Gradient Overlay for better text visibility if needed */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                        </Link>
                    </div>
                ))}

                {/* নেভিগেশন বাটন (শুধুমাত্র ডেস্কটপে বা হোভারে দেখাবে) */}
                <div className='hidden md:group-hover:block absolute top-[50%] -translate-y-1/2 left-4 z-20'>
                    <button 
                        onClick={(e) => { e.preventDefault(); prevSlide(); }} 
                        className='bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/90 hover:text-purple-600 p-3 rounded-full transition-all duration-300 shadow-lg'
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                <div className='hidden md:group-hover:block absolute top-[50%] -translate-y-1/2 right-4 z-20'>
                    <button 
                        onClick={(e) => { e.preventDefault(); nextSlide(); }} 
                        className='bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/90 hover:text-purple-600 p-3 rounded-full transition-all duration-300 shadow-lg'
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* ইন্ডিকেটর ডট (Dots) */}
                <div className='absolute bottom-4 left-0 right-0 flex justify-center py-2 gap-2 z-20'>
                    {banners.map((_, slideIndex) => (
                        <button
                            key={slideIndex}
                            onClick={(e) => { e.preventDefault(); goToSlide(slideIndex); }}
                            className={`transition-all duration-300 rounded-full shadow-sm ${
                                currentIndex === slideIndex 
                                ? "bg-purple-600 w-8 h-2.5"  // Damask Purple Theme
                                : "bg-white/60 w-2.5 h-2.5 hover:bg-white"
                            }`}
                            aria-label={`Go to slide ${slideIndex + 1}`}
                        ></button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default UserHomebanner