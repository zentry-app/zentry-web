"use client";

import { IconSearch, IconArrowRight } from '@/components/icons';
import styles from './search.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SearchPage() {
  // Estado para controlar si el navbar ha hecho scroll
  const [isScrolled, setIsScrolled] = useState(false);

  // Efecto para detectar el scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Obtener la hora actual para la visualización del teléfono
  const getCurrentTime = () => {
    const now = new Date();
    return now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
  };

  return (
    <div className={styles.container}>
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            <Link href="/">
              <Image 
                src="/images/logo.png" 
                alt="Arc Logo" 
                width={40} 
                height={40} 
                className={styles.logo} 
              />
            </Link>
            <nav className={styles.mainNav}>
              <Link href="#" className={styles.navLink}>Max</Link>
              <Link href="#" className={styles.navLink}>Mobile</Link>
              <Link href="#" className={styles.navLink}>Developers</Link>
              <Link href="#" className={styles.navLink}>Students</Link>
              <Link href="#" className={styles.navLink}>Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className={styles.downloadBadgeQR}>
        <div className={styles.qrWrapper}>
          <span className={styles.downloadText}>DOWNLOAD</span>
          <div className={styles.qrImage}>
            <Image 
              src="/images/qr-code.png" 
              alt="QR Code" 
              width={80} 
              height={80} 
            />
          </div>
        </div>
      </div>

      <main className={styles.main}>
        <section className={styles.heroSection}>
          <h1 className={styles.mainTitle}>
            Fastest way to search.<br/>Cleanest way to browse.
          </h1>

          <div className={styles.storeButtons}>
            <div className={styles.buttonWrapper}>
              <button className={styles.storeButton}>
                <Image 
                  src="/images/apple-logo.png" 
                  alt="Apple" 
                  width={20} 
                  height={20} 
                />
                Apple App Store
                <span className={styles.arrow}>
                  <IconArrowRight />
                </span>
              </button>
            </div>
            <div className={styles.buttonWrapper}>
              <button className={styles.storeButton}>
                <Image 
                  src="/images/google-play.png" 
                  alt="Google Play" 
                  width={20} 
                  height={20} 
                />
                Google Play
                <span className={styles.arrow}>
                  <IconArrowRight />
                </span>
              </button>
            </div>
          </div>

          <div className={styles.phoneDisplay}>
            <div className={styles.phoneWrapper}>
              <div className={styles.phoneFrame}>
                <div className={styles.phoneHeader}>
                  <div className={styles.phoneTime}>{getCurrentTime()}</div>
                  <div className={styles.phoneStatusIcons}>
                    <div className={styles.signalIcon}></div>
                    <div className={styles.wifiIcon}></div>
                    <div className={styles.batteryIcon}></div>
                  </div>
                </div>
                <div className={styles.phoneContent}>
                  <div className={styles.searchBar}>
                    <div className={styles.searchIcon}>
                      <IconSearch />
                    </div>
                    <div className={styles.searchText}>h</div>
                  </div>
                  <div className={styles.searchResults}>
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🏠</div>
                      <div className={styles.resultContent}>
                        <h3 className={styles.resultTitle}>House Prices</h3>
                        <p className={styles.resultText}>
                          Check current house prices in your area with our real-time data...
                        </p>
                      </div>
                    </div>
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🔬</div>
                      <div className={styles.resultContent}>
                        <h3 className={styles.resultTitle}>How do black holes work?</h3>
                        <p className={styles.resultText}>
                          Black holes are regions of spacetime where gravity is so strong that...
                        </p>
                      </div>
                    </div>
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🎵</div>
                      <div className={styles.resultContent}>
                        <h3 className={styles.resultTitle}>Harry Styles - Watermelon Sugar</h3>
                        <p className={styles.resultText}>
                          Listen to Watermelon Sugar by Harry Styles on all major platforms...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.phoneSearchBar}>
                  <div className={styles.searchIcon}>
                    <IconSearch />
                  </div>
                  <div className={styles.phoneSearchText}>h</div>
                  <div className={styles.phoneKeyboardBar}></div>
                </div>
              </div>
              <div className={styles.phonePauseButton}>II</div>
            </div>
          </div>
        </section>

        {/* Resto de secciones se implementarán después */}
      </main>
    </div>
  );
} 