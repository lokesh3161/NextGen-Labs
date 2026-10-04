/**
 * NextGen Labs Portfolio Carousel Integration
 * Connects CircularCarousel to the NextGen portfolio ecosystem.
 */

const PORTFOLIO_DATA = {
  built: [
    {
      id: 'xbuddy',
      src: 'assets/portfolio/cards/xbuddy.png',
      alt: 'X Buddy',
      title: 'X Buddy',
      subtitle: 'BUILT • Upload • Pay • Print',
      category: 'Print Tech & Logistics',
      status: 'Live',
      tagline: 'Upload • Pay • Print',
      desc: 'Automated on-demand campus printing platform. Upload documents, pay securely online, and pick up without queuing.'
    },
    {
      id: 'ridemate',
      src: 'assets/portfolio/cards/ridemate.png',
      alt: 'RideMate',
      title: 'RideMate',
      subtitle: 'BUILT • Shared Campus Commuting',
      category: 'Mobility & Transit',
      status: 'Live',
      tagline: 'Shared Student Commuting',
      desc: 'Peer-to-peer campus ride sharing network uniting student commuters to cut daily travel costs and transit friction.'
    },
    {
      id: 'dumculture',
      src: 'assets/portfolio/cards/dumculture.png',
      alt: 'Dum Culture',
      title: 'Dum Culture',
      subtitle: 'BUILT • Biriyani, Unveiled',
      category: 'FoodTech & Culinary',
      status: 'Active',
      tagline: 'Authentic Heritage Culinary',
      desc: 'Specialty culinary brand blending traditional dum cooking heritage with cloud kitchen scalability and fast student delivery.'
    },
    {
      id: 'medhass',
      src: 'assets/portfolio/cards/medhass.png',
      alt: 'Medhass',
      title: 'Medhass',
      subtitle: 'BUILT • Academic Intelligence',
      category: 'EdTech & Campus Intel',
      status: 'Live',
      tagline: 'Academic Intelligence Ecosystem',
      desc: 'Intelligent student academic and access ecosystem unifying campus records, attendance intelligence, and learning workflows.'
    },
    {
      id: 'gesturesnap',
      src: 'assets/portfolio/cards/gesturesnap.png',
      alt: 'GestureSnap',
      title: 'GestureSnap',
      subtitle: 'BUILT • Touchless Vision Control',
      category: 'Computer Vision & HCI',
      status: 'Live',
      tagline: 'Touchless Vision Interface',
      desc: 'Touchless computer-vision interface software enabling intuitive hand-gesture control across digital displays and kiosks.'
    },
    {
      id: 'placementsuit',
      src: 'assets/portfolio/cards/placement-suite.png',
      alt: 'Placement Suit',
      title: 'Placement Suit',
      subtitle: 'BUILT • Career Readiness Suite',
      category: 'CareerTech & AI Prep',
      status: 'Live',
      tagline: 'Placement Readiness Platform',
      desc: 'End-to-end recruitment readiness platform featuring AI mock assessments, resume targeting, and placement training benchmarks.'
    }
  ],
  building: [
    {
      id: 'hololearn',
      src: 'assets/portfolio/cards/hololearn.png',
      alt: 'HoloLearn AI',
      title: 'HoloLearn AI',
      subtitle: 'BUILDING • Experience Knowledge',
      category: 'Spatial Computing & AI',
      status: 'In Alpha',
      tagline: 'Spatial Intelligence For Learning',
      desc: 'Immersive spatial computing learning suite converting technical engineering concepts into interactive holographic simulations.'
    },
    {
      id: 'redz',
      src: 'assets/portfolio/cards/redz.png',
      alt: 'Redz',
      title: 'Redz',
      subtitle: 'BUILDING • AI • Web • Systems',
      category: 'Youth Media & Systems',
      status: 'Prototyping',
      tagline: 'Youth Consumer Platform',
      desc: 'Next-generation youth consumer platform engineered to empower student creator networks, events, and campus culture.'
    },
    {
      id: 'shakthiai',
      src: 'assets/portfolio/cards/shakthi-ai.png',
      alt: 'Shakthi AI',
      title: 'Shakthi AI',
      subtitle: 'BUILDING • Autonomous Protection Engine',
      category: 'SafetyTech & AI Defense',
      status: 'In Active Dev',
      tagline: 'Autonomous Protection Engine',
      desc: 'Autonomous women-safety ecosystem combining intelligent threat triggers with instant emergency broadcast and responder routing.'
    }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('portfolioCarouselStage');
  const spotlightContainer = document.getElementById('portfolioSpotlight');
  const tabButtons = document.querySelectorAll('.portfolio-control-btn');
  const gridSection = document.getElementById('portfolioGridContainer');
  const viewToggleBtn = document.getElementById('portfolioViewToggle');

  if (!container || !window.CircularCarousel) return;

  let activeCategory = 'all';
  let carouselInstance = null;

  function getItemsForCategory(cat) {
    if (cat === 'built') return PORTFOLIO_DATA.built;
    if (cat === 'building') return PORTFOLIO_DATA.building;
    return [...PORTFOLIO_DATA.built, ...PORTFOLIO_DATA.building];
  }

  function updateSpotlight(item) {
    if (!spotlightContainer || !item) return;

    const isBuilding = item.status.toLowerCase().includes('alpha') || item.status.toLowerCase().includes('dev') || item.status.toLowerCase().includes('proto');
    const statusClass = isBuilding ? 'status-building' : 'status-live';

    spotlightContainer.innerHTML = `
      <div class="spotlight-inner">
        <div class="spotlight-left">
          <div class="spotlight-tag-row">
            <span class="spotlight-category">${item.category}</span>
            <span class="spotlight-status ${statusClass}">${item.status}</span>
          </div>
          <h3 class="spotlight-title">${item.title}</h3>
          <p class="spotlight-desc">${item.desc}</p>
        </div>
        <div class="spotlight-right">
          <div class="spotlight-tagline">${item.tagline}</div>
          <span class="spotlight-meta">NextGen Studio Venture</span>
        </div>
      </div>
    `;
  }

  function mountCarousel(cat) {
    if (carouselInstance) {
      carouselInstance.destroy();
      carouselInstance = null;
    }

    const items = getItemsForCategory(cat);
    const isMobile = window.innerWidth < 640;
    const cardWidth = isMobile ? 180 : 220;

    carouselInstance = window.CircularCarousel(container, {
      items: items,
      preset: 'cylinder',
      intro: 'rise',
      cardWidth: cardWidth,
      aspectRatio: 1,
      speed: 14,
      captions: true,
      fadeColor: '#FAF9F6',
      cornerRadius: 14,
      draggable: true,
      momentum: 0.6,
      snap: true,
      pauseOnHover: true,
      focusOnClick: true,
      onChange: (index, item) => {
        updateSpotlight(item);
      },
      onItemClick: (item, index) => {
        updateSpotlight(item);
      }
    });

    if (items.length > 0) {
      updateSpotlight(items[0]);
    }
  }

  // Filter tabs click handlers
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      if (cat === activeCategory) return;

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = cat;

      mountCarousel(cat);

      // Filter grid cards below if grid exists
      if (gridSection) {
        const builtGroup = document.getElementById('groupBuilt');
        const buildingGroup = document.getElementById('groupBuilding');

        if (cat === 'built') {
          if (builtGroup) builtGroup.style.display = 'block';
          if (buildingGroup) buildingGroup.style.display = 'none';
        } else if (cat === 'building') {
          if (builtGroup) builtGroup.style.display = 'none';
          if (buildingGroup) buildingGroup.style.display = 'block';
        } else {
          if (builtGroup) builtGroup.style.display = 'block';
          if (buildingGroup) buildingGroup.style.display = 'block';
        }
      }
    });
  });

  // Initial mount
  mountCarousel(activeCategory);

  // Re-adjust on resize
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      mountCarousel(activeCategory);
    }, 250);
  });
});
