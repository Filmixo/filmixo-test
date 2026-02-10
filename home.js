// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 HOMEPAGE LOGIC - home.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Purpose: Fetch posts from Firestore and render card grid
// Uses: firebase-engine.js for database connection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { db, collection, getDocs, query, orderBy } from './firebase-engine.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOM ELEMENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const postsGrid = document.getElementById('postsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format Firestore timestamp to readable date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Recent';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Recent';
  }
}

/**
 * Create excerpt from full content
 */
function createExcerpt(content, maxLength = 150) {
  if (!content) return 'Read the full forensic analysis...';
  
  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) return plainText;
  
  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Calculate estimated read time
 */
function calculateReadTime(content) {
  if (!content) return '5 min';
  
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  
  return `${minutes} min read`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARD CREATION FUNCTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Create a single post card element
 */
function createPostCard(post, postId) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.onclick = () => window.location.href = `post.html?id=${postId}`;
  
  // Default fallback values
  const title = post.title || 'Untitled Analysis';
  const imageUrl = post.imageUrl || post.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%231a1a1a" width="400" height="300"/%3E%3Ctext fill="%23d4af37" font-size="24" font-family="Arial" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFILMIXO%3C/text%3E%3C/svg%3E';
  const content = post.content || '';
  const category = post.category || 'FORENSIC ANALYSIS';
  const timestamp = post.timestamp || post.createdAt || post.date;
  
  card.innerHTML = `
    <img 
      src="${imageUrl}" 
      alt="${title}" 
      class="post-card-image"
      loading="lazy"
      onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%231a1a1a%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%23d4af37%22 font-size=%2224%22 font-family=%22Arial%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EFILMIXO%3C/text%3E%3C/svg%3E'"
    >
    
    <div class="post-card-content">
      <h3 class="post-card-title">${title}</h3>
      <p class="post-card-excerpt">${createExcerpt(content)}</p>
      
      <div class="post-card-meta">
        <span class="post-category">${category}</span>
        <span style="color: var(--text-tertiary); font-size: 0.85rem;">
          <i class="far fa-calendar"></i> ${formatDate(timestamp)}
        </span>
      </div>
    </div>
  `;
  
  return card;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FETCH & RENDER POSTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Fetch posts from Firestore and populate grid
 */
async function loadPosts() {
  try {
    console.log('🔥 Fetching posts from Firestore...');
    
    // Query posts collection, ordered by timestamp (newest first)
    const postsCollection = collection(db, 'posts');
    const postsQuery = query(postsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    
    console.log(`✅ Found ${querySnapshot.size} posts`);
    
    // Hide loading spinner
    loadingSpinner.style.display = 'none';
    postsGrid.style.display = 'grid';
    
    // Check if posts exist
    if (querySnapshot.empty) {
      postsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <h2 style="color: var(--text-secondary); margin-bottom: 1rem;">
            No posts available yet
          </h2>
          <p style="color: var(--text-tertiary);">
            Check back soon for forensic cinema analysis.
          </p>
        </div>
      `;
      return;
    }
    
    // Clear grid and populate with posts
    postsGrid.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postId = doc.id;
      
      console.log(`📝 Rendering post: ${postId}`, post);
      
      const card = createPostCard(post, postId);
      postsGrid.appendChild(card);
    });
    
    console.log('✨ Posts rendered successfully!');
    
  } catch (error) {
    console.error('❌ Error loading posts:', error);
    
    // Show error message
    loadingSpinner.style.display = 'none';
    postsGrid.style.display = 'block';
    postsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-card); border-radius: var(--border-radius);">
        <h2 style="color: var(--accent-gold); margin-bottom: 1rem;">
          <i class="fas fa-exclamation-triangle"></i> Loading Error
        </h2>
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          Unable to fetch posts from database.
        </p>
        <p style="color: var(--text-tertiary); font-size: 0.9rem;">
          ${error.message}
        </p>
        <button 
          onclick="window.location.reload()" 
          style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: var(--accent-gold); color: var(--bg-primary); border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
        >
          Retry
        </button>
      </div>
    `;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INITIALIZE ON PAGE LOAD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Start loading posts immediately
loadPosts();

// Optional: Auto-refresh every 5 minutes for new posts
// setInterval(loadPosts, 5 * 60 * 1000);

console.log('🎬 FILMIXO Homepage initialized');
