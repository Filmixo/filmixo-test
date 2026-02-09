/* ========================================
   FILMIXO - Post Manager
   Single Post Loading & Dynamic SEO
   ======================================== */

import { db, doc, getDoc } from './core-engine.js';

// ========== STATE MANAGEMENT ==========
let currentPost = null;
let postId = null;
let timeElements = [];

// ========== GET POST ID FROM URL ==========
function getPostIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ========== FETCH POST DATA ==========
async function fetchPost(id) {
    try {
        const cachedData = sessionStorage.getItem('current_post_data');
        
        if (cachedData) {
            const post = JSON.parse(cachedData);
            if (post.id === id || window.generateSlug(post.title) === id) {
                console.log('Loading post from session cache');
                return post;
            }
        }

        console.log('Fetching post from Firebase');
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        
        return null;

    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

// ========== RENDER POST CONTENT ==========
function renderPost(post) {
    currentPost = post;

    const appWrapper = document.getElementById('app-wrapper');
    if (!appWrapper) return;

    const postHtml = `
        <div class="article-section">
            <div class="video-container" onclick="handleVideoClick()">
                <img id="main-img" src="${post.mediaImage}" alt="${post.title}" loading="eager">
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
                    <svg viewBox="0 0 512 512" style="width:80px;height:80px;fill:var(--acc);filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5));">
                        <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm115.7 272l-176 101c-15.8 8.8-35.7-2.5-35.7-21V152c0-18.4 19.8-29.8 35.7-21l176 107c16.4 9.2 16.4 32.9 0 42z"/>
                    </svg>
                </div>
            </div>

            <div class="section-title-bar">
                <div class="title-divider">
                    <span>📽️ About This Movie</span>
                </div>
            </div>

            <div id="ad-box-title" class="ad-container"></div>

            <h1 class="article-title">${post.title}</h1>

            <div id="ad-box-p1" class="ad-container"></div>

            <div class="article-content">
                ${post.description || post.content || ''}
            </div>

            <div id="ad-box-mid" class="ad-container"></div>

            <div class="share-panel">
                <h3 style="color:var(--acc);margin-bottom:15px;font-size:18px;">📤 Share This Movie</h3>
                <div class="share-grid">
                    <div class="share-icon" role="button" aria-label="Share on Facebook" style="background:#1877f2" onclick="sharePost('fb')">
                        <svg viewBox="0 0 320 512" style="width:14px;height:14px;fill:white;">
                            <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                        </svg>
                    </div>
                    <div class="share-icon" role="button" aria-label="Share on Messenger" style="background:#0084ff" onclick="sharePost('msg')">
                        <svg viewBox="0 0 512 512" style="width:14px;height:14px;fill:white;">
                            <path d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23 1.15 37.6 15 31.7 31.31 23.08l41.68-22.06c13.1-4 27.31-7.1 41.52-8.05l41.52 1.42C396.58 489.13 504 386.79 504 248.57 504 110.34 396.58 8 256.55 8zm131.81 190.15l-69.74 110.3c-11.86 18.41-36.85 21.72-52.54 6.64l-53.53-51.11-105.74 51.11c-15.14 7.5-31.22-9.53-22.7-23.77l69.74-110.3c11.86-18.41 36.85-21.72 52.54-6.64l53.53 51.11 105.74-51.11c15.14-7.51 31.22 9.51 22.7 23.77z"/>
                        </svg>
                    </div>
                    <div class="share-icon" role="button" aria-label="Share on WhatsApp" style="background:#25d366" onclick="sharePost('wa')">
                        <svg viewBox="0 0 448 512" style="width:14px;height:14px;fill:white;">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18s-8.8-2.8-12.4 2.8-14.2 18-17.4 21.7-6.5 4.2-12 1.4c-5.5-2.8-23.2-8.5-44.3-27.3-16.4-14.6-27.4-32.7-30.7-38.2s-.4-8.5 2.4-11.2c2.5-2.6 5.5-6.4 8.2-9.6s3.7-5.5 5.5-9.1.9-6.9-.5-9.6-12.4-29.9-17-40.9c-4.5-10.8-9.1-9.3-12.4-9.5-3.2-.2-6.9-.2-10.5-.2s-9.6 1.3-14.6 6.9-19.2 18.7-19.2 45.6 19.6 53 22.3 56.7c2.8 3.7 38.5 58.8 93.4 82.5 13.1 5.7 23.3 9.1 31.3 11.6 13.1 4.2 25.1 3.6 34.6 2.1 10.6-1.5 32.8-13.4 37.4-26.4s4.6-24.1 3.2-26.4-5.5-3.7-11-6.5z"/>
                        </svg>
                    </div>
                    <div class="share-icon" role="button" aria-label="Share on Twitter" style="background:#1da1f2" onclick="sharePost('tw')">
                        <svg viewBox="0 0 512 512" style="width:14px;height:14px;fill:white;">
                            <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-77.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.319 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/>
                        </svg>
                    </div>
                    <div class="share-icon" role="button" aria-label="Share on Telegram" style="background:#0088cc" onclick="sharePost('tg')">
                        <svg viewBox="0 0 496 512" style="width:14px;height:14px;fill:white;">
                            <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div id="ad-box-video" class="ad-container"></div>
        </div>
    `;

    appWrapper.innerHTML = postHtml;

    const timeSlot = document.getElementById('status-time-slot');
    if (timeSlot && post.uploadTime) {
        timeSlot.innerHTML = `
            <svg viewBox="0 0 512 512" style="width:12px;height:12px;fill:var(--acc);margin-right:5px;vertical-align:middle;">
                <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334 337.7c-3.9 5.3-11.4 6.5-16.2 2.7z"/>
            </svg>
            <span style="color:var(--acc);font-weight:900;">${window.timeAgo(post.uploadTime)}</span>
        `;
        timeElements = [{ el: timeSlot.querySelector('span'), date: post.uploadTime }];
    }

    const img = document.getElementById('main-img');
    if (img) {
        img.onload = () => {
            if (img.naturalWidth / img.naturalHeight < 1.2) {
                img.closest('.video-container').classList.add('auto-fit');
            }
        };
    }
}

// ========== GENERATE POST SEO ==========
function generatePostSEO(post) {
    const titleVariations = [
        `${post.title} | FILMIXO Professional Analysis 🎬`,
        `${post.title} - Expert Review & HD Download | FILMIXO`,
        `Watch ${post.title} | FILMIXO Cinematic Forensics 🕵️`,
        `${post.title} | Strategic Analysis & Full Review - FILMIXO`,
        `${post.title} - Complete Guide & Expert Insights | FILMIXO 🎭`
    ];

    const descVariations = [
        `Comprehensive professional analysis of ${post.title}. Explore expert reviews, technical breakdowns (VFX/Audio), director insights, and audience reactions. Watch trailer and download in HD.`,
        `${post.title}: FILMIXO delivers in-depth cinematic forensics—analyzing production quality, narrative structure, and market positioning. Full review with streaming and download options.`,
        `Unlock the vision behind ${post.title}. Professional critique covering direction, performances, technical excellence, and cultural impact. Expert analysis you can trust.`
    ];

    const selectedTitle = window.getRandomElement(titleVariations);
    const selectedDesc = window.getRandomElement(descVariations);

    document.title = selectedTitle;
    window.updateMetaTag('meta[name="description"]', 'content', selectedDesc);
    window.updateMetaTag('meta[name="keywords"]', 'content', 
        `${post.title}, expert movie review, filmixo analysis, vfx review, director insights, audience reaction, movie download, hd movies, ${post.title} review`);
    window.updateMetaTag('meta[name="author"]', 'content', 'FILMIXO Editorial Team');

    window.updateCanonical(window.location.href);

    window.updateMetaTag('meta[property="og:type"]', 'content', 'video.movie');
    window.updateMetaTag('meta[property="og:site_name"]', 'content', 'FILMIXO');
    window.updateMetaTag('meta[property="og:title"]', 'content', selectedTitle);
    window.updateMetaTag('meta[property="og:description"]', 'content', selectedDesc);
    window.updateMetaTag('meta[property="og:url"]', 'content', window.location.href);
    window.updateMetaTag('meta[property="og:image"]', 'content', post.mediaImage || 'https://filmixo.vercel.app/thumbel/filmixo.jpeg');

    window.updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    window.updateMetaTag('meta[name="twitter:title"]', 'content', selectedTitle);
    window.updateMetaTag('meta[name="twitter:description"]', 'content', selectedDesc);
    window.updateMetaTag('meta[name="twitter:image"]', 'content', post.mediaImage || 'https://filmixo.vercel.app/thumbel/filmixo.jpeg');

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Movie",
        "name": post.title,
        "image": post.mediaImage || "https://filmixo.vercel.app/thumbel/filmixo.jpeg",
        "description": selectedDesc,
        "datePublished": new Date(post.uploadTime).toISOString(),
        "publisher": {
            "@type": "Organization",
            "name": "FILMIXO",
            "logo": {
                "@type": "ImageObject",
                "url": "https://filmixo.vercel.app/thumbel/filmixo.jpeg"
            }
        }
    };

    window.updateSchema(schemaData, 'dynamic-schema');
}

// ========== VIDEO CLICK HANDLER ==========
window.handleVideoClick = function() {
    const container = document.querySelector('.video-container');
    if (container) {
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';
    }
    setTimeout(() => {
        window.location.href = window.CONFIG.GLOBAL_VIDEO_LINK;
    }, 100);
};

// ========== SOCIAL SHARING ==========
window.sharePost = function(platform) {
    const title = currentPost?.title || document.querySelector('.article-title')?.innerText || "Watch Movie";
    const url = window.location.href;
    const fullText = encodeURIComponent(title + "\n\n" + url);
    const encodedUrl = encodeURIComponent(url);

    let shareUrl = '';
    
    switch(platform) {
        case 'fb':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
            break;
        case 'wa':
            shareUrl = `https://wa.me/?text=${fullText}`;
            break;
        case 'msg':
            shareUrl = `fb-messenger://share/?link=${encodedUrl}`;
            break;
        case 'tw':
            shareUrl = `https://twitter.com/intent/tweet?text=${fullText}`;
            break;
        case 'tg':
            shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(title)}`;
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
};

// ========== SCROLL POSITION MANAGEMENT ==========
window.onbeforeunload = function() {
    if (postId) {
        sessionStorage.setItem(`scroll_pos_${postId}`, window.scrollY.toString());
    }
};

function restoreScrollPosition() {
    const savedPosition = sessionStorage.getItem(`scroll_pos_${postId}`);
    if (savedPosition) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
        }, 150);
    }
}

// ========== TIME UPDATE LOOP ==========
function startTimeUpdateLoop() {
    setInterval(() => {
        timeElements.forEach(item => {
            if (item.el && item.date) {
                item.el.textContent = window.timeAgo(item.date);
            }
        });
    }, 60000);
}

// ========== MAIN INITIALIZATION ==========
async function initPostPage() {
    postId = getPostIdFromUrl();

    if (!postId) {
        window.location.href = '/';
        return;
    }

    try {
        console.log('Loading post:', postId);
        
        const post = await fetchPost(postId);

        if (!post) {
            console.error('Post not found');
            window.location.href = '/';
            return;
        }

        renderPost(post);
        generatePostSEO(post);
        restoreScrollPosition();
        
        const appWrapper = document.getElementById('app-wrapper');
        if (appWrapper) {
            appWrapper.classList.add('loaded');
        }

        setTimeout(startTimeUpdateLoop, 2000);

    } catch (error) {
        console.error('Post page initialization error:', error);
        window.location.href = '/';
    }
}

// ========== PAGE SHOW EVENT (Handle Back/Forward) ==========
window.addEventListener('pageshow', function() {
    const container = document.querySelector('.video-container');
    if (container) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }
});

// ========== AUTO-INITIALIZE ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPostPage);
} else {
    initPostPage();
}

// ========== EXPORTS ==========
export { 
    fetchPost, 
    renderPost, 
    generatePostSEO 
};

console.log('📄 FILMIXO Post Manager Loaded');
