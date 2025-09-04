import { useState, useEffect } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
      const isMobileDevice = mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768
      setIsMobile(isMobileDevice)
    }

    const checkCamera = async () => {
      try {
        if (navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
          // Verificar si hay cámaras disponibles
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter(device => device.kind === 'videoinput')
          setHasCamera(videoDevices.length > 0)
        } else {
          setHasCamera(false)
        }
      } catch (error) {
        console.log('Error checking camera availability:', error)
        setHasCamera(false)
      }
    }

    checkMobile()
    checkCamera()

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return { isMobile, hasCamera }
}
