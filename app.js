// App State
const state = {
    currentSource: 'dantri',
    articles: [],
    currentArticle: null
};

// RSS Feed URLs (using RSS to JSON converters)
const RSS_FEEDS = {
    // Tiếng Việt - Full content
    dantri: 'https://dantri.com.vn/rss/trang-chu.rss',
    bbc_vietnamese: 'https://www.bbc.com/vietnamese/index.xml',
    voa_vietnamese: 'https://www.voatiengviet.com/api/zgt$peqvi',
    
    // Tiếng Anh - Full content
    bbc: 'https://feeds.bbci.co.uk/news/rss.xml',
    cnn: 'http://rss.cnn.com/rss/edition_world.rss',
    nytimes: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    techcrunch: 'https://techcrunch.com/feed/',
    hackernews: 'https://hnrss.org/frontpage',
    
    // Thêm các nguồn khác có full content
    vnexpress: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    tuoitre: 'https://tuoitre.vn/rss/tin-moi-nhat.rss'
};

// Source names
const SOURCE_NAMES = {
    // Tiếng Việt
    dantri: 'Dân Trí',
    bbc_vietnamese: 'BBC Tiếng Việt',
    voa_vietnamese: 'VOA Tiếng Việt',
    vnexpress: 'VnExpress',
    tuoitre: 'Tuổi Trẻ',
    
    // Tiếng Anh
    bbc: 'BBC News',
    cnn: 'CNN',
    nytimes: 'NY Times',
    techcrunch: 'TechCrunch',
    hackernews: 'Hacker News'
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

// Open article in modal
function openArticle(index) {
    const article = state.articles[index];
    state.currentArticle = article;
    
    const timeAgo = getTimeAgo(article.pubDate);
    
    // Show article content directly from RSS (no scraping)
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
        </div>
        <div class="article-link">
            <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                📄 Xem bài gốc trên ${SOURCE_NAMES[article.source]}
            </a>
        </div>
    `;
    
    articleModal.classList.add('show');
    document.body.style.overflow = 'hidden';
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
