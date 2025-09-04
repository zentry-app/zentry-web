import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './search.module.css';

export default function SearchPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            <Image 
              src="/search/arc-logo.svg" 
              alt="Arc Logo" 
              width={40} 
              height={40}
              className={styles.logo}
            />
            <nav className={styles.mainNav}>
              <a href="#" className={styles.navLink}>Max</a>
              <a href="#" className={styles.navLink}>Mobile</a>
              <a href="#" className={styles.navLink}>Developers</a>
              <a href="#" className={styles.navLink}>Students</a>
              <a href="#" className={styles.navLink}>Blog</a>
            </nav>
          </div>
        </div>
      </header>
      
      <div className={styles.downloadBadgeQR}>
        <div className={styles.qrWrapper}>
          <p className={styles.downloadText}>DOWNLOAD</p>
          <Image 
            src="/search/qr-code.png" 
            alt="QR Code para descargar Arc Search" 
            width={120} 
            height={120}
            className={styles.qrImage}
          />
        </div>
      </div>
      
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>
            Fastest way to search.<br/>
            Cleanest way to browse.
          </h1>
          
          <div className={styles.storeButtons}>
            <div className={styles.buttonWrapper}>
              <Link href="https://apps.apple.com/app/apple-store/id6472513080">
                <button className={styles.storeButton}>
                  <svg id="appleLogo" viewBox="0 10 170 170" width="16" height="16">
                    <path d="m150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929 0.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002 0.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-0.9 2.61-1.85 5.11-2.86 7.51zm-31.26-123.01c0 8.1021-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375-0.119-0.972-0.188-1.995-0.188-3.07 0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.3113 11.45-8.597 4.62-2.2516 8.99-3.4968 13.1-3.71 0.12 1.0831 0.17 2.1663 0.17 3.2409z" fill="currentColor"></path>
                  </svg>
                  Apple App Store<span className={styles.arrow}>→</span>
                </button>
              </Link>
            </div>
            
            <div className={styles.buttonWrapper}>
              <Link href="https://play.google.com/store/apps/details?id=company.thebrowser.arc">
                <button className={styles.storeButton}>
                  <svg fill="currentColor" width="16" height="16" viewBox="0 0 16 16">
                    <path d="m8.415 8.5-6.3-6.115A1.146 1.146 0 0 0 2 2.912V14.09c0 .214.044.392.119.534L8.415 8.5ZM8.78 8.146l1.94-1.887-7.398-4.087A1.213 1.213 0 0 0 2.738 2a.723.723 0 0 0-.247.043l6.288 6.103ZM13.456 7.771l-2.268-1.253-2.04 1.985 2.04 1.98 2.268-1.254c.726-.4.726-1.057 0-1.458ZM8.784 8.858l-6.275 6.105c.224.074.505.039.813-.13l7.402-4.093-1.94-1.882Z"></path>
                  </svg>
                  Google Play<span className={styles.arrow}>→</span>
                </button>
              </Link>
            </div>
          </div>
          
          <div className={styles.phoneDisplay}>
            <div className={styles.phoneWrapper}>
              <div className={styles.phoneFrame}>
                <div className={styles.phoneHeader}>
                  <div className={styles.phoneTime}>9:41</div>
                  <div className={styles.phoneStatusIcons}>
                    <div className={styles.signalIcon}></div>
                    <div className={styles.wifiIcon}></div>
                    <div className={styles.batteryIcon}></div>
                  </div>
                </div>
                <div className={styles.phoneContent}>
                  <div className={styles.searchBar}>
                    <div className={styles.searchIcon}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.25 12.5C10.1495 12.5 12.5 10.1495 12.5 7.25C12.5 4.35051 10.1495 2 7.25 2C4.35051 2 2 4.35051 2 7.25C2 10.1495 4.35051 12.5 7.25 12.5Z" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10.9624 10.9624L13.9999 13.9999" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className={styles.searchText}>affordable omakase near me</div>
                  </div>
                  
                  <div className={styles.searchResults}>
                    <div className={styles.searchResult}>
                      <p className={styles.resultText}>
                        Heights, offers 15 pieces of nigiri, a couple of appetizers, and unlimited sake for $99.
                      </p>
                    </div>
                    
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🍣</div>
                      <div className={styles.resultContent}>
                        <p className={styles.resultTitle}>Sushi Katsuei</p>
                        <p className={styles.resultText}>
                          — In the West Village, offers omakase starting at $65 for nine pieces and a hand roll, with unique pieces like firefly squid or barracuda.
                        </p>
                      </div>
                    </div>
                    
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🏮</div>
                      <div className={styles.resultContent}>
                        <p className={styles.resultTitle}>Sushi Lin</p>
                        <p className={styles.resultText}>
                          — In Prospect Heights, offers a $35 mini omakase or a $70 option with 10 pieces of nigiri and a hand roll.
                        </p>
                      </div>
                    </div>
                    
                    <div className={styles.searchResult}>
                      <div className={styles.resultIcon}>🥢</div>
                      <div className={styles.resultContent}>
                        <p className={styles.resultTitle}>Sushi 456</p>
                        <p className={styles.resultText}>
                          — In the West Village, offers 10 nigiri and one hand roll for $70, or 15 nigiri and a hand roll for $100.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.phoneSearchBar}>
                    <div className={styles.phoneSearchText}>a</div>
                    <div className={styles.phoneKeyboardBar}></div>
                  </div>
                </div>
                
                <div className={styles.phonePauseButton}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="white"/>
                    <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.appSection}>
          <div className={styles.appIcon}>
            <h2 className={styles.appTitle}>
              <span className={styles.arcSearch}>Arc Search</span>
              <Image 
                src="/search/arc-logo.svg" 
                alt="Arc Icon" 
                width={50} 
                height={50} 
                className={styles.iconImageInline}
              />
              <span>is a mobile browser for</span> <span><i>you</i></span>
            </h2>
            
            <div className={styles.browseForMeSection}>
              <div className={styles.browseForMeContainer}>
                <div className={styles.browseFeature}>
                  <div className={styles.browseFeatureContent}>
                    <div className={styles.browseFeatureText}>
                      Generate the perfect answer to any question with <strong>Browse for Me.</strong>
                    </div>
                    <div className={styles.browseFeatureVideo}>
                      <div className={styles.videoContainer}>
                        <div className={styles.videoOverlay}></div>
                        <div className={styles.videoWrapper}>
                          <div className={styles.phoneWrapper}>
                            <div className={styles.phoneFrame}>
                              <div className={styles.phoneHeader}>
                                <div className={styles.phoneTime}>9:41</div>
                                <div className={styles.phoneStatusIcons}>
                                  <div className={styles.signalIcon}></div>
                                  <div className={styles.wifiIcon}></div>
                                  <div className={styles.batteryIcon}></div>
                                </div>
                              </div>
                              <div className={styles.phoneContent}>
                                <div className={styles.searchBar}>
                                  <div className={styles.searchIcon}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M7.25 12.5C10.1495 12.5 12.5 10.1495 12.5 7.25C12.5 4.35051 10.1495 2 7.25 2C4.35051 2 2 4.35051 2 7.25C2 10.1495 4.35051 12.5 7.25 12.5Z" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M10.9624 10.9624L13.9999 13.9999" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <div className={styles.searchText}>what is deja vu</div>
                                </div>
                                
                                <div className={styles.b4mContainer}>
                                  <div className={styles.b4mStats}>
                                    <div className={styles.b4mCount}>Read 10 web pages</div>
                                    <div className={styles.b4mSources}>
                                      <div className={styles.b4mSourceIcon}>W</div>
                                      <div className={styles.b4mSourceIcon}>G</div>
                                      <div className={styles.b4mSourceIcon}>H</div>
                                    </div>
                                  </div>
                                  
                                  <div className={styles.b4mTopic}>
                                    <h3 className={styles.b4mTitle}>Understanding Déjà Vu</h3>
                                    
                                    <div className={styles.b4mDefinition}>
                                      <div className={styles.b4mIcon}>📝</div>
                                      <div className={styles.b4mContent}>
                                        <p className={styles.b4mHeading}>Definition</p>
                                        <p className={styles.b4mText}>— Déjà vu is the sensation that you have already experienced a current situation, even though you know you haven't.</p>
                                      </div>
                                    </div>
                                    
                                    <div className={styles.b4mDefinition}>
                                      <div className={styles.b4mIcon}>🧠</div>
                                      <div className={styles.b4mContent}>
                                        <p className={styles.b4mHeading}>Brain Function</p>
                                        <p className={styles.b4mText}>— It is thought to occur due to a miscommunication between parts of the brain responsible for memory and familiarity.</p>
                                      </div>
                                    </div>
                                    
                                    <div className={styles.b4mDefinition}>
                                      <div className={styles.b4mIcon}>📊</div>
                                      <div className={styles.b4mContent}>
                                        <p className={styles.b4mHeading}>Prevalence</p>
                                        <p className={styles.b4mText}>— Approximately 60-70% of people experience déjà vu at least once...</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={styles.browseFeatureTabs}>
                      <div className={`${styles.browseFeatureTab} ${styles.active}`}>INSTANT ANSWERS</div>
                      <div className={styles.browseFeatureTab}>RECOMMENDATIONS</div>
                      <div className={styles.browseFeatureTab}>COMPARISONS</div>
                      <div className={styles.browseFeatureTab}>STEP-BY-STEP</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.noiseSection}>
          <h2 className={styles.sectionTitle}>
            <span>Get what you want,</span> <span>without the noise.</span>
          </h2>
          
          <div className={styles.adBlockerDemo}>
            <div className={styles.adBlockerContent}>
              <div className={styles.adBlockerText}>
                <p className={styles.featureText}>
                  Our <strong>built-in ad blocker</strong> blocks ads, trackers, pop-ups, and cookie banners.
                </p>
                <div className={styles.browserTabs}>
                  <div className={styles.browserTab}>Other Browsers</div>
                  <div className={`${styles.browserTab} ${styles.active}`}>Arc Search</div>
                </div>
                <div className={styles.comparisonContainer}>
                  <div className={styles.sliderControl}>
                    <div className={styles.sliderHandle}></div>
                  </div>
                  <div className={styles.imageOverlay}>
                    <div className={styles.afterImage}>
                      <Image 
                        src="/search/after.png"
                        alt="después de aplicar bloqueador de anuncios de Arc"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                    <div className={styles.beforeImage}>
                      <Image 
                        src="/search/before.png"
                        alt="antes de aplicar bloqueador de anuncios de Arc"
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.privacyInfo}>
                  <div className={styles.lockIcon}>
                    <svg width="14" height="17" viewBox="0 0 12 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 16.5601C1.40625 16.5601 0.955729 16.3986 0.648438 16.0757C0.341146 15.758 0.1875 15.2788 0.1875 14.6382V9.09912C0.1875 8.4637 0.341146 7.98714 0.648438 7.66943C0.955729 7.35173 1.40625 7.19287 2 7.19287H9.3125C9.90625 7.19287 10.3568 7.35173 10.6641 7.66943C10.9714 7.98714 11.125 8.4637 11.125 9.09912V14.6382C11.125 15.2788 10.9714 15.758 10.6641 16.0757C10.3568 16.3986 9.90625 16.5601 9.3125 16.5601H2ZM1.61719 7.84912V5.36475C1.61719 4.4012 1.80469 3.59652 2.17969 2.95068C2.5599 2.29964 3.05729 1.81006 3.67188 1.48193C4.28646 1.15381 4.94792 0.989746 5.65625 0.989746C6.36458 0.989746 7.02604 1.15381 7.64062 1.48193C8.25521 1.81006 8.75 2.29964 9.125 2.95068C9.50521 3.59652 9.69531 4.4012 9.69531 5.36475V7.84912H8.23438V5.21631C8.23438 4.60693 8.11458 4.09391 7.875 3.67725C7.64062 3.25537 7.32812 2.93506 6.9375 2.71631C6.54688 2.49756 6.11979 2.38818 5.65625 2.38818C5.19271 2.38818 4.76562 2.49756 4.375 2.71631C3.98438 2.93506 3.67188 3.25537 3.4375 3.67725C3.20312 4.09391 3.08594 4.60693 3.08594 5.21631V7.84912H1.61719Z" fill="#0E0F10"></path>
                    </svg>
                  </div>
                  <p className={styles.privacyText}>
                    Arc Search protects your data.
                  </p>
                  <div className={styles.trackerInfo}>
                    <p className={styles.trackerText}>
                      google.com contains 17 trackers watching your every move. We block every single one of them.
                    </p>
                    <p className={styles.privacyLink}>
                      <a href="https://arc.net/privacy">learn about our privacy policy →</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.featureSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>A lighter browsing experience</h2>
          </div>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureContent}>
                <p className={styles.featureText}>
                  <strong>Auto-archives</strong> old tabs.<br/>No more virtual dust bunnies.
                </p>
                <div className={styles.featureImage}>
                  <div className={styles.featureIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 8H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V8Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 8V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12L15 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className={styles.featureImageContent}>
                    <p>Archived after 1 day</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureContent}>
                <p className={styles.featureText}>
                  <strong>Sync your passwords</strong> across iCloud keychain<br/>or your preferred password extension.
                </p>
                <div className={styles.featureImage}>
                  <div className={styles.featureIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19 10H21V14H19M5 10H3V14H5M7 6H17V16C17 17.1046 16.1046 18 15 18H9C7.89543 18 7 17.1046 7 16V6Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.featureImageContent}>
                    <p>•••••••••••••</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureContent}>
                <p className={styles.featureText}>
                  A clean and crisp <strong>reader mode</strong><br/>for every article.
                </p>
                <div className={styles.featureImage}>
                  <div className={styles.featureIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 7H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M6 17H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className={styles.featureImageContent}>
                    <p>Reader mode <strong>On</strong></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureContent}>
                <p className={styles.featureText}>
                  Go completely undercover<br/>with <strong>incognito mode.</strong>
                </p>
                <div className={styles.featureImage}>
                  <div className={styles.featureIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 18.5C17.5 14.9101 15.0899 12 12 12C8.91015 12 6.5 14.9101 6.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className={styles.featureImageContent}>
                    <p>Incognito mode</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureContent}>
                <p className={styles.featureText}>
                  Break language barriers with<br/><strong>translations on any page.</strong>
                </p>
                <div className={styles.featureImage}>
                  <div className={styles.featureIcon}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 5H8M16 5H22M12 5H10M10 5C10 9.66667 7 14.3333 2 19M14 5C14 9.66667 17 14.3333 22 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 15L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.featureImageContent}>
                    <p>Translation <strong>On</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.answersSection}>
          <h2 className={styles.sectionTitle}>
            <span>With answers that meet you where you're at</span>
          </h2>
          
          <div className={styles.answersGrid}>
            <div className={styles.answerCard}>
              <div className={styles.answerContent}>
                <p className={styles.answerText}>
                  Get the gist <strong>in a pinch</strong> — literally.
                </p>
                <div className={styles.answerImage}>
                  <Image 
                    src="/search/features/pinch-to-browse.webp" 
                    alt="Pinch to browse"
                    width={300}
                    height={250}
                    className={styles.answerImageContent}
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.answerCard}>
              <div className={styles.answerContent}>
                <p className={styles.answerText}>
                  Search with your voice for lengthy questions on the go.
                </p>
                <div className={styles.answerImage}>
                  <Image 
                    src="/search/features/voice-search.webp" 
                    alt="Voice search"
                    width={300}
                    height={250}
                    className={styles.answerImageContent}
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.answerCard}>
              <div className={styles.answerContent}>
                <p className={styles.answerText}>
                  Lift your phone to your ear to have a conversation with the internet.
                </p>
                <div className={styles.answerImage}>
                  <Image 
                    src="/search/features/ear-search.webp" 
                    alt="Ear search"
                    width={300}
                    height={250}
                    className={styles.answerImageContent}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.syncSection}>
          <h2 className={styles.sectionTitle}>
            <span>Pick up where you left off, on any device</span>
          </h2>
          
          <div className={styles.syncContent}>
            <p className={styles.syncText}>
              Your Arc tabs sync instantly across Mac, Windows and iOS using <strong>Arc Sync.</strong>
            </p>
            <a href="https://arc.net/sync" className={styles.syncLink}>
              Learn more about Arc sync →
            </a>
            
            <div className={styles.syncImage}>
              <Image 
                src="/search/features/arc-sync.webp" 
                alt="Arc Sync between devices"
                width={800}
                height={400}
                className={styles.syncImageContent}
              />
            </div>
          </div>
        </div>
        
        <div className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>
            <span>Better is possible.</span>
            <span>Meet the internet again.</span>
          </h2>
          
          <div className={styles.ctaContent}>
            <div className={styles.qrCodeLarge}>
              <Image 
                src="/search/qr-code.png" 
                alt="QR Code to download Arc Search"
                width={200}
                height={200}
              />
              <p className={styles.qrText}>Scan this QR code with your phone to download Arc Search.</p>
            </div>
            
            <div className={styles.faq}>
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How do I install Arc Search?</h3>
                <p className={styles.faqAnswer}>
                  Download Arc Search from the App Store or Google Play. You can also scan the QR code on this page.
                </p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>What devices are supported?</h3>
                <p className={styles.faqAnswer}>
                  Arc Search is available for iOS and Android. For computers, download Arc for Mac or Windows.
                </p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How do I set Arc Search as my default mobile browser?</h3>
                <p className={styles.faqAnswer}>
                  On iOS, go to Settings → Arc Search → Default Browser. On Android, go to Settings → Apps → Default apps → Browser.
                </p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How do I sync across mobile and desktop?</h3>
                <p className={styles.faqAnswer}>
                  Use Arc Sync by signing in with the same account on all your devices. This will automatically sync your tabs and spaces.
                </p>
              </div>
              
              <div className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>How do I share feedback?</h3>
                <p className={styles.faqAnswer}>
                  You can share your feedback directly from the app: Menu → Help → Send Feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>Product</h3>
              <ul className={styles.footerLinks}>
                <li><a href="https://arc.net/download">Download</a></li>
                <li><a href="https://arc.net/privacy">Privacy Policy</a></li>
                <li><a href="https://arc.net/terms">Terms of Use</a></li>
                <li><a href="https://arc.net/security">Security</a></li>
                <li><a href="https://arc.net/max">Arc Max</a></li>
                <li><a href="https://arc.net/mobile">Arc for iPhone</a></li>
                <li><a href="https://arc.net/integrations">Integrations</a></li>
                <li><a href="https://arc.net/credits">Credits</a></li>
              </ul>
            </div>
            
            <div className={styles.footerSection}>
              <h3 className={styles.footerTitle}>Resources</h3>
              <ul className={styles.footerLinks}>
                <li><a href="https://arc.net/resource-center">Resource Center</a></li>
                <li><a href="https://arc.net/release-notes">Release Notes</a></li>
                <li><a href="https://arc.net/students">Students</a></li>
                <li><a href="https://arc.net/faq">FAQ</a></li>
                <li><a href="https://arc.net/careers">Careers @ Browser Company</a></li>
              </ul>
            </div>
          </div>
          
          <div className={styles.copyright}>
            <p>© 2024 Zentry. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
} 