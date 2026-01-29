// App State
const state = {
    currentSource: 'vnexpress',
    articles: [],
    currentArticle: null
};

// RSS Feed URLs (using RSS to JSON converters)
const RSS_FEEDS = {
    vnexpress: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    tuoitre: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
    thanhnien: 'https://thanhnien.vn/rss/home.rss'
};

// Source names
const SOURCE_NAMES = {
    vnexpress: 'VnExpress',
    tuoitre: 'Tuổi Trẻ',
    thanhnien: 'Thanh Niên'
};

// DOM Elements
const loading = document.getElementById('loading');
const newsList = document.getElementById('newsList');
const articleModal = document.getElementById('articleModal');
const articleContent = document.getElementById('articleContent');
const refreshBtn = document.getElementById('refreshBtn');
const closeModalBtn = document.getElementById('closeModal');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadNews();
});

// Event Listeners
function initializeEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const source = e.target.dataset.source;
            switchSource(source);
        });
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
        loadNews();
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        closeArticle();
    });
}

// Switch news source
function switchSource(source) {
    if (state.currentSource === source) return;
    
    state.currentSource = source;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.source === source);
    });
    
    loadNews();
}

// Load news from RSS feed
async function loadNews() {
    showLoading(true);
    newsList.innerHTML = '';
    
    try {
        const rssUrl = RSS_FEEDS[state.currentSource];
        
        // Use rss2json API to convert RSS to JSON
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('Không thể tải tin tức');
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error('Lỗi khi xử lý RSS feed');
        }
        
        state.articles = data.items.map(item => ({
            title: stripHtml(item.title),
            description: stripHtml(item.description || item.content || ''),
            link: item.link,
            pubDate: item.pubDate,
            content: stripHtml(item.content || item.description || ''),
            source: state.currentSource
        }));
        
        displayNews();
        
    } catch (error) {
        console.error('Error loading news:', error);
        showError('Không thể tải tin tức. Vui lòng thử lại sau.');
    } finally {
        showLoading(false);
    }
}

// Display news list
function displayNews() {
    newsList.innerHTML = '';
    
    if (state.articles.length === 0) {
        newsList.innerHTML = '<div class="error-message">Không có tin tức nào</div>';
        return;
    }
    
    state.articles.forEach((article, index) => {
        const newsItem = createNewsItem(article, index);
        newsList.appendChild(newsItem);
    });
}

// Create news item element
function createNewsItem(article, index) {
    const div = document.createElement('div');
    div.className = 'news-item';
    
    const timeAgo = getTimeAgo(article.pubDate);
    
    div.innerHTML = `
        <div class="news-title">${article.title}</div>
        <div class="news-description">${truncateText(article.description, 150)}</div>
        <div class="news-meta">
            <span class="news-source">${SOURCE_NAMES[article.source]}</span>
            <span class="news-time">${timeAgo}</span>
        </div>
    `;
    
    div.addEventListener('click', () => {
        openArticle(index);
    });
    
    return div;
}

// Fetch full article content using a CORS proxy
async function fetchFullArticle(url, source) {
    // Use AllOrigins CORS proxy to fetch the full page
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error('Failed to fetch article');
    }
    
    const html = await response.text();
    
    // Parse HTML and extract article content based on source
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    let articleBody = '';
    
    // Different selectors for different news sources
    switch(source) {
        case 'vnexpress':
            // VnExpress article content
            const vnexpressContent = doc.querySelector('.fck_detail') || 
                                    doc.querySelector('article.fck_detail') ||
                                    doc.querySelector('.content_detail');
            if (vnexpressContent) {
                // Remove images and unwanted elements
                vnexpressContent.querySelectorAll('img, figure, table.tplCaption, .box_brief_info, .lazier').forEach(el => el.remove());
                articleBody = vnexpressContent.innerHTML;
            }
            break;
            
        case 'tuoitre':
            // Tuoi Tre article content
            const tuoitreContent = doc.querySelector('#main-detail-body') || 
                                  doc.querySelector('.detail-content') ||
                                  doc.querySelector('div[data-role="content"]');
            if (tuoitreContent) {
                tuoitreContent.querySelectorAll('img, figure, .VCSortableInPreviewMode, .box-category').forEach(el => el.remove());
                articleBody = tuoitreContent.innerHTML;
            }
            break;
            
        case 'thanhnien':
            // Thanh Nien article content
            const thanhnienContent = doc.querySelector('#main-detail-body') || 
                                    doc.querySelector('.detail-content') ||
                                    doc.querySelector('div[id*="contentbody"]');
            if (thanhnienContent) {
                thanhnienContent.querySelectorAll('img, figure, .box-rel-news').forEach(el => el.remove());
                articleBody = thanhnienContent.innerHTML;
            }
            break;
    }
    
    if (!articleBody) {
        throw new Error('Could not extract article content');
    }
    
    // Clean up the HTML
    articleBody = cleanArticleHtml(articleBody);
    
    return articleBody || '<p>Không thể tải nội dung. Vui lòng xem bài gốc.</p>';
}

// Clean and format article HTML
function cleanArticleHtml(html) {
    // Remove all image tags
    html = html.replace(/<img[^>]*>/gi, '');
    html = html.replace(/<figure[^>]*>.*?<\/figure>/gi, '');
    html = html.replace(/<picture[^>]*>.*?<\/picture>/gi, '');
    
    // Remove inline styles
    html = html.replace(/style="[^"]*"/gi, '');
    
    // Remove script and style tags
    html = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>.*?<\/style>/gi, '');
    
    // Remove empty paragraphs
    html = html.replace(/<p>\s*<\/p>/gi, '');
    
    // Remove data attributes
    html = html.replace(/data-[a-z-]+="[^"]*"/gi, '');
    
    // Clean up whitespace
    html = html.replace(/\s+/g, ' ');
    
    return html.trim();
}

// Open article in modal
async function openArticle(index) {
    const article = state.articles[index];
    state.currentArticle = article;
    
    const timeAgo = getTimeAgo(article.pubDate);
    
    // Show loading state
    articleContent.innerHTML = `
        <div class="article-header">
            <h1 class="article-title">${article.title}</h1>
            <div class="article-meta">
                <span class="article-source">${SOURCE_NAMES[article.source]}</span>
                <span class="article-time">${timeAgo}</span>
            </div>
        </div>
        <div class="article-body">
            <div style="text-align: center; padding: 40px; color: #999;">
                Đang tải nội dung đầy đủ...
            </div>
        </div>
    `;
    
    articleModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Try to fetch full content
    try {
        const fullContent = await fetchFullArticle(article.link, article.source);
        
        articleContent.innerHTML = `
            <div class="article-header">
                <h1 class="article-title">${article.title}</h1>
                <div class="article-meta">
                    <span class="article-source">${SOURCE_NAMES[article.source]}</span>
                    <span class="article-time">${timeAgo}</span>
                </div>
            </div>
            <div class="article-body">
                ${fullContent}
            </div>
            <div class="article-link">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                    📄 Xem bài gốc trên ${SOURCE_NAMES[article.source]}
                </a>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching full article:', error);
        
        // Fallback to RSS content
        articleContent.innerHTML = `
            <div class="article-header">
                <h1 class="article-title">${article.title}</h1>
                <div class="article-meta">
                    <span class="article-source">${SOURCE_NAMES[article.source]}</span>
                    <span class="article-time">${timeAgo}</span>
                </div>
            </div>
            <div class="article-body">
                ${formatArticleContent(article.content)}
                <div style="background: #2a2a2a; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 3px solid #00a8e1;">
                    ⚠️ Không thể tải toàn bộ nội dung. Vui lòng nhấn vào link bên dưới để xem bài đầy đủ.
                </div>
            </div>
            <div class="article-link">
                <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                    📄 Xem bài gốc trên ${SOURCE_NAMES[article.source]}
                </a>
            </div>
        `;
    }
}

// Close article modal
function closeArticle() {
    articleModal.classList.remove('show');
    document.body.style.overflow = '';
    state.currentArticle = null;
}

// Format article content
function formatArticleContent(content) {
    if (!content) return '<p>Nội dung không có sẵn. Vui lòng nhấn vào link bên dưới để xem bài gốc.</p>';
    
    // Split into paragraphs
    let formatted = content.replace(/\n\n+/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';
    
    return formatted;
}

// Utility Functions
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
        'năm': 31536000,
        'tháng': 2592000,
        'tuần': 604800,
        'ngày': 86400,
        'giờ': 3600,
        'phút': 60
    };
    
    for (let [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return `${interval} ${name} trước`;
        }
    }
    
    return 'Vừa xong';
}

function showLoading(show) {
    loading.classList.toggle('show', show);
}

function showError(message) {
    newsList.innerHTML = `<div class="error-message">${message}</div>`;
}

// Handle back button on modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && articleModal.classList.contains('show')) {
        closeArticle();
    }
});
