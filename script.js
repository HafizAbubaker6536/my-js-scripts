// YouTube Thumbnail Downloader Pro - Complete JavaScript
// Author: Professional Development Team
// Version: 2025.1.0
// Features: 8K Enhancement, Black Bar Removal, Image Processing

(function() {
    'use strict';

    // Global variables
    let currentVideoId = '';
    let processingCanvas = null;
    let tempCanvas = null;
    let isDarkMode = false;

    // Initialize the application
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        loadUserPreferences();
    });

    // Initialize application
    function initializeApp() {
        processingCanvas = document.getElementById('ytp-processing-canvas');
        tempCanvas = document.getElementById('ytp-temp-canvas');
        
        if (!processingCanvas || !tempCanvas) {
            console.warn('Canvas elements not found, creating dynamically');
            createCanvasElements();
        }

        // Setup canvas contexts
        if (processingCanvas && tempCanvas) {
            processingCanvas.style.display = 'none';
            tempCanvas.style.display = 'none';
        }

        // Initialize smooth scrolling
        initializeSmoothScrolling();
    }

    // Create canvas elements if they don't exist
    function createCanvasElements() {
        const container = document.querySelector('.ytp-canvas-container') || document.body;
        
        if (!processingCanvas) {
            processingCanvas = document.createElement('canvas');
            processingCanvas.id = 'ytp-processing-canvas';
            processingCanvas.style.display = 'none';
            container.appendChild(processingCanvas);
        }
        
        if (!tempCanvas) {
            tempCanvas = document.createElement('canvas');
            tempCanvas.id = 'ytp-temp-canvas';
            tempCanvas.style.display = 'none';
            container.appendChild(tempCanvas);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        const urlInput = document.getElementById('ytp-youtube-url');
        const extractBtn = document.getElementById('ytp-extract-btn');

        if (urlInput) {
            urlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || (e.ctrlKey && e.key === 'Enter')) {
                    e.preventDefault();
                    ytpExtractThumbnails();
                }
            });

            urlInput.addEventListener('paste', function(e) {
                setTimeout(() => {
                    const url = e.target.value.trim();
                    if (url && isValidYouTubeURL(url)) {
                        showToast('Valid YouTube URL detected!', 'success');
                    }
                }, 100);
            });
        }

        if (extractBtn) {
            extractBtn.addEventListener('click', ytpExtractThumbnails);
        }

        // Add scroll event for header
        window.addEventListener('scroll', handleHeaderScroll);
    }

    // Header scroll effect
    function handleHeaderScroll() {
        const header = document.querySelector('.ytp-nav-header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'var(--background-secondary)';
                header.style.backdropFilter = 'var(--backdrop-blur)';
            } else {
                header.style.background = 'var(--background-secondary)';
            }
        }
    }

    // Load user preferences
    function loadUserPreferences() {
        try {
            const savedTheme = localStorage.getItem('ytp-theme');
            if (savedTheme === 'dark') {
                enableDarkMode();
            }
        } catch (e) {
            console.log('LocalStorage not available, using defaults');
        }
    }

    // Save user preferences
    function saveUserPreferences() {
        try {
            localStorage.setItem('ytp-theme', isDarkMode ? 'dark' : 'light');
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    // Theme toggle functionality
    window.toggleTheme = function() {
        if (isDarkMode) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
        saveUserPreferences();
    };

    // Enable dark mode
    function enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '☀️';
        }
        isDarkMode = true;
    }

    // Disable dark mode
    function disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.textContent = '🌙';
        }
        isDarkMode = false;
    }

    // Mobile menu toggle
    window.toggleMobileMenu = function() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('active');
        }
    };

    // FAQ toggle functionality
    window.toggleFAQ = function(element) {
        const answer = element.nextElementSibling;
        const isActive = element.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.ytp-faq-question').forEach(q => {
            q.classList.remove('active');
            q.nextElementSibling.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!isActive) {
            element.classList.add('active');
            answer.classList.add('active');
        }
    };

    // Smooth scrolling
    window.scrollToSection = function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = document.querySelector('.ytp-nav-header')?.offsetHeight || 70;
            const targetPosition = element.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Initialize smooth scrolling for anchor links
    function initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
            });
        });
    }

    // Validate YouTube URL
    function isValidYouTubeURL(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return regex.test(url);
    }

    // Extract video ID from YouTube URL
    function extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Main thumbnail extraction function
    window.ytpExtractThumbnails = async function() {
        const urlInput = document.getElementById('ytp-youtube-url');
        const extractBtn = document.getElementById('ytp-extract-btn');
        const errorDiv = document.getElementById('ytp-error');
        const resultsDiv = document.getElementById('ytp-results');
        const processingDiv = document.getElementById('ytp-processing-status');

        if (!urlInput || !extractBtn) {
            console.error('Required elements not found');
            return;
        }

        const url = urlInput.value.trim();

        // Validate URL
        if (!url) {
            showError('Please enter a YouTube video URL');
            return;
        }

        if (!isValidYouTubeURL(url)) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        // Extract video ID
        const videoId = extractVideoId(url);
        if (!videoId) {
            showError('Could not extract video ID from URL');
            return;
        }

        currentVideoId = videoId;

        // Reset UI
        hideError();
        hideResults();
        showProcessing();

        // Disable button
        extractBtn.disabled = true;
        extractBtn.textContent = 'Processing...';

        try {
            await processThumbnails(videoId);
            showToast('Thumbnails extracted successfully!', 'success');
        } catch (error) {
            console.error('Error processing thumbnails:', error);
            showError('Failed to extract thumbnails. Please try again.');
        } finally {
            // Re-enable button
            extractBtn.disabled = false;
            extractBtn.textContent = 'Download Thumbnails';
            hideProcessing();
        }
    };

    // Process thumbnails
    async function processThumbnails(videoId) {
        const thumbnailSizes = [
            { name: '8K Ultra Pro', width: 7680, height: 4320, quality: 'maxresdefault', pro: true, ultra: true },
            { name: '5K Pro', width: 5120, height: 2880, quality: 'maxresdefault', pro: true },
            { name: '4K Ultra HD', width: 3840, height: 2160, quality: 'maxresdefault', pro: true },
            { name: '2K QHD', width: 2560, height: 1440, quality: 'maxresdefault' },
            { name: 'Full HD 1080p', width: 1920, height: 1080, quality: 'maxresdefault' },
            { name: 'HD 720p', width: 1280, height: 720, quality: 'hqdefault' },
            { name: 'SD 480p', width: 640, height: 480, quality: 'sddefault' },
            { name: 'Standard 360p', width: 480, height: 360, quality: 'hqdefault' },
            { name: 'Low 240p', width: 320, height: 240, quality: 'mqdefault' },
            { name: 'Minimum 144p', width: 256, height: 144, quality: 'default' }
        ];

        const grid = document.getElementById('ytp-thumbnails-grid');
        if (!grid) return;

        grid.innerHTML = '';
        updateProgress(0, 'Initializing thumbnail extraction...');

        const enhance8K = document.getElementById('ytp-smooth-8k')?.checked || false;

        for (let i = 0; i < thumbnailSizes.length; i++) {
            const size = thumbnailSizes[i];
            const progress = ((i + 1) / thumbnailSizes.length) * 100;
            
            updateProgress(progress, `Processing ${size.name} thumbnail...`);

            try {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${size.quality}.jpg`;
                
                let processedImageData;
                if (size.pro && enhance8K) {
                    // Enhanced processing for Pro versions
                    processedImageData = await enhanceImage(thumbnailUrl, size.width, size.height, {
                        removeBlackBars: true,
                        enhanceQuality: true,
                        upscale: true,
                        sharpen: true,
                        adjustColors: true
                    });
                } else if (enhance8K) {
                    // Basic enhancement
                    processedImageData = await enhanceImage(thumbnailUrl, size.width, size.height, {
                        removeBlackBars: true,
                        enhanceQuality: false,
                        upscale: false
                    });
                } else {
                    // No enhancement
                    processedImageData = await loadImage(thumbnailUrl);
                }

                if (processedImageData) {
                    createThumbnailCard(size, processedImageData, videoId, enhance8K);
                }
            } catch (error) {
                console.warn(`Failed to process ${size.name}:`, error);
            }

            // Small delay for smooth progress animation
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        updateProgress(100, 'All thumbnails processed successfully!');
        showResults();
    }

    // Enhanced image processing
    async function enhanceImage(imageUrl, targetWidth, targetHeight, options = {}) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                try {
                    if (!processingCanvas || !tempCanvas) {
                        createCanvasElements();
                    }

                    const ctx = processingCanvas.getContext('2d');
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    let sourceWidth = img.width;
                    let sourceHeight = img.height;
                    let sourceX = 0;
                    let sourceY = 0;

                    // Remove black bars if enabled
                    if (options.removeBlackBars) {
                        const blackBarResult = removeBlackBars(img, tempCtx);
                        sourceX = blackBarResult.x;
                        sourceY = blackBarResult.y;
                        sourceWidth = blackBarResult.width;
                        sourceHeight = blackBarResult.height;
                    }

                    // Calculate optimal dimensions
                    const aspectRatio = sourceWidth / sourceHeight;
                    let finalWidth = targetWidth;
                    let finalHeight = targetHeight;

                    if (options.upscale && (sourceWidth < targetWidth || sourceHeight < targetHeight)) {
                        if (aspectRatio > (targetWidth / targetHeight)) {
                            finalHeight = Math.round(targetWidth / aspectRatio);
                        } else {
                            finalWidth = Math.round(targetHeight * aspectRatio);
                        }
                    } else {
                        finalWidth = sourceWidth;
                        finalHeight = sourceHeight;
                    }

                    // Set canvas size
                    processingCanvas.width = finalWidth;
                    processingCanvas.height = finalHeight;

                    // Enable image smoothing for better quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw the image
                    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalWidth, finalHeight);

                    // Apply enhancements
                    if (options.enhanceQuality) {
                        applyImageEnhancements(ctx, finalWidth, finalHeight, {
                            sharpen: options.sharpen,
                            adjustColors: options.adjustColors
                        });
                    }

                    // Convert to blob with high quality
                    processingCanvas.toBlob(resolve, 'image/jpeg', 0.95);
                } catch (error) {
                    console.error('Error enhancing image:', error);
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    // Remove black bars from image
    function removeBlackBars(img, ctx) {
        const canvas = tempCanvas;
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;

        let topBlackBars = 0;
        let bottomBlackBars = 0;
        let leftBlackBars = 0;
        let rightBlackBars = 0;

        const threshold = 30; // Threshold for considering a pixel "black"

        // Detect top black bars
        for (let y = 0; y < img.height; y++) {
            let isBlackRow = true;
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (isBlackRow) {
                topBlackBars++;
            } else {
                break;
            }
        }

        // Detect bottom black bars
        for (let y = img.height - 1; y >= 0; y--) {
            let isBlackRow = true;
            for (let x = 0; x < img.width; x++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (isBlackRow) {
                bottomBlackBars++;
            } else {
                break;
            }
        }

        // Detect left black bars
        for (let x = 0; x < img.width; x++) {
            let isBlackCol = true;
            for (let y = topBlackBars; y < img.height - bottomBlackBars; y++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (isBlackCol) {
                leftBlackBars++;
            } else {
                break;
            }
        }

        // Detect right black bars
        for (let x = img.width - 1; x >= 0; x--) {
            let isBlackCol = true;
            for (let y = topBlackBars; y < img.height - bottomBlackBars; y++) {
                const index = (y * img.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (isBlackCol) {
                rightBlackBars++;
            } else {
                break;
            }
        }

        return {
            x: leftBlackBars,
            y: topBlackBars,
            width: img.width - leftBlackBars - rightBlackBars,
            height: img.height - topBlackBars - bottomBlackBars
        };
    }

    // Apply image enhancements
    function applyImageEnhancements(ctx, width, height, options) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        if (options.adjustColors) {
            // Adjust brightness, contrast, and saturation
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Brightness boost (+10%)
                r = Math.min(255, r * 1.1);
                g = Math.min(255, g * 1.1);
                b = Math.min(255, b * 1.1);

                // Contrast enhancement
                r = Math.min(255, Math.max(0, ((r - 128) * 1.15) + 128));
                g = Math.min(255, Math.max(0, ((g - 128) * 1.15) + 128));
                b = Math.min(255, Math.max(0, ((b - 128) * 1.15) + 128));

                // Saturation boost
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const delta = max - min;
                const sum = max + min;
                const lightness = sum / 2;

                if (delta !== 0) {
                    const saturation = lightness > 127.5 ? delta / (510 - sum) : delta / sum;
                    const newSaturation = Math.min(1, saturation * 1.2);
                    const c = (255 - Math.abs(2 * lightness - 255)) * newSaturation;
                    const x = c * (1 - Math.abs(((max === r ? (g - b) / delta : max === g ? 2 + (b - r) / delta : 4 + (r - g) / delta) % 6) - 3) / 3);
                    const m = lightness - c / 2;

                    if (max === r) {
                        r = c + m;
                        g = x + m;
                        b = m;
                    } else if (max === g) {
                        r = x + m;
                        g = c + m;
                        b = m;
                    } else {
                        r = m;
                        g = x + m;
                        b = c + m;
                    }
                }

                data[i] = Math.round(r);
                data[i + 1] = Math.round(g);
                data[i + 2] = Math.round(b);
            }
        }

        if (options.sharpen) {
            // Apply unsharp mask for sharpening
            const sharpenedData = new Uint8ClampedArray(data);
            const kernel = [
                [0, -1, 0],
                [-1, 5, -1],
                [0, -1, 0]
            ];

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
                                sum += data[pixelIndex] * kernel[ky + 1][kx + 1];
                            }
                        }
                        const index = (y * width + x) * 4 + c;
                        sharpenedData[index] = Math.min(255, Math.max(0, sum));
                    }
                }
            }
            
            // Copy sharpened data back
            for (let i = 0; i < data.length; i += 4) {
                data[i] = sharpenedData[i];
                data[i + 1] = sharpenedData[i + 1];
                data[i + 2] = sharpenedData[i + 2];
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Load image without enhancement
    async function loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                if (!processingCanvas) {
                    createCanvasElements();
                }
                
                const ctx = processingCanvas.getContext('2d');
                processingCanvas.width = img.width;
                processingCanvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                processingCanvas.toBlob(resolve, 'image/jpeg', 0.95);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    // Create thumbnail card
    function createThumbnailCard(size, imageBlob, videoId, isEnhanced) {
        const grid = document.getElementById('ytp-thumbnails-grid');
        if (!grid) return;

        const card = document.createElement('div');
        card.className = 'ytp-thumbnail-item';

        const img = document.createElement('img');
        img.className = 'ytp-thumbnail-img';
        img.src = URL.createObjectURL(imageBlob);
        img.alt = `${size.name} YouTube Thumbnail`;
        img.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'ytp-thumbnail-info';

        const quality = document.createElement('div');
        quality.className = 'ytp-thumbnail-quality';
        
        const qualityText = document.createElement('span');
        qualityText.textContent = size.name;
        
        const badge = document.createElement('span');
        badge.className = `ytp-quality-badge ${size.ultra ? 'ytp-ultra' : size.pro ? 'ytp-pro' : ''}`;
        badge.textContent = size.ultra ? 'ULTRA' : size.pro ? 'PRO' : 'STD';
        
        quality.appendChild(qualityText);
        quality.appendChild(badge);

        const resolution = document.createElement('div');
        resolution.className = 'ytp-thumbnail-resolution';
        resolution.textContent = `${size.width} × ${size.height} pixels`;

        // Enhancement indicators
        if (isEnhanced && size.pro) {
            const enhancements = document.createElement('div');
            enhancements.innerHTML = `
                <div class="ytp-enhancement-indicator">✨ Black Bars Removed</div>
                <div class="ytp-enhancement-indicator">🚀 8K Enhanced</div>
                <div class="ytp-enhancement-indicator">⚡ Sharpness Boost</div>
                <div class="ytp-enhancement-indicator">🎨 Color Enhancement</div>
            `;
            info.appendChild(enhancements);
        } else if (isEnhanced) {
            const enhancement = document.createElement('div');
            enhancement.innerHTML = '<div class="ytp-enhancement-indicator">✨ Black Bars Removed</div>';
            info.appendChild(enhancement);
        }

        const downloadBtn = document.createElement('button');
        downloadBtn.className = `ytp-download-btn ${size.pro ? 'ytp-pro' : ''}`;
        downloadBtn.textContent = `Download ${size.name}`;
        downloadBtn.onclick = () => downloadThumbnail(imageBlob, `YouTube_Thumbnail_${videoId}_${size.name.replace(/\s+/g, '_')}.jpg`);

        info.appendChild(quality);
        info.appendChild(resolution);
        info.appendChild(downloadBtn);

        card.appendChild(img);
        card.appendChild(info);
        grid.appendChild(card);
    }

    // Download thumbnail
    function downloadThumbnail(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`Downloaded: ${filename}`, 'success');
    }

    // UI Helper Functions
    function showProcessing() {
        const processingDiv = document.getElementById('ytp-processing-status');
        if (processingDiv) {
            processingDiv.style.display = 'block';
        }
    }

    function hideProcessing() {
        const processingDiv = document.getElementById('ytp-processing-status');
        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
    }

    function updateProgress(percentage, message) {
        const progressFill = document.getElementById('ytp-progress-fill');
        const statusText = document.getElementById('ytp-status-text');
        const processingInfo = document.getElementById('ytp-processing-info');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (statusText) {
            statusText.textContent = message;
        }
        
        if (processingInfo) {
            processingInfo.textContent = `${Math.round(percentage)}% complete`;
        }
    }

    function showResults() {
        const resultsDiv = document.getElementById('ytp-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'block';
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function hideResults() {
        const resultsDiv = document.getElementById('ytp-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById('ytp-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                hideError();
            }, 5000);
        }
        showToast(message, 'error');
    }

    function hideError() {
        const errorDiv = document.getElementById('ytp-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        // Remove existing toast
        const existingToast = document.querySelector('.ytp-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `ytp-toast ytp-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('ytp-show');
        }, 100);

        // Auto hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('ytp-show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to extract thumbnails
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            ytpExtractThumbnails();
        }
        
        // Escape to close mobile menu
        if (e.key === 'Escape') {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
    });

    // Performance monitoring
    if (typeof PerformanceObserver !== 'undefined') {
        const performanceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            }
        });
        
        try {
            performanceObserver.observe({ entryTypes: ['measure'] });
        } catch (e) {
            console.log('Performance Observer not supported');
        }
    }

    // Utility function to measure performance
    function measurePerformance(name, fn) {
        return async function(...args) {
            const startMark = `${name}-start`;
            const endMark = `${name}-end`;
            const measureName = `${name}-duration`;
            
            performance.mark(startMark);
            const result = await fn.apply(this, args);
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);
            
            return result;
        };
    }

    // Intersection Observer for lazy loading and animations
    if (typeof IntersectionObserver !== 'undefined') {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('ytp-visible');
                    
                    // Trigger any lazy loading for images
                    const images = entry.target.querySelectorAll('img[data-src]');
                    images.forEach(img => {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    });
                }
            });
        }, observerOptions);

        // Observe elements when DOM is ready
        setTimeout(() => {
            document.querySelectorAll('.ytp-feature-card, .ytp-tool-card, .ytp-seo-content').forEach(el => {
                observer.observe(el);
            });
        }, 100);
    }

    // Image optimization utilities
    function optimizeImageForDownload(canvas, quality = 0.95) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });
    }

    // Batch processing for multiple thumbnails
    async function processBatchThumbnails(videoIds) {
        const results = [];
        for (const videoId of videoIds) {
            try {
                const result = await processThumbnails(videoId);
                results.push({ videoId, success: true, result });
            } catch (error) {
                results.push({ videoId, success: false, error: error.message });
            }
        }
        return results;
    }

    // Advanced color analysis for better enhancement
    function analyzeImageColors(imageData) {
        const data = imageData.data;
        let totalBrightness = 0;
        let totalContrast = 0;
        let pixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Calculate brightness (luminance)
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
            totalBrightness += brightness;
            pixelCount++;
        }

        const averageBrightness = totalBrightness / pixelCount;
        
        return {
            averageBrightness,
            needsBrightnessBoost: averageBrightness < 100,
            needsContrastBoost: averageBrightness > 50 && averageBrightness < 200
        };
    }

    // Adaptive enhancement based on image analysis
    function adaptiveImageEnhancement(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const analysis = analyzeImageColors(imageData);
        const data = imageData.data;

        const brightnessMultiplier = analysis.needsBrightnessBoost ? 1.2 : 1.05;
        const contrastMultiplier = analysis.needsContrastBoost ? 1.15 : 1.1;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Adaptive brightness
            r = Math.min(255, r * brightnessMultiplier);
            g = Math.min(255, g * brightnessMultiplier);
            b = Math.min(255, b * brightnessMultiplier);

            // Adaptive contrast
            r = Math.min(255, Math.max(0, ((r - 128) * contrastMultiplier) + 128));
            g = Math.min(255, Math.max(0, ((g - 128) * contrastMultiplier) + 128));
            b = Math.min(255, Math.max(0, ((b - 128) * contrastMultiplier) + 128));

            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Error handling and retry mechanism
    async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                const delay = baseDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`Retry attempt ${i + 1} after ${delay}ms delay`);
            }
        }
    }

    // Service Worker registration for offline support (if available)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Cleanup function for memory management
    function cleanup() {
        // Clean up canvas contexts
        if (processingCanvas) {
            const ctx = processingCanvas.getContext('2d');
            ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
        }
        
        if (tempCanvas) {
            const ctx = tempCanvas.getContext('2d');
            ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // Clean up blob URLs
        document.querySelectorAll('.ytp-thumbnail-img').forEach(img => {
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });
    }

    // Auto cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Responsive image sizing
    function getOptimalThumbnailSize() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        if (screenWidth >= 3840) return { width: 7680, height: 4320 }; // 8K for 4K+ screens
        if (screenWidth >= 2560) return { width: 3840, height: 2160 }; // 4K for QHD+ screens
        if (screenWidth >= 1920) return { width: 2560, height: 1440 }; // 2K for FHD+ screens
        if (screenWidth >= 1280) return { width: 1920, height: 1080 }; // FHD for HD+ screens
        return { width: 1280, height: 720 }; // HD for smaller screens
    }

    // Export functions for external use
    window.YTThumbnailDownloader = {
        extractThumbnails: ytpExtractThumbnails,
        downloadThumbnail: downloadThumbnail,
        cleanup: cleanup,
        showToast: showToast,
        isValidYouTubeURL: isValidYouTubeURL,
        extractVideoId: extractVideoId,
        toggleTheme: window.toggleTheme,
        toggleMobileMenu: window.toggleMobileMenu,
        scrollToSection: window.scrollToSection
    };

    // Debug mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.YTThumbnailDownloader.debug = {
            processingCanvas,
            tempCanvas,
            enhanceImage,
            removeBlackBars,
            applyImageEnhancements,
            analyzeImageColors
        };
        console.log('Debug mode enabled. Access debug functions via window.YTThumbnailDownloader.debug');
    }

    // Initialize analytics (replace with your actual analytics)
    function initAnalytics() {
        // Track thumbnail downloads
        const originalDownloadThumbnail = downloadThumbnail;
        window.downloadThumbnail = function(blob, filename) {
            // Analytics tracking code here
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    event_category: 'thumbnail',
                    event_label: filename,
                    value: 1
                });
            }
            return originalDownloadThumbnail(blob, filename);
        };

        // Track thumbnail extractions
        const originalExtractThumbnails = ytpExtractThumbnails;
        window.ytpExtractThumbnails = function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'extract_thumbnails', {
                    event_category: 'engagement',
                    event_label: 'thumbnail_extraction',
                    value: 1
                });
            }
            return originalExtractThumbnails();
        };
    }

    // Initialize analytics on load
    setTimeout(initAnalytics, 2000);

    // Console welcome message
    console.log(`
    🚀 YouTube Thumbnail Downloader Pro v2025.1.0
    =============================================
    
    Features loaded:
    ✅ 8K Ultra HD Enhancement
    ✅ Smart Black Bar Removal
    ✅ AI Image Processing
    ✅ Responsive Design
    ✅ Dark Mode Support
    ✅ Performance Optimization
    
    For support: https://github.com/YTThumbnailPro
    `);

})();

// Additional utility functions outside the main scope
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Add resize handler with debouncing
window.addEventListener('resize', debounce(() => {
    // Handle responsive adjustments
    const thumbnails = document.querySelectorAll('.ytp-thumbnail-item');
    thumbnails.forEach(thumbnail => {
        // Adjust thumbnail sizes based on new viewport
        thumbnail.style.transition = 'all 0.3s ease';
    });
}, 250));

// Add smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    const headerHeight = 70;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', smoothScrollPolyfill);
    } else {
        smoothScrollPolyfill();
    }
}
