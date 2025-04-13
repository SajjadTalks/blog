// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all site features
    initThemeToggle();
    initCodeBlockFeatures();
    initSearchFunctionality();
    initScrollToTopButton();
    initMobileNavigation();
    enhanceExternalLinks();
});

/**
 * Theme Toggle System
 * Handles dark/light mode preferences with system detection
 */
function initThemeToggle() {
    const themeToggleButton = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Check for saved preference or use system preference
    const userPreference = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = userPreference || (systemPrefersDark ? 'dark' : 'light');
    
    // Apply theme on initial load
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
    } else {
        htmlElement.classList.remove('dark-mode');
    }

    // Handle theme toggle click
    if (themeToggleButton) {
        themeToggleButton.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`);
        
        themeToggleButton.addEventListener('click', () => {
            htmlElement.classList.toggle('dark-mode');
            const isDarkMode = htmlElement.classList.contains('dark-mode');
            
            // Update button accessibility label
            themeToggleButton.setAttribute('aria-label', `Switch to ${isDarkMode ? 'light' : 'dark'} theme`);
            
            // Save preference
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Optional: Animate transition with subtle flash effect
            htmlElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        });
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Only auto-switch if user hasn't explicitly set a preference
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                htmlElement.classList.add('dark-mode');
            } else {
                htmlElement.classList.remove('dark-mode');
            }
        }
    });
}

/**
 * Code Block Features
 * Adds copy functionality and language detection to code blocks
 */
function initCodeBlockFeatures() {
    const codeBlocks = document.querySelectorAll('div.highlight');
    
    codeBlocks.forEach(block => {
        enhanceCodeBlock(block);
    });
    
    function enhanceCodeBlock(block) {
        const preElement = block.querySelector('pre');
        if (!preElement) return;
        
        // Try to detect language from class
        const codeElement = preElement.querySelector('code');
        if (codeElement && codeElement.className) {
            const langMatch = codeElement.className.match(/language-(\w+)/);
            if (langMatch && langMatch[1]) {
                block.setAttribute('data-language', langMatch[1]);
            }
        }
        
        // Add copy button
        addCopyButton(block, preElement);
        
        // Add line numbers if desired
        // addLineNumbers(preElement);
    }
    
    function addCopyButton(block, preElement) {
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.textContent = 'Copy';
        copyButton.setAttribute('aria-label', 'Copy code to clipboard');
        
        block.appendChild(copyButton);
        
        copyButton.addEventListener('click', async () => {
            try {
                // Get text, normalize whitespace
                const codeText = preElement.innerText.trim();
                
                // Use Clipboard API
                await navigator.clipboard.writeText(codeText);
                
                // Visual feedback
                copyButton.textContent = 'Copied! ✓';
                copyButton.classList.add('copied');
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                console.error('Failed to copy code:', err);
                
                // Fallback method for older browsers
                try {
                    const textArea = document.createElement('textarea');
                    textArea.value = preElement.innerText;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    copyButton.textContent = 'Copied! ✓';
                    copyButton.classList.add('copied');
                } catch (e) {
                    copyButton.textContent = 'Error';
                }
                
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000);
            }
        });
    }
    
    // Optional: Add line numbers functionality
    function addLineNumbers(preElement) {
        const codeLines = preElement.textContent.split('\n');
        preElement.innerHTML = '';
        
        const lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.className = 'line-numbers-rows';
        
        codeLines.forEach((line, i) => {
            const lineSpan = document.createElement('span');
            lineSpan.className = 'code-line';
            lineSpan.textContent = line;
            
            const lineNumberSpan = document.createElement('span');
            lineNumberSpan.textContent = i + 1;
            
            lineNumbersWrapper.appendChild(lineNumberSpan);
            preElement.appendChild(lineSpan);
        });
        
        preElement.appendChild(lineNumbersWrapper);
    }
}

/**
 * Search Functionality
 * Provides live search with debounce and keyboard navigation
 */
function initSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    
    if (!searchInput || !searchResultsContainer) return;
    
    let searchIndex = [];
    let searchTimeout = null;
    
    // Debounce function to prevent excessive searching
    function debounce(func, delay) {
        return function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                func.apply(this, arguments);
            }, delay);
        };
    }
    
    // Function to fetch the search index
    async function fetchSearchIndex() {
        try {
            const response = await fetch('/blog/search_index.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            searchIndex = await response.json();
            // Add event listener once data is loaded
            searchInput.addEventListener('input', debounce(handleSearchInput, 300));
        } catch (error) {
            console.error("Failed to load search index:", error);
            searchResultsContainer.innerHTML = '<div class="no-results">Search is currently unavailable.</div>';
            searchResultsContainer.style.display = 'block';
            
            // Try again in 10 seconds - may be a temporary network issue
            setTimeout(fetchSearchIndex, 10000);
        }
    }
    
    // Handle search input
    function handleSearchInput(event) {
        const query = event.target.value.trim().toLowerCase();
        
        // Clear results if query is empty
        if (!query) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none';
            return;
        }
        
        // Perform search
        const results = searchIndex.filter(post => {
            // Split query into words for better matching
            const queryTerms = query.split(/\s+/);
            
            return queryTerms.every(term => 
                post.title.toLowerCase().includes(term) || 
                (post.summary && post.summary.toLowerCase().includes(term)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
            );
        });
        
        // Sort results by relevance (title matches first)
        results.sort((a, b) => {
            const aInTitle = a.title.toLowerCase().includes(query) ? 1 : 0;
            const bInTitle = b.title.toLowerCase().includes(query) ? 1 : 0;
            return bInTitle - aInTitle; // Reverse to put title matches first
        });
        
        // Generate results HTML
        if (results.length > 0) {
            const maxResults = 8; // Limit number of results shown
            const displayResults = results.slice(0, maxResults);
            
            const resultsHtml = displayResults.map(post => {
                // Highlight matching terms
                let title = highlightMatches(post.title, query);
                let summary = post.summary ? highlightMatches(post.summary, query) : '';
                
                return `
                    <li>
                        <a href="${post.url}" aria-label="View post: ${post.title}">
                            <span class="title">${title}</span>
                            ${summary ? `<span class="summary">${summary}</span>` : ''}
                        </a>
                    </li>
                `;
            }).join('');
            
            searchResultsContainer.innerHTML = `
                <ul role="listbox">${resultsHtml}</ul>
                ${results.length > maxResults ? 
                  `<div class="more-results">+ ${results.length - maxResults} more results</div>` : ''}
            `;
        } else {
            searchResultsContainer.innerHTML = `
                <div class="no-results">No posts found for "${query}"</div>
            `;
        }
        
        searchResultsContainer.style.display = 'block';
    }
    
    // Highlight matching terms in search results
    function highlightMatches(text, query) {
        // Escape special regex characters in the query
        const safeQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    // Add keyboard navigation for search results
    searchInput.addEventListener('keydown', (event) => {
        const resultLinks = searchResultsContainer.querySelectorAll('li a');
        
        if (resultLinks.length > 0) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                resultLinks[0].focus();
            } else if (event.key === 'Enter' && resultLinks.length === 1) {
                event.preventDefault();
                resultLinks[0].click();
            }
        }
    });
    
    // Add keyboard navigation within results list
    searchResultsContainer.addEventListener('keydown', (event) => {
        const resultLinks = Array.from(searchResultsContainer.querySelectorAll('li a'));
        const currentIndex = resultLinks.findIndex(link => document.activeElement === link);
        
        if (currentIndex >= 0) {
            if (event.key === 'ArrowDown' && currentIndex < resultLinks.length - 1) {
                event.preventDefault();
                resultLinks[currentIndex + 1].focus();
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (currentIndex === 0) {
                    searchInput.focus();
                } else {
                    resultLinks[currentIndex - 1].focus();
                }
            }
        }
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', (event) => {
        if (!searchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
            searchResultsContainer.style.display = 'none';
        }
    });
    
    // Initialize search functionality
    fetchSearchIndex();
}

/**
 * Scroll to Top Button
 * Appears when scrolling down, smoothly returns to top
 */
function initScrollToTopButton() {
    // Create the button dynamically
    const scrollButton = document.createElement('button');
    scrollButton.className = 'scroll-to-top';
    scrollButton.innerHTML = '↑';
    scrollButton.setAttribute('aria-label', 'Scroll to top');
    scrollButton.style.display = 'none';
    
    // Add to document
    document.body.appendChild(scrollButton);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    });
    
    // Scroll to top with smooth animation
    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Mobile Navigation
 * Handles responsive menu toggle for smaller screens
 */
function initMobileNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!menuToggle || !mainNav) return;
    
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        
        // Update aria-expanded state
        const isExpanded = mainNav.classList.contains('active');
        menuToggle.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
            mainNav.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * External Link Enhancement
 * Adds indicator and appropriate attributes to external links
 */
function enhanceExternalLinks() {
    const contentLinks = document.querySelectorAll('.post-content a, .page-content a');
    const currentDomain = window.location.hostname;
    
    contentLinks.forEach(link => {
        if (link.hostname !== currentDomain && !link.hostname.includes('localhost')) {
            // Add appropriate attributes for external links
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            
            // Add visual indicator for external links
            if (!link.classList.contains('no-external-icon')) {
                link.classList.add('external-link');
                
                // Optionally add an icon
                // const icon = document.createElement('span');
                // icon.innerHTML = '↗';
                // icon.className = 'external-link-icon';
                // link.appendChild(icon);
            }
        }
    });
}

/**
 * Content Lazy Loading (Optional)
 * Improves performance by deferring non-critical elements
 */
function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        // Use native lazy loading if supported
        const lazyImages = document.querySelectorAll('img.lazy');
        lazyImages.forEach(img => {
            img.loading = 'lazy';
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }
        });
    } else {
        // Fallback to Intersection Observer
        const lazyImages = document.querySelectorAll('img.lazy');
        
        if (lazyImages.length > 0 && 'IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
}

// Additional helper functions
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Function to handle scroll performance
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}
