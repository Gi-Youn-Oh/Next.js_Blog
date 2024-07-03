'use client'

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { SiNaver, SiKakao } from 'react-icons/si'; // Naver, Kakao 아이콘

export default function SignPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  return (
    <div className="flex items-center h-full justify-center bg-gray-100 " >
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Sign in to your account</h2>
        <div className="space-y-4">
          <button
            onClick={() => signIn('google',{callbackUrl})}
            className="flex items-center justify-center w-full p-3 text-black bg-white border border-gray-300 rounded hover:bg-gray-100"
          >
            <FaGoogle className="mr-2" />
            Sign in with Google
          </button>
          <button
            onClick={() => signIn('github',{callbackUrl})}
            className="flex items-center justify-center w-full p-3 text-white bg-black border border-black rounded hover:bg-gray-800"
          >
            <FaGithub className="mr-2" />
            Sign in with GitHub
          </button>
          <button
            onClick={() => signIn('naver',{callbackUrl})}
            className="flex items-center justify-center w-full p-3 text-white bg-green-500 border border-green-500 rounded hover:bg-green-600"
          >
            <SiNaver className="mr-2" />
            Sign in with Naver
          </button>
          <button
            onClick={() => signIn('kakao',{callbackUrl})}
            className="flex items-center justify-center w-full p-3 text-black bg-yellow-400 border border-yellow-400 rounded hover:bg-yellow-500"
          >
            <SiKakao className="mr-2" />
            Sign in with Kakao
          </button>
        </div>
      </div>
    </div>
  );
}
