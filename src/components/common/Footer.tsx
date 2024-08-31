'use client'

import { RxPinTop } from "react-icons/rx";
import React from 'react';

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div>
            <button
                type="button"
                aria-label={"Scroll to top"}
                onClick={scrollToTop}
                className="fixed bottom-5 right-7 shadow-2xl border border-gray-400 bg-white text-gray-400 p-2 rounded-full hover:bg-gray-100"
            >
                <RxPinTop size={30} />
            </button>
            <p className="bg-gray-700 text-white py-2 text-sm text-center">{"You can look back but don't regret it | All Right Reserved by Giyoun"}</p>
        </div>
    );
}
