'use client';
 
import { useEffect } from 'react';
 
export default function SettingPwa() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => console.log('서비스 워커 등록 완료'))
        .catch((err) => console.error('서비스 워커 등록 실패', err));
    }
  }, []);
 
  return <></>;
}