// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📄 SINGLE POST PAGE LOGIC - post.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Fetch and display single post from Firestore
// Features: Dynamic SEO meta tags, Schema.org markup, content rendering
// Uses: firebase-engine.js for database connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db, doc, getDoc } from './firebase-engine.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOM ELEMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const loadingSpinner = document.getElementById('loadingSpinner');
const postContainer = document.getElementById('postContainer');
const postTitle = document.getElementById('postTitle');
const postCategory = document.getElementById('postCategory');
const postDate = document.getElementById('postDate');
const readTime = document.getElementById('readTime');
const postImage = document.getElementById('postImage');
const postContent = document.getElementById('postContent');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get post ID from URL parameter
 */
function getPostIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Recent';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Recent';
  }
}

/**
 * Format date to ISO 8601 for Schema.org
 */
function formatDateISO(timestamp) {
  if (!timestamp) return new Date().toISOString();
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Calculate estimated read time
 */
function calculateReadTime(content) {
  if (!content) return '5 min read';
  
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return `${minutes} min read`;
}

/**
 * Create SEO-friendly excerpt
 */
function createMetaDescription(content, maxLength = 160) {
  if (!content) return 'Forensic cinema analysis and film criticism by FILMIXO.';
  
  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  
  if (plainText.length <= maxLength) return plainText;
  
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Format content with proper paragraph breaks
 */
function formatContent(content) {
  if (!content) return '<p>Content unavailable.</p>';
  
  // If content already has HTML tags, return as-is
  if (content.includes('<p>') || content.includes('<h2>')) {
    return content;
  }
  
  // Convert line breaks to paragraphs
  return content
    .split('\n\n')
    .filter(para => para.trim())
    .map(para => `<p>${para.trim()}</p>`)
    .join('\n');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEO META TAG UPDATES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Update all SEO meta tags dynamically
 */
function updateSEOMetaTags(post, postId) {
  const title = post.title || 'Film Analysis';
  const description = createMetaDescription(post.content);
  const imageUrl = post.imageUrl || post.image || 'https://filmixo.vercel.app/og-image.jpg';
  const url = `https://filmixo.vercel.app/post.html?id=${postId}`;
  const publishedDate = formatDateISO(post.timestamp || post.createdAt);
  
  // Page Title
  document.getElementById('pageTitle').textContent = `${title} | FILMIXO`;
  document.title = `${title} | FILMIXO`;
  
  // Meta Description
  document.getElementById('pageDescription').setAttribute('content', description);
  
  // Open Graph Tags
  document.getElementById('ogUrl').setAttribute('content', url);
  document.getElementById('ogTitle').setAttribute('content', title);
  document.getElementById('ogDescription').setAttribute('content', description);
  document.getElementById('ogImage').setAttribute('content', imageUrl);
  document.getElementById('articlePublished').setAttribute('content', publishedDate);
  
  // Twitter Tags
  document.getElementById('twitterUrl').setAttribute('content', url);
  document.getElementById('twitterTitle').setAttribute('content', title);
  document.getElementById('twitterDescription').setAttribute('content', description);
  document.getElementById('twitterImage').setAttribute('content', imageUrl);
  
  // Canonical URL
  document.getElementById('canonicalUrl').setAttribute('href', url);
  
  // Update Schema.org Article Markup
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": imageUrl,
    "datePublished": publishedDate,
    "dateModified": publishedDate,
    "author": {
      "@type": "Organization",
      "name": "FILMIXO"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FILMIXO",
      "logo": {
        "@type": "ImageObject",
        "url": "https://filmixo.vercel.app/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };
  
  document.getElementById('articleSchema').textContent = JSON.stringify(schemaData, null, 2);
  
  console.log('✅ SEO meta tags updated');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RENDER POST CONTENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Render post data to the page
 */
function renderPost(post, postId) {
  const title = post.title || 'Untitled Analysis';
  const category = post.category || 'FORENSIC ANALYSIS';
  const timestamp = post.timestamp || post.createdAt || post.date;
  const imageUrl = post.imageUrl || post.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500"%3E%3Crect fill="%231a1a1a" width="800" height="500"/%3E%3Ctext fill="%23d4af37" font-size="48" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFILMIXO%3C/text%3E%3C/svg%3E';
  const content = post.content || 'Content unavailable.';
  
  // Update page elements
  postTitle.textContent = title;
  postCategory.textContent = category;
  postDate.innerHTML = `<i class="far fa-calendar"></i> ${formatDate(timestamp)}`;
  readTime.innerHTML = `<i class="far fa-clock"></i> ${calculateReadTime(content)}`;
  
  postImage.src = imageUrl;
  postImage.alt = title;
  postImage.onerror = function() {
    this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22500%22%3E%3Crect fill=%22%231a1a1a%22 width=%22800%22 height=%22500%22/%3E%3Ctext fill=%22%23d4af37%22 font-size=%2248%22 font-family=%22Arial%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EFILMIXO%3C/text%3E%3C/svg%3E';
  };
  
  postContent.innerHTML = formatContent(content);
  
  // Update SEO
  updateSEOMetaTags(post, postId);
  
  // Show content, hide loading
  loadingSpinner.style.display = 'none';
  postContainer.style.display = 'block';
  
  console.log('✨ Post rendered successfully');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FETCH POST FROM FIRESTORE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Load post from Firestore
 */
async function loadPost() {
  try {
    const postId = getPostIdFromURL();
    
    if (!postId) {
      throw new Error('No post ID provided in URL');
    }
    
    console.log(`🔥 Fetching post: ${postId}`);
    
    // Fetch post document
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const post = postSnap.data();
    console.log('📄 Post data:', post);
    
    renderPost(post, postId);
    
  } catch (error) {
    console.error('❌ Error loading post:', error);
    
    // Show error message
    loadingSpinner.style.display = 'none';
    postContainer.style.display = 'block';
    
    postContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--border-radius);">
        <h1 style="color: var(--accent-gold); margin-bottom: 1.5rem;">
          <i class="fas fa-exclamation-triangle"></i> Post Not Found
        </h1>
        <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 1.1rem;">
          ${error.message === 'Post not found' 
            ? 'The requested analysis does not exist or has been removed.' 
            : 'Unable to load post content.'}
        </p>
        <p style="color: var(--text-tertiary); font-size: 0.95rem; margin-bottom: 2rem;">
          Error: ${error.message}
        </p>
        <a 
          href="index.html" 
          style="display: inline-block; padding: 0.75rem 2rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 4px; font-weight: 600; transition: transform 0.2s;"
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          <i class="fas fa-home"></i> Return to Homepage
        </a>
      </div>
    `;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIALIZE ON PAGE LOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Start loading post immediately
loadPost();

console.log('🎬 FILMIXO Post Page initialized');
