/* ========================================
   FILMIXO - Core Engine
   Firebase Configuration, Caching & Utilities
   ======================================== */

// ========== FIREBASE CONFIGURATION ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCY6xJlzGtfcCRhcwKaGKRJ6EIAQaFQAg4",
    authDomain: "bangla-e0b50.firebaseapp.com",
    projectId: "bangla-e0b50",
    storageBucket: "bangla-e0b50.firebasestorage.app",
    messagingSenderId: "848889063084",
    appId: "1:848889063084:web:33cfc4c57fa22a79b33f85",
    measurementId: "G-NMQBJ8TGJ3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs, doc, getDoc, query, orderBy, limit, startAfter };

// ========== GLOBAL CONFIGURATION ==========
window.CONFIG = {
    GLOBAL_VIDEO_LINK: "https://prototypesorting.com/4/8452733",
    CACHE_NAME: "filmixo_cache_v2",
    CACHE_EXPIRY: 3600000,
    POSTS_PER_BATCH: 10
};

// ========== INDEXEDDB SMART CACHING SYSTEM ==========
class FilmixoCache {
    constructor() {
        this.dbName = 'filmixo_db';
        this.storeName = 'posts_store';
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async savePosts(posts) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            const timestamp = Date.now();
            posts.forEach(post => {
                const data = { ...post, timestamp };
                objectStore.put(data);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getAllPosts() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const posts = request.result;
                const now = Date.now();
                const validPosts = posts.filter(p => (now - p.timestamp) < window.CONFIG.CACHE_EXPIRY);
                resolve(validPosts);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clearCache() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

window.filmixoCache = new FilmixoCache();

// ========== COMPONENT INJECTION SYSTEM ==========
async function injectComponent(componentPath, targetSelector) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        
        const html = await response.text();
        const targetElement = document.querySelector(targetSelector);
        
        if (targetElement) {
            targetElement.innerHTML = html;
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Component injection error: ${error.message}`);
        return false;
    }
}

async function loadComponents() {
    const headerContainer = document.getElementById('header-container');
    const footerContainer = document.getElementById('footer-container');

    if (headerContainer) {
        await injectComponent('/components/header.html', '#header-container');
    }

    if (footerContainer) {
        await injectComponent('/components/footer.html', '#footer-container');
    }
}

// Auto-load components when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
} else {
    loadComponents();
}

// ========== UTILITY FUNCTIONS ==========

// Time Ago Formatter
window.timeAgo = function(timestamp) {
    if (!timestamp) return "Recently";
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
};

// Lazy Image Loading with Intersection Observer
window.initLazyLoading = function() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.onload = () => img.classList.add('loaded');
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '100px'
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
};

// Generate URL Slug from Title
window.generateSlug = function(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Navigate to Post Page
window.navigateToPost = function(postId, postTitle) {
    const slug = window.generateSlug(postTitle);
    window.location.href = `/post.html?id=${slug}`;
};

// Save Current Post Data to Session Storage
window.savePostData = function(postData) {
    try {
        sessionStorage.setItem('current_post_data', JSON.stringify(postData));
    } catch (e) {
        console.error('Session storage error:', e);
    }
};

// Format Number with K/M suffixes
window.formatNumber = function(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

// Get Random Element from Array
window.getRandomElement = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

// SEO: Update Meta Tag
window.updateMetaTag = function(selector, attribute, content) {
    let tag = document.querySelector(selector);
    if (!tag) {
        tag = document.createElement('meta');
        const [type, value] = selector.match(/(name|property)="([^"]+)"/).slice(1);
        tag.setAttribute(type, value);
        document.head.appendChild(tag);
    }
    tag.setAttribute(attribute, content);
};

// SEO: Update Canonical URL
window.updateCanonical = function(url) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
};

// SEO: Update JSON-LD Schema
window.updateSchema = function(schemaData, elementId = 'dynamic-schema') {
    const schemaScript = document.getElementById(elementId);
    if (schemaScript) {
        schemaScript.textContent = JSON.stringify(schemaData);
    }
};

// ========== PERFORMANCE MONITORING ==========
window.trackPerformance = function() {
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`Page Load Time: ${pageLoadTime}ms`);
            }, 0);
        });
    }
};

// ========== INITIALIZATION ==========
window.trackPerformance();

// Export for use in other modules
export { 
    injectComponent, 
    loadComponents, 
    FilmixoCache 
};

console.log('🎬 FILMIXO Core Engine Loaded Successfully');
