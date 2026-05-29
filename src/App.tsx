import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Activity, 
  Calendar, 
  User, 
  Trophy, 
  LayoutDashboard, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';
import { BadmintonCanvas } from './components/BadmintonCanvas';

gsap.registerPlugin(ScrollTrigger);

// 1. Shared scrollState object (read by R3F frame loop without state re-renders)
const scrollState = {
  progress: 0.0,
  cameraX: 0.0, // Centered camera
  cameraY: 0.4,
  cameraZ: 4.2,
  lookAtX: 0.0,  // Centered focus
  lookAtY: 0.0,
  lookAtZ: 0.0
};

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  // Timeline names and sections metadata
  const sectionsData = [
    { label: 'Hero', tag: 'Connected Digital Ecosystem', icon: <Globe size={18} /> },
    { label: 'Booking', tag: 'Real-Time Court Status', icon: <Calendar size={18} /> },
    { label: 'Journey', tag: 'Player Passport', icon: <User size={18} /> },
    { label: 'Rankings', tag: 'Dynamic Ladders', icon: <Trophy size={18} /> },
    { label: 'Admin', tag: 'Operational Dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Ecosystem', tag: 'Ecosystem Map', icon: <Activity size={18} /> },
  ];

  useEffect(() => {
    // 2. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      touchMultiplier: 1.5,
      infinite: false,
    });
    lenisRef.current = lenis;

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Run GSAP ticker loop for Lenis updates
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Set initial transparent/hidden states for Hero content card elements
    gsap.set('#section-0 .content-wrapper', {
      background: 'rgba(4, 4, 8, 0)',
      borderColor: 'rgba(255, 255, 255, 0)',
      boxShadow: 'none',
      backdropFilter: 'blur(0px)'
    });
    gsap.set('#section-0 .description', {
      opacity: 0,
      y: 20
    });

    // 3. GSAP Timeline linking Scroll position to 3D State
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      }
    });

    // Morph Transitions mapping:
    tl.to(scrollState, {
      progress: 1.0, // Assembles Scattered Dust -> Shuttlecock (Hero)
      cameraX: 0.0,
      cameraY: 0.4,
      cameraZ: 4.2,
      lookAtX: 0.0,
      lookAtY: 0.0,
      lookAtZ: 0.0,
      duration: 0.3, // Fast assembly at scroll start
      ease: 'power1.out'
    })
    // Simultaneously animate Hero card glass and description fade-in
    .to('#section-0 .content-wrapper', {
      background: 'rgba(4, 4, 8, 0.58)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      duration: 0.3,
      ease: 'power1.out'
    }, 0)
    .to('#section-0 .description', {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power1.out'
    }, 0)
    .to(scrollState, {
      progress: 2.0, // Shuttlecock -> Court Grid (Booking)
      cameraX: 0.0,
      cameraY: 4.2,
      cameraZ: 2.2,
      lookAtX: 0.0,
      lookAtY: -0.8,
      lookAtZ: 0.0,
      duration: 0.7, // Remainder of the first section height (0.3 + 0.7 = 1.0)
      ease: 'power1.inOut'
    })
    .to(scrollState, {
      progress: 3.0, // Court Grid -> Player (Journey)
      cameraX: 0.0,
      cameraY: 0.8,
      cameraZ: 2.1,
      lookAtX: 0.0,
      lookAtY: 0.55,
      lookAtZ: -0.15,
      duration: 1.0, // Exactly 1 full section height transition
      ease: 'power1.inOut'
    })
    .to(scrollState, {
      progress: 4.0, // Player -> Rankings
      cameraX: 0.0,
      cameraY: -0.15,
      cameraZ: 2.1,
      lookAtX: 0.0,
      lookAtY: 0.15,
      lookAtZ: 0.0,
      duration: 1.0, // Exactly 1 full section height transition
      ease: 'power1.inOut'
    })
    .to(scrollState, {
      progress: 5.0, // Rankings -> Admin
      cameraX: 0.0,
      cameraY: 0.35,
      cameraZ: 2.6,
      lookAtX: 0.0,
      lookAtY: 0.0,
      lookAtZ: 0.0,
      duration: 1.0, // Exactly 1 full section height transition
      ease: 'power1.inOut'
    })
    .to(scrollState, {
      progress: 6.0, // Admin -> Ecosystem
      cameraX: 0.0,
      cameraY: 0.0,
      cameraZ: 4.8,
      lookAtX: 0.0,
      lookAtY: 0.0,
      lookAtZ: 0.0,
      duration: 1.0, // Exactly 1 full section height transition
      ease: 'power1.inOut'
    });

    // 4. GSAP Section Triggers to toggle active states & slide-ins
    const sections = document.querySelectorAll('.section');
    sections.forEach((sec, idx) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: () => {
          sec.querySelector('.content-wrapper')?.classList.add('active');
          setActiveSection(idx);
        },
        onLeave: () => {
          if (idx !== sections.length - 1) {
            sec.querySelector('.content-wrapper')?.classList.remove('active');
          }
        },
        onEnterBack: () => {
          sec.querySelector('.content-wrapper')?.classList.add('active');
          setActiveSection(idx);
        },
        onLeaveBack: () => {
          if (idx !== 0) {
            sec.querySelector('.content-wrapper')?.classList.remove('active');
          }
        }
      });
    });

    // Force active state on first section initially
    document.querySelector('#section-0 .content-wrapper')?.classList.add('active');

    return () => {
      lenis.destroy();
      gsap.ticker.remove(ScrollTrigger.update);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Smooth scroll handler
  const scrollToSection = (index: number) => {
    const target = document.getElementById(`section-${index}`);
    if (target && lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        duration: 1.5,
        immediate: false
      });
    }
  };

  return (
    <>
      {/* 3D WebGL Canvas Layer */}
      <BadmintonCanvas scrollState={scrollState} />

      {/* Navigation Header */}
      <nav className="nav-bar">
        <div className="logo" onClick={() => scrollToSection(0)} style={{ cursor: 'pointer' }}>
          <svg className="logo-svg" viewBox="0 0 929.64 830.65" xmlns="http://www.w3.org/2000/svg">
            <path d="M572.97,650l-18.77,36.26-22.03,42.52-46.16,89.04c-8.83,17.09-33.26,17.11-42.13.03l-46.42-89.07-22.03-42.52v-.02s-18.77-36.21-18.77-36.21c-4.49-8.66-1.13-19.32,7.51-23.84l79.67-41.67c13.24-6.93,29.04-6.92,42.27.03l22.52,11.82,56.83,29.82c8.62,4.53,11.97,15.17,7.5,23.82Z"/>
            <polygon points="837.5 0 929.64 0 578.76 555.66 578.76 600.25 483.3 553.07 483.3 553.07 837.5 0 837.5 0"/>
            <polygon points="92.14 0 0 0 350.88 555.66 350.88 600.25 446.34 553.07 446.34 553.07 92.14 0 92.14 0"/>
            <polygon points="464.82 384.02 132.2 0 463.17 516.8 464.82 519.17 466.47 516.8 797.43 0 464.82 384.02 464.82 384.02"/>
          </svg>
          <span>RANKET</span>
        </div>
        <div className="nav-links">
          {sectionsData.slice(1).map((sec, idx) => (
            <a 
              key={idx} 
              className={`nav-link ${activeSection === idx + 1 ? 'active' : ''}`}
              onClick={() => scrollToSection(idx + 1)}
            >
              {sec.label}
            </a>
          ))}
        </div>
        <button className="nav-cta" onClick={() => scrollToSection(5)}>
          Ecosystem
        </button>
      </nav>

      {/* Right Side Timeline Navigation Dots */}
      <div className="timeline-nav">
        {sectionsData.map((sec, idx) => (
          <div 
            key={idx} 
            className={`timeline-dot-wrapper ${activeSection === idx ? 'active' : ''}`}
            onClick={() => scrollToSection(idx)}
          >
            <span className="timeline-label">{sec.label}</span>
            <div className="timeline-dot" />
          </div>
        ))}
      </div>

      {/* HTML Content Overlay Layer */}
      <div ref={containerRef} className="scroll-container">
        
        {/* SECTION 1: Hero */}
        <section id="section-0" className="section align-left">
          <div className="content-wrapper">
            <span className="tag">Badminton Reimagined</span>
            <h1 className="title">A Connected Digital Ecosystem</h1>
            <p className="description">
              Step into the future of racket sports. We bridge physical venues, players, live occupancy grids, and global rankings into a single, unified cinematic experience.
            </p>
          </div>
          <div className="scroll-indicator">
            <span className="scroll-text">Scroll to explore</span>
            <div className="scroll-mouse">
              <div className="scroll-wheel" />
            </div>
          </div>
        </section>

        {/* SECTION 2: Booking & Court Status */}
        <section id="section-1" className="section align-left">
          <div className="content-wrapper">
            <span className="tag">Live Grid Occupancy</span>
            <h2 className="title" style={{ fontSize: '2.8rem' }}>Synchronized Court Booking</h2>
            <p className="description">
              From scheduling to live session status, every court becomes visible and manageable in real-time. Optimize venue capacities without assumptions.
            </p>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Apex Arena — Court Grid</span>
                <span style={{ fontSize: '0.75rem', color: '#00ffaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffaa' }} /> Live
                </span>
              </div>
              <div className="court-status-hud">
                <div className="court-hud-item active">
                  <div className="court-label">Court 01</div>
                  <div className="court-value active">Active</div>
                </div>
                <div className="court-hud-item reserved">
                  <div className="court-label">Court 02</div>
                  <div className="court-value reserved">Reserved</div>
                </div>
                <div className="court-hud-item">
                  <div className="court-label">Court 03</div>
                  <div className="court-value available">Available</div>
                </div>
                <div className="court-hud-item active">
                  <div className="court-label">Court 04</div>
                  <div className="court-value active">Active</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Player Journey */}
        <section id="section-2" className="section align-right">
          <div className="content-wrapper">
            <span className="tag">Unified Player Profile</span>
            <h2 className="title" style={{ fontSize: '2.8rem' }}>A Player’s Cross-Venue Identity</h2>
            <p className="description">
              Every smash, every venue, and every session becomes part of your player passport. You are not owned by any single club; your progress travels with you.
            </p>
            <div className="glass-card">
              <div className="player-profile-hud">
                <div className="player-avatar-placeholder">ZR</div>
                <div className="player-details">
                  <div className="player-name">Zack Richardson</div>
                  <div className="player-level">Premium Elite Pass</div>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#00f3ff', display: 'flex', alignItems: 'center' }}>
                  Active <ArrowUpRight size={14} style={{ marginLeft: 2 }} />
                </span>
              </div>
              <div className="player-stats-row">
                <div className="stat-box">
                  <div className="stat-num">28</div>
                  <div className="stat-label">Venues Visited</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">412</div>
                  <div className="stat-label">Matches Logged</div>
                </div>
                <div className="stat-box">
                  <div className="stat-num">386 km/h</div>
                  <div className="stat-label">Smash Speed</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Ranking System */}
        <section id="section-3" className="section align-left">
          <div className="content-wrapper">
            <span className="tag">Global Leaderboard</span>
            <h2 className="title" style={{ fontSize: '2.8rem' }}>Measurable Player Progress</h2>
            <p className="description">
              Turn ordinary social games into structured progress. Earn competitive ranking index scores that scale from club matches to regional, national, and global ladders.
            </p>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>National Singles Ranking</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Updated Hourly</span>
              </div>
              <div className="ranking-list">
                <div className="ranking-item">
                  <span className="rank-num gold">01</span>
                  <span className="rank-name">Marcus Chen</span>
                  <span className="rank-points">4,912 pts</span>
                  <span className="rank-change up">+1</span>
                </div>
                <div className="ranking-item">
                  <span className="rank-num silver">02</span>
                  <span className="rank-name">Sarah Jenkins</span>
                  <span className="rank-points">4,850 pts</span>
                  <span className="rank-change down">-1</span>
                </div>
                <div className="ranking-item">
                  <span className="rank-num bronze">03</span>
                  <span className="rank-name">David Kim</span>
                  <span className="rank-points">4,640 pts</span>
                  <span className="rank-change">--</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Venue Admin */}
        <section id="section-4" className="section align-right">
          <div className="content-wrapper">
            <span className="tag">Venue Operations</span>
            <h2 className="title" style={{ fontSize: '2.8rem' }}>Built From Live Experience</h2>
            <p className="description">
              Engineered alongside real venue managers, not assumptions. Orchestrate check-ins, staff rosters, membership tiers, operations logs, and sales summaries inside a sleek command panel.
            </p>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Command Panel Metric</span>
                <span className="eco-badge">Active Session</span>
              </div>
              <div className="admin-hud">
                <div className="admin-metric">
                  <span className="court-label">Capacity</span>
                  <div className="admin-metric-val">94.2%</div>
                </div>
                <div className="admin-metric">
                  <span className="court-label">Daily Sales</span>
                  <div className="admin-metric-val">$2,410</div>
                </div>
                <div className="admin-metric">
                  <span className="court-label">Rosters</span>
                  <div className="admin-metric-val">5 Active</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Ecosystem */}
        <section id="section-5" className="section align-left">
          <div className="content-wrapper">
            <span className="tag">The Connected Future</span>
            <h2 className="title">Not Just Booking. An Ecosystem.</h2>
            <p className="description">
              A unified badminton ecosystem that coordinates players, venues, tournament directors, leagues, and brand campaigns. Join a network that breathes energy into court sports worldwide.
            </p>
            <div className="glass-card">
              <div style={{ fontWeight: 600, marginBottom: '0.8rem' }}>Ecosystem Scope Statistics</div>
              <div className="eco-badge-container">
                <span className="eco-badge">140+ Court Venues</span>
                <span className="eco-badge gold">30,000+ Active Players</span>
                <span className="eco-badge">120+ Tournaments Arranged</span>
                <span className="eco-badge accent">Global Ranking Index</span>
                <span className="eco-badge gold">Unified Reward System</span>
              </div>
            </div>
            <button 
              className="nav-cta" 
              onClick={() => scrollToSection(0)} 
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem', marginTop: '1.5rem' }}
            >
              Replay Journey
            </button>
          </div>
        </section>
        
      </div>
    </>
  );
};
