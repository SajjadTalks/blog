// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Dark Mode Toggle Functionality
     */
    const themeToggleButton = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const htmlElement = document.documentElement; // Target <html> element

    // Apply the saved or detected theme on initial load
    if (currentTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
    } else {
        htmlElement.classList.remove('dark-mode'); // Ensure light mode if not dark
    }

    // Add event listener for the toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            htmlElement.classList.toggle('dark-mode');

            // Save the new theme preference to localStorage
            let theme = 'light';
            if (htmlElement.classList.contains('dark-mode')) {
                theme = 'dark';
            }
            localStorage.setItem('theme', theme);
        });
    } else {
        console.warn('Theme toggle button not found.');
    }


    /**
     * Code Block Copy Button Functionality
     */
    const codeBlocks = document.querySelectorAll('div.highlight'); // Target the Pygments wrapper div

    codeBlocks.forEach(block => {
        const codeElement = block.querySelector('pre'); // Get the <pre> element
        if (!codeElement) return; // Skip if no <pre> found

        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.textContent = 'Copy';
        block.appendChild(copyButton); // Add button to the div.highlight

        copyButton.addEventListener('click', async () => {
            try {
                // Use Clipboard API to copy text
                await navigator.clipboard.writeText(codeElement.innerText);

                // Provide feedback
                copyButton.textContent = 'Copied!';
                copyButton.classList.add('copied');

                // Reset button text after a short delay
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                }, 2000); // Reset after 2 seconds

            } catch (err) {
                console.error('Failed to copy code: ', err);
                copyButton.textContent = 'Error';
                 setTimeout(() => { // Reset even on error
                    copyButton.textContent = 'Copy';
                 }, 2000);
            }
        });
    });


    /**
     * Live Search Functionality
     */
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    let searchIndex = []; // To store the fetched search data

    // Function to fetch the search index
    async function fetchSearchIndex() {
        try {
            // Adjust the path based on where search_index.json is served from
            // If SITE_BASE_URL is used, include it if necessary. Usually relative works.
            const response = await fetch('search_index.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            searchIndex = await response.json();
            // console.log('Search index loaded:', searchIndex); // Debugging
        } catch (error) {
            console.error("Could not fetch search index:", error);
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = '<div class="no-results">Search is currently unavailable.</div>';
                searchResultsContainer.style.display = 'block'; // Show error
            }
        }
    }

    // Function to perform search and display results
    function performSearch(query) {
        if (!searchResultsContainer) return; // Exit if container not found

        const normalizedQuery = query.trim().toLowerCase();

        // Clear results if query is empty
        if (!normalizedQuery) {
            searchResultsContainer.innerHTML = '';
            searchResultsContainer.style.display = 'none'; // Hide container
            return;
        }

        // Filter the index
        const results = searchIndex.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(normalizedQuery);
            const summaryMatch = post.summary ? post.summary.toLowerCase().includes(normalizedQuery) : false;
            // Add more fields to search if needed (e.g., tags)
            return titleMatch || summaryMatch;
        });

        // Generate HTML for results
        if (results.length > 0) {
            const resultsHtml = results.map(post => `
                <li>
                    <a href="${post.url}">
                        <span class="title">${post.title}</span>
                        ${post.summary ? `<span class="summary">${post.summary}</span>` : ''}
                    </a>
                </li>
            `).join('');
            searchResultsContainer.innerHTML = `<ul>${resultsHtml}</ul>`;
        } else {
            searchResultsContainer.innerHTML = '<div class="no-results">No posts found.</div>';
        }

        searchResultsContainer.style.display = 'block'; // Show results container
    }

    // Attach event listener to search input
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            performSearch(event.target.value);
        });

        // Optional: Hide results when clicking outside
        document.addEventListener('click', (event) => {
             if (searchResultsContainer && !searchInput.contains(event.target) && !searchResultsContainer.contains(event.target)) {
                 searchResultsContainer.style.display = 'none';
             }
        });

        // Fetch the index when the page loads
        fetchSearchIndex();

    } else {
         console.warn('Search input not found.');
    }

}); // End DOMContentLoaded
