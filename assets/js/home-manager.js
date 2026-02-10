/* ========================================
   FILMIXO - Home Manager (FIXED VERSION)
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
        console.log('🔍 Attempting to fetch posts from cache...');
        const cachedPosts = await window.filmixoCache.getAllPosts();
        
        if (cachedPosts && cachedPosts.length > 0) {
            console.log('✅ Loaded', cachedPosts.length, 'posts from cache');
            allPosts = cachedPosts.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
            return allPosts;
        }

        console.log('🌐 No cache found. Fetching from Firebase...');
        console.log('📂 Collection name: "posts"');
        
        const postsCollection = collection(db, "posts");
        const q = query(postsCollection, orderBy("uploadTime", "desc"));
        
        console.log('🔄 Executing Firebase query...');
        const querySnapshot = await getDocs(q);
        
        console.log('📊 Query result: ', querySnapshot.size, 'documents found');

        if (querySnapshot.empty) {
            console.warn('⚠️ Firebase returned EMPTY result!');
            console.warn('🔍 Check করো:');
            console.warn('   1. Firebase collection name সঠিক কিনা (posts)');
            console.warn('   2. Firestore rules allow read কিনা');
            console.warn('   3. Documents আছে কিনা database এ');
            return [];
        }

        allPosts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('✅ Document loaded:', doc.id);
            return {
                id: doc.id,
                ...data
            };
        });

        console.log('💾 Saving', allPosts.length, 'posts to cache...');
        await window.filmixoCache.savePosts(allPosts);
        
        console.log('✅ Successfully loaded', allPosts.length, 'posts from Firebase');
        return allPosts;

    } catch (error) {
        console.error("❌ FIREBASE ERROR:", error);
        console.error("Error details:", error.message);
        console.error("Error code:", error.code);
        
        // Firebase specific error handling
        if (error.code === 'permission-denied') {
            console.error('🚫 Firestore Rules: Read permission denied!');
            console.error('💡 Solution: Firestore console এ গিয়ে rules allow করো');
        } else if (error.code === 'unavailable') {
            console.error('🌐 Network issue or Firebase service unavailable');
        }
        
        return [];
    }
}

// ========== RENDER STANDARD POST CARD ==========
function renderPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    // Field validation with fallbacks
    const image = post.mediaImage || 'https://via.placeholder.com/400x600/1a1a1a/ffffff?text=No+Image';
    const title = post.title || 'Untitled';
    const excerpt = post.paragraphs && post.paragraphs[0] 
        ? post.paragraphs[0].substring(0, 120) + '...' 
        : 'Discover this cinematic masterpiece...';
    const date = post.uploadTime ? window.timeAgo(new Date(post.uploadTime).getTime()) : 'Recently';

    card.innerHTML = `
        <div class="media-container" onclick="window.savePostData(${JSON.stringify(post).replace(/"/g, '&quot;')}); window.navigateToPost('${post.id}', '${title.replace(/'/g, "\\'")}');">
            <img data-src="${image}" src="data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="lazy-img" alt="${title}">
        </div>
        <div class="card-content">
            <div class="text-area" onclick="window.savePostData(${JSON.stringify(post).replace(/"/g, '&quot;')}); window.navigateToPost('${post.id}', '${title.replace(/'/g, "\\'")}');">
                <div class="title-box">
                    <div class="post-title">${title}</div>
                </div>
                <div class="excerpt-box">
                    <div class="post-excerpt">${excerpt}</div>
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
                    <span>${date}</span>
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
    const title = post.title || 'Untitled';
    const image = post.mediaImage || 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image';
    const date = post.uploadTime ? window.timeAgo(new Date(post.uploadTime).getTime()) : 'Recently';

    card.onclick = () => {
        window.savePostData(post);
        window.navigateToPost(post.id, title);
    };
    
    card.innerHTML = `
        <div class="tall-card-image">
            <img data-src="${image}" src="data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" class="lazy-img" alt="${title}">
        </div>
        <div class="tall-card-content">
            <div class="tall-card-title">${title}</div>
            <div class="tall-card-footer">
                <div class="tall-card-signature">
                    <svg viewBox="0 0 576 512" style="width:18px;height:18px;fill:var(--acc);">
                        <path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79a47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"/>
                    </svg>
                    <span>FILMIXO</span>
                </div>
                <div class="tall-card-date">
                    <span>${date}</span>
                </div>
            </div>
        </div>
    `;
    return card;
}

// ========== LOAD BATCH OF POSTS TO FEED ==========
function loadBatch() {
    if (isLoading) {
        console.log('⏸️ Already loading, skipping...');
        return;
    }
    
    console.log('📦 Loading batch', batchTracker + 1);
    isLoading = true;

    const startIndex = batchTracker * window.CONFIG.POSTS_PER_BATCH;
    const endIndex = startIndex + window.CONFIG.POSTS_PER_BATCH;
    const batch = allPosts.slice(startIndex, endIndex);

    console.log('📊 Batch range:', startIndex, 'to', endIndex);
    console.log('📊 Posts in this batch:', batch.length);

    const feedContainer = document.getElementById('feed-container');

    if (batch.length === 0) {
        console.log('✅ All posts loaded. No more content.');
        if (document.getElementById('sentinel')) {
            document.getElementById('sentinel').style.display = 'none';
        }
        if (batchTracker > 0 && !document.querySelector('.no-more-loader')) {
            const noMore = document.createElement('div');
            noMore.className = 'no-more-loader';
            noMore.style.cssText = 'text-align:center;padding:40px;color:var(--g);font-size:15px;';
            noMore.textContent = '🎬 All content loaded';
            feedContainer.appendChild(noMore);
        }
        isLoading = false;
        return;
    }
    
    batch.forEach(post => {
        const card = renderPostCard(post);
        feedContainer.appendChild(card);
        displayedPosts.push(post);
    });

    console.log('✅ Batch loaded successfully');
    console.log('📊 Total displayed posts:', displayedPosts.length);

    if (window.initLazyLoading) window.initLazyLoading();
    batchTracker++;
    isLoading = false;
}

// ========== RENDER TALL CARDS SECTION ==========
function renderTallCardsSection() {
    console.log('🎨 Rendering tall cards section...');
    
    // Index 2 থেকে 12 পর্যন্ত (10টি posts)
    tallCardsPosts = allPosts.slice(2, 12);
    
    if (tallCardsPosts.length === 0) {
        console.log('⚠️ No posts available for tall cards section');
        return;
    }

    console.log('✅ Tall cards posts:', tallCardsPosts.length);

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
    if (feedContainer && feedContainer.parentNode) {
        feedContainer.parentNode.insertBefore(tallCardsSection, feedContainer);

        const tallCardsGrid = document.getElementById('tall-cards-grid');
        tallCardsPosts.forEach(post => {
            const card = renderTallCard(post);
            tallCardsGrid.appendChild(card);
        });
        
        console.log('✅ Tall cards section rendered');
    }

    if (window.initLazyLoading) window.initLazyLoading();
}

// ========== SETUP INFINITE SCROLL OBSERVER ==========
function setupInfiniteScroll() {
    console.log('♾️ Setting up infinite scroll...');
    
    const sentinel = document.getElementById('sentinel');
    if (!sentinel) {
        console.warn('⚠️ Sentinel element not found!');
        return;
    }

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                console.log('👁️ Sentinel visible, loading next batch...');
                loadBatch();
            }
        });
    }, {
        rootMargin: '200px'
    });

    observer.observe(sentinel);
    console.log('✅ Infinite scroll activated');
}

// ========== MANUAL LOAD MORE ==========
window.handleManualLoad = function() {
    console.log('👆 Manual load button clicked');
    
    const loadMoreSection = document.getElementById('load-more-section');
    if (loadMoreSection) loadMoreSection.style.display = 'none';
    
    const sentinel = document.getElementById('sentinel');
    if (sentinel) sentinel.style.display = 'flex';
    
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

    const selectedTitle = window.getRandomElement ? window.getRandomElement(titleVariations) : titleVariations[0];
    const selectedDesc = window.getRandomElement ? window.getRandomElement(descVariations) : descVariations[0];

    document.title = selectedTitle;
    if (window.updateMetaTag) {
        window.updateMetaTag('meta[name="description"]', 'content', selectedDesc);
        window.updateMetaTag('meta[name="keywords"]', 'content', 
            `cinematic forensics, strategic market positioning, filmixo industry analysis, subscription retention metrics, production dynamics, ${topMovies}, cinematic economics 2026`);

        window.updateCanonical(window.location.origin + window.location.pathname);

        window.updateMetaTag('meta[property="og:title"]', 'content', selectedTitle);
        window.updateMetaTag('meta[property="og:description"]', 'content', selectedDesc);
        window.updateMetaTag('meta[property="og:url"]', 'content', window.location.href);
        window.updateMetaTag('meta[name="twitter:title"]', 'content', selectedTitle);
        window.updateMetaTag('meta[name="twitter:description"]', 'content', selectedDesc);
    }

    if (window.updateSchema) {
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
        console.log('🎬 ========================================');
        console.log('🎬 FILMIXO Home Page Initialization');
        console.log('🎬 ========================================');
        
        await fetchAllPosts();
        
        console.log('📊 Total posts fetched:', allPosts.length);
        
        if (allPosts.length > 0) {
            console.log('✅ Posts available, rendering UI...');
            
            renderTallCardsSection();
            loadBatch();
            setupInfiniteScroll();
            generateHomepageSEO(allPosts.length);
            updateStatsBar();
            playCinematicIntro();
            
            setInterval(updateStatsBar, 5000);
            
            console.log('✅ Home page initialization complete!');
        } else {
            console.warn('⚠️ NO POSTS FOUND!');
            console.warn('🔍 Possible reasons:');
            console.warn('   1. Firebase collection "posts" খালি আছে');
            console.warn('   2. Firestore rules read permission নেই');
            console.warn('   3. Network connection issue');
            console.warn('   4. Firebase config ভুল আছে');
            
            const feedContainer = document.getElementById('feed-container');
            if (feedContainer) {
                feedContainer.innerHTML = `
                    <div style="text-align:center;color:var(--g);padding:60px 20px;">
                        <h2 style="color:var(--acc);margin-bottom:20px;">⚠️ No Posts Available</h2>
                        <p style="margin-bottom:15px;">Please check:</p>
                        <ul style="list-style:none;padding:0;line-height:1.8;">
                            <li>✓ Firebase collection name is "posts"</li>
                            <li>✓ Firestore rules allow read access</li>
                            <li>✓ Documents exist in the collection</li>
                            <li>✓ Network connection is working</li>
                        </ul>
                        <p style="margin-top:25px;color:var(--g);font-size:14px;">
                            Check browser console for detailed error messages
                        </p>
                    </div>
                `;
            }
        }

    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        console.error('Error stack:', error.stack);
        
        const feedContainer = document.getElementById('feed-container');
        if (feedContainer) {
            feedContainer.innerHTML = `
                <div style="text-align:center;color:#ff4444;padding:60px 20px;">
                    <h2>❌ Initialization Failed</h2>
                    <p style="margin-top:15px;color:var(--g);">${error.message}</p>
                    <p style="margin-top:10px;font-size:13px;color:var(--g);">Check console for details</p>
                </div>
            `;
        }
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

console.log('🏠 FILMIXO Home Manager Loaded Successfully');
