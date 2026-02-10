/* ========================================
   FILMIXO - Home Manager
   Feed Loading, Infinite Scroll & SEO
   ======================================== */

import { db, collection, getDocs, query, orderBy, limit, startAfter } from './core-engine.js';

// ========== STATE MANAGEMENT ==========
let allPosts = [];
let displayedPosts = [];
let lastVisible = null;
let batchTracker = 0;
let isLoading = false;
let observer = null;
let tallCardsPosts = [];

// ========== FETCH ALL POSTS FROM FIREBASE ==========
async function fetchAllPosts() {
    try {
        const cachedPosts = await window.filmixoCache.getAllPosts();
        
        if (cachedPosts && cachedPosts.length > 0) {
            console.log('Loading posts from cache');
            allPosts = cachedPosts.sort((a, b) => b.uploadTime - a.uploadTime);
            return allPosts;
        }

        console.log('Fetching posts from Firebase');
        const postsCollection = collection(db, "posts");
        const q = query(postsCollection, orderBy("uploadTime", "desc"));
        const querySnapshot = await getDocs(q);

        allPosts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        await window.filmixoCache.savePosts(allPosts);
        return allPosts;

    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

// ========== RENDER STANDARD POST CARD ==========
function renderPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
        <div class="media-container" onclick="window.savePostData(${JSON.stringify(post).replace(/"/g, '&quot;')}); window.navigateToPost('${post.id}', '${post.title}');">
            <img data-src="${post.mediaImage}" alt="${post.title}" loading="lazy">
        </div>
        <div class="card-content">
            <div class="text-area" onclick="window.savePostData(${JSON.stringify(post).replace(/"/g, '&quot;')}); window.navigateToPost('${post.id}', '${post.title}');">
                <div class="title-box">
                    <div class="post-title">${post.title}</div>
                </div>
                <div class="excerpt-box">
                    <div class="post-excerpt">${post.excerpt || post.description || 'Discover this cinematic masterpiece...'}</div>
                </div>
            </div>
            <div class="card-footer-info">
                <div class="view-group">
                    <svg viewBox="0 0 576 512" style="width:16px;height:16px;fill:var(--acc);flex-shrink:0;">
                        <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
                    </svg>
                    <span>FILMIXO</span>
                </div>
                <div class="date-group">
                    <i class="fas fa-clock"></i>
                    <span>${window.timeAgo(post.uploadTime)}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

// ========== RENDER TALL CARD ==========
function renderTallCard(post) {
    const card = document.createElement('div');
    card.className = 'tall-card';
    card.onclick = () => {
        window.savePostData(post);
        window.navigateToPost(post.id, post.title);
    };
    
    card.innerHTML = `
        <div class="tall-card-image">
            <img data-src="${post.mediaImage}" alt="${post.title}" loading="lazy">
        </div>
        <div class="tall-card-content">
            <div class="tall-card-title">${post.title}</div>
            <div class="tall-card-footer">
                <div class="tall-card-signature">
                    <svg viewBox="0 0 576 512" style="width:18px;height:18px;fill:var(--acc);">
                        <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
                    </svg>
                    <span>FILMIXO</span>
                </div>
                <div class="tall-card-date">
                    <i class="fas fa-clock"></i>
                    <span>${window.timeAgo(post.uploadTime)}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

// ========== LOAD BATCH OF POSTS TO FEED ==========
function loadBatch() {
    if (isLoading) return;
    isLoading = true;

    const startIndex = batchTracker * window.CONFIG.POSTS_PER_BATCH;
    const endIndex = startIndex + window.CONFIG.POSTS_PER_BATCH;
    const batch = allPosts.slice(startIndex, endIndex);

    if (batch.length === 0) {
        document.getElementById('sentinel').style.display = 'none';
        const noMore = document.createElement('div');
        noMore.style.cssText = 'text-align:center;padding:40px;color:var(--g);font-size:15px;';
        noMore.textContent = '🎬 All content loaded';
        document.getElementById('feed-container').appendChild(noMore);
        isLoading = false;
        return;
    }

    const feedContainer = document.getElementById('feed-container');
    
    batch.forEach(post => {
        const card = renderPostCard(post);
        feedContainer.appendChild(card);
        displayedPosts.push(post);
    });

    window.initLazyLoading();
    batchTracker++;
    isLoading = false;
}

// ========== RENDER TALL CARDS SECTION ==========
function renderTallCardsSection() {
    // Start from 3rd post (index 2) for tall cards
    tallCardsPosts = allPosts.slice(2, 12);
    
    if (tallCardsPosts.length === 0) return;

    const tallCardsSection = document.createElement('div');
    tallCardsSection.className = 'tall-cards-section';
    tallCardsSection.innerHTML = `
        <div class="section-title-bar">
            <div class="title-divider">
                <span>🎭 Featured Masterpieces</span>
            </div>
        </div>
        <div class="tall-cards-wrapper">
            <div class="tall-cards-grid" id="tall-cards-grid"></div>
        </div>
    `;

    const feedContainer = document.getElementById('feed-container');
    feedContainer.parentNode.insertBefore(tallCardsSection, feedContainer);

    const tallCardsGrid = document.getElementById('tall-cards-grid');
    tallCardsPosts.forEach(post => {
        const card = renderTallCard(post);
        tallCardsGrid.appendChild(card);
    });

    window.initLazyLoading();
}

// ========== SETUP INFINITE SCROLL OBSERVER ==========
function setupInfiniteScroll() {
    const sentinel = document.getElementById('sentinel');
    if (!sentinel) return;

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadBatch();
            }
        });
    }, {
        rootMargin: '200px'
    });

    observer.observe(sentinel);
}

// ========== MANUAL LOAD MORE ==========
window.handleManualLoad = function() {
    document.getElementById('load-more-section').style.display = 'none';
    const sentinel = document.getElementById('sentinel');
    sentinel.style.display = 'flex';
    batchTracker = 0;
    loadBatch();
    setupInfiniteScroll();
};

// ========== GENERATE HOMEPAGE SEO ==========
function generateHomepageSEO(totalPosts) {
    const topMovies = allPosts.slice(0, 3)
        .map(p => p.title)
        .join(', ') || "Latest Global Cinema";

    const titleVariations = [
        `FILMIXO | Analyzing the ${topMovies} Ecosystem 🎬`,
        `FILMIXO | Strategic Market Positioning: ${topMovies} 🕵️`,
        `FILMIXO | Cinematic Forensics & Investigative Analysis: ${topMovies}`,
        `FILMIXO | Global Content Dynamics & Distribution: ${topMovies} 🎭`,
        `FILMIXO | Production Forensics & Market Trajectory: ${topMovies}`
    ];

    const descVariations = [
        `FILMIXO: A premier 2026 cinematic forensics hub. We decode the strategic market positioning of ${totalPosts}+ titles, analyzing the commercial calculations and financial frameworks of hits like ${topMovies}.`,
        `Beyond mainstream critiques: FILMIXO investigates the global content ecosystem of ${totalPosts}+ films. Exploring subscription retention metrics and production dynamics for ${topMovies} to unlock hidden industry insights.`,
        `Unlocking the vision: Professional cinematic forensics of ${totalPosts}+ trending blockbusters. We analyze artistic risks, multi-locale production leakages, and the strategic positioning of ${topMovies} in today's market.`
    ];

    const selectedTitle = window.getRandomElement(titleVariations);
    const selectedDesc = window.getRandomElement(descVariations);

    document.title = selectedTitle;
    window.updateMetaTag('meta[name="description"]', 'content', selectedDesc);
    window.updateMetaTag('meta[name="keywords"]', 'content', 
        `cinematic forensics, strategic market positioning, filmixo industry analysis, subscription retention metrics, production dynamics, ${topMovies}, cinematic economics 2026`);

    window.updateCanonical(window.location.origin + window.location.pathname);

    window.updateMetaTag('meta[property="og:title"]', 'content', selectedTitle);
    window.updateMetaTag('meta[property="og:description"]', 'content', selectedDesc);
    window.updateMetaTag('meta[property="og:url"]', 'content', window.location.href);
    window.updateMetaTag('meta[name="twitter:title"]', 'content', selectedTitle);
    window.updateMetaTag('meta[name="twitter:description"]', 'content', selectedDesc);

    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": window.location.origin + "/#website",
                "url": window.location.origin,
                "name": "FILMIXO",
                "description": selectedDesc,
                "inLanguage": "en-US",
                "publisher": {
                    "@type": "Organization",
                    "name": "FILMIXO Editorial & Research",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://filmixo.vercel.app/thumbel/filmixo.jpeg"
                    }
                }
            },
            {
                "@type": "CollectionPage",
                "@id": window.location.origin + "/#collection",
                "name": "Cinematic Analysis Archive",
                "mainEntity": {
                    "@type": "ItemList",
                    "numberOfItems": totalPosts,
                    "itemListOrder": "https://schema.org/ItemListOrderDescending"
                }
            }
        ]
    };

    window.updateSchema(schemaData, 'homepage-schema');
}

// ========== UPDATE STATS BAR ==========
function updateStatsBar() {
    const totalCount = document.getElementById('total-count');
    const displayedCount = document.getElementById('displayed-count');

    if (totalCount) totalCount.textContent = allPosts.length;
    if (displayedCount) displayedCount.textContent = displayedPosts.length;
}

// ========== CINEMATIC INTRO ANIMATION ==========
function playCinematicIntro() {
    const intro = document.querySelector(".intro-text");
    if (intro) {
        intro.style.animation = "cinematicIntro 3.5s cubic-bezier(.22,1,.36,1) forwards";
    }
}

// ========== MAIN INITIALIZATION ==========
async function initHomePage() {
    try {
        console.log('Initializing FILMIXO Home Page...');
        
        await fetchAllPosts();
        
        if (allPosts.length > 0) {
            renderTallCardsSection();
            loadBatch();
            setupInfiniteScroll();
            generateHomepageSEO(allPosts.length);
            updateStatsBar();
            playCinematicIntro();
            
            setInterval(updateStatsBar, 5000);
        } else {
            const feedContainer = document.getElementById('feed-container');
            feedContainer.innerHTML = '<p style="text-align:center;color:var(--g);padding:40px;">No posts available</p>';
        }

    } catch (error) {
        console.error('Home page initialization error:', error);
    }
}

// ========== AUTO-INITIALIZE ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomePage);
} else {
    initHomePage();
}

// ========== EXPORTS ==========
export { 
    fetchAllPosts, 
    loadBatch, 
    renderTallCardsSection, 
    generateHomepageSEO 
};

console.log('🏠 FILMIXO Home Manager Loaded');

