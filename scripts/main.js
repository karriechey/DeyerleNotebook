// Create a configuration object
const config = {
    scrollTimings: {
      headerHide: 500,    // ms to wait before hiding header after scroll stops
      headerShow: 1500    // ms for header show animation duration
    },
    thresholds: {
      scrollTop: 100,     // px scrolled before header hides
      mouseProximity: 20  // px from top to trigger header show on mousemove
    }
  };
  
  // Use requestAnimationFrame for scroll handling
  let ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        // Your scroll handling code here
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true }); // Add passive flag for better performance
  
  // Implement debouncing for frequently triggered events
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Use the debounce function for search input
  searchInput.addEventListener('keyup', debounce(function(event) {
    if (event.key === 'Enter') {
      performSearch();
    }
  }, 300));






// Function to parse text file content
function parseTextFile(content) {
    // Create an empty array to store page data
    const pages = [];
    // Regular expression to match page markers in the text
    const regex = /=== \*\*Page: (\d+) of (\d+)\*\*/g;
    let totalPages = 0;
    
    // First, extract the filename if present
    let filename = "Unknown Notebook";
    const filenameMatch = content.match(/=== \*\*Filename: (.*?)\*\*/);
    if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
    }
    
    // Split the content by page markers
    const parts = content.split(regex);
    
    // The first element is anything before the first marker
    parts.shift();
    
    // Process the rest of the parts
    for (let i = 0; i < parts.length; i += 3) {
        if (parts[i] === undefined) continue; // Skip if undefined
        
        const pageNumber = parseInt(parts[i]);
        totalPages = parseInt(parts[i + 1] || 0);
        const pageContent = parts[i + 2] ? parts[i + 2].trim() : "";
        
        // Extract the entry number from the first line
        const lines = pageContent.split('\n');
        const firstLine = lines[0] ? lines[0].trim() : "";
        const entryNumberMatch = firstLine.match(/^(\d+)/);
        let entryNumber = "";
        
        if (entryNumberMatch) {
            entryNumber = entryNumberMatch[1];
        }
        
        // Add page to pages array
        pages.push({
            pageNumber: pageNumber,
            entryNumber: entryNumber,
            content: pageContent
        });
    }
    
    return { pages, totalPages, filename };
}

// Store notebook data globally
const notebookData = {
    A: null,
    B: null,
    C: null,
    D: null,
    E: null
};

// Current active notebook
let currentNotebook = "A";

/**
 * Loads a notebook's text content from the server
 * @param {string} notebookId - The ID of the notebook to load
 * @returns {Promise<string|null>} - The text content or null if failed
 */
async function loadNotebookContent(notebookId) {
    try {
        console.log(`Fetching notebook_${notebookId}.txt...`);
        const response = await fetch(`data/notebook_${notebookId}.txt`);
        
        if (!response.ok) {
            console.error(`HTTP error ${response.status}: ${response.statusText}`);
            throw new Error(`Failed to load notebook ${notebookId}`);
        }
        
        const text = await response.text();
        console.log(`Successfully loaded notebook ${notebookId} (${text.length} bytes)`);
        return text;
    } catch (error) {
        console.error(`Error loading notebook ${notebookId}:`, error);
        // Don't alert, just log the error - alerts can be annoying to users
        return null;
    }
}

/**
 * Constructs the image path for a specific notebook page
 * @param {string} notebookId - The ID of the notebook
 * @param {number} pageNumber - The page number
 * @returns {string} - The complete image path
 */
function getImagePath(notebookId, pageNumber) {
    // Convert the page number to a string and add leading zeros to make it 4 digits
    const paddedNumber = pageNumber.toString().padStart(4, '0');
    
    // Use the correct file naming format from the GitHub repository
    const path = `https://raw.githubusercontent.com/karriechey/DeyerleNotebook/main/images/notebook_${notebookId}/Notebook%20${notebookId}_page-${paddedNumber}.jpg`;
    
    // Log the image path for debugging purposes
    console.log(`Loading image: ${path}`);
    
    return path;
}

/**
 * Creates an image element with robust error handling
 * @param {string} notebookId - The ID of the notebook
 * @param {number} pageNumber - The page number
 * @returns {HTMLImageElement} - The created image element
 */
function createImageElement(notebookId, pageNumber) {
    // Create the image element
    const img = document.createElement('img');
    
    // Enable lazy loading for better performance
    img.loading = 'lazy';
    
    // Format page number with leading zeros
    const paddedNumber = pageNumber.toString().padStart(4, '0');
    
    // Set the image source to the GitHub raw content URL with the correct format
    img.src = getImagePath(notebookId, pageNumber);
    
    // Set descriptive alt text for accessibility
    img.alt = `Page ${pageNumber}`;
    
    // Set a base64 encoded placeholder image that will display when error occurs
    // This is a tiny gray square image encoded as base64
    const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH4QIFBCg7lhEQ2gAAAAlwSFlzAAAOwwAADsMBx2+oZAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAABsSURBVHja7c0BDQAAAMKg909tDwcUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAuyoAAAEGutPR7QAAAABJRU5ErkJggg==';
    
    // Store notebook ID and padded page number in data attributes for use in error handler
    img.dataset.notebookId = notebookId;
    img.dataset.paddedNumber = paddedNumber;
    
    // Handle image loading errors with multiple fallback options
    img.onerror = function() {
        console.error(`Failed to load image: ${this.src}`);
        
        // Get the stored notebook ID and padded number from data attributes
        const notebookId = this.dataset.notebookId;
        const paddedNumber = this.dataset.paddedNumber;
        
        // Try GitHub Pages URL format as a fallback
        if (this.src.includes('raw.githubusercontent.com')) {
            console.log('Trying GitHub Pages format...');
            this.src = `https://karriechey.github.io/DeyerleNotebook/images/notebook_${notebookId}/Notebook%20${notebookId}_page-${paddedNumber}.jpg`;
        }
        // If GitHub Pages format failed, try a relative path
        else if (this.src.includes('github.io')) {
            console.log('Trying relative path format...');
            this.src = `images/notebook_${notebookId}/Notebook ${notebookId}_page-${paddedNumber}.jpg`;
        }
        // If all attempts failed, use the placeholder
        else if (!this.src.startsWith('data:image/')) {
            console.log('All image loading attempts failed, using placeholder...');
            this.src = placeholderImage;
            this.alt = 'Image not available';
            this.classList.add('placeholder-image');
        }
    };
    
    return img;
}

/**
 * Loads and displays a specific notebook
 * @param {string} notebookId - The ID of the notebook to load
 */
async function loadNotebook(notebookId) {
    console.log(`Loading notebook ${notebookId}...`);
    
    const container = document.getElementById('notebookContainer');
    
    // Check if container exists before proceeding
    if (!container) {
        console.error('Error: notebookContainer element not found');
        return;
    }
    
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Check if loadingMessage exists before trying to use it
    if (!loadingMessage) {
        console.error('Error: loadingMessage element not found');
        // Create a temporary loading message if the original is missing
        const tempLoadingMsg = document.createElement('div');
        tempLoadingMsg.className = 'loading';
        tempLoadingMsg.textContent = 'Loading...';
        
        // Clear existing content
        container.innerHTML = '';
        container.appendChild(tempLoadingMsg);
    } else {
        // Clear existing content
        container.innerHTML = '';
        container.appendChild(loadingMessage);
        loadingMessage.style.display = 'block';
    }
    
    // Update the notebook title
    const notebookTitle = document.getElementById('notebookTitle');
    if (notebookTitle) {
        notebookTitle.textContent = `Deyerle Meteorite Notebook ${notebookId}`;
    }
    
    // Set the current notebook
    currentNotebook = notebookId;
    
    // Update active tab
    document.querySelectorAll('.notebook-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-notebook') === notebookId) {
            tab.classList.add('active');
        }
    });
    
    // Check if data is already loaded
    if (!notebookData[notebookId]) {
        // Load the notebook content
        const textContent = await loadNotebookContent(notebookId);
        if (textContent) {
            notebookData[notebookId] = parseTextFile(textContent);
        } else {
            container.innerHTML = '<div class="loading">Error loading notebook data. Please try again.</div>';
            return;
        }
    }
    
    // Render the notebook
    renderNotebook(notebookData[notebookId]);
}

/**
 * Renders a notebook's content to the page
 * @param {Object} notebookInfo - The parsed notebook information
 */
function renderNotebook(notebookInfo) {
    const container = document.getElementById('notebookContainer');
    
    // Error handling if container is missing
    if (!container) {
        console.error('Error: notebookContainer element not found');
        return;
    }
    
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Clear container first
    container.innerHTML = '';
    
    // Create a wrapper for the pages
    const notebookSection = document.createElement('div');
    notebookSection.className = 'notebook-section';
    
    // Get the pages
    const { pages, totalPages } = notebookInfo;
    
    // Build table of contents
    const tocContent = document.getElementById('tocContent');
    if (tocContent) {
        tocContent.innerHTML = '';
        
        const entriesMap = new Map();
        pages.forEach(page => {
            if (page.entryNumber) {
                if (!entriesMap.has(page.entryNumber)) {
                    entriesMap.set(page.entryNumber, page.pageNumber);
                }
            }
        });
        
        // Sort entries and add to TOC
        Array.from(entriesMap.entries()).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([entryNumber, pageNumber]) => {
            const entryLink = document.createElement('a');
            entryLink.href = `#page-${pageNumber}`;
            entryLink.textContent = `Entry ${entryNumber}`;
            entryLink.onclick = function(e) {
                e.preventDefault();
                const pageElement = document.getElementById(`page-${pageNumber}`);
                if (pageElement) {
                    pageElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                tocContent.classList.remove('show');
            };
            tocContent.appendChild(entryLink);
        });
    }
    
    // Create the notebook contents
    pages.forEach(page => {
        const section = document.createElement('section');
        section.className = 'page-section';
        section.id = `page-${page.pageNumber}`;
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';

        // Use the improved image creation function
        const img = createImageElement(currentNotebook, page.pageNumber);
        
        imageWrapper.appendChild(img);
        imageContainer.appendChild(imageWrapper);
        
        // Create text container
        const textContainer = document.createElement('div');
        textContainer.className = 'text-container';
        
        const pageNum = document.createElement('div');
        pageNum.className = 'page-number';
        pageNum.textContent = `Page ${page.pageNumber} of ${totalPages}`;
        textContainer.appendChild(pageNum);
        
        // Only add entry number as a separate element if it exists
        if (page.entryNumber) {
            const entryNumberElem = document.createElement('div');
            entryNumberElem.className = 'entry-number';
            entryNumberElem.textContent = `Entry ${page.entryNumber}`;
            entryNumberElem.id = `entry-${page.entryNumber}`;
            textContainer.appendChild(entryNumberElem);
        }
        
        const textContent = document.createElement('div');
        textContent.className = 'text-content';
        textContent.textContent = page.content;
        textContainer.appendChild(textContent);
        
        // Add them to the section
        section.appendChild(imageContainer);
        section.appendChild(textContainer);
        
        // Add the section to the notebook section
        notebookSection.appendChild(section);
    });
    
    // Add the notebook section to the container
    container.appendChild(notebookSection);
    
    // Hide loading message if it exists
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    
    // Update navigation buttons state
    updateNavigationState();
}

/**
 * Updates the navigation button states
 */
function updateNavigationState() {
    const prevEntryBtn = document.getElementById('prevEntry');
    const nextEntryBtn = document.getElementById('nextEntry');
    
    // Logic for enabling/disabling navigation buttons would go here
    // For now, keep them all enabled
    prevEntryBtn.disabled = false;
    nextEntryBtn.disabled = false;
}

/**
 * Navigates between entries in the notebook
 * @param {string} direction - 'prev' or 'next' to indicate navigation direction
 */
function navigateEntries(direction) {
    const entriesInCurrentNotebook = new Map();
    const notebookInfo = notebookData[currentNotebook];
    
    if (!notebookInfo || !notebookInfo.pages) return;
    
    // Collect all entries in the current notebook
    notebookInfo.pages.forEach(page => {
        if (page.entryNumber) {
            if (!entriesInCurrentNotebook.has(page.entryNumber)) {
                entriesInCurrentNotebook.set(page.entryNumber, page.pageNumber);
            }
        }
    });
    
    const entries = Array.from(entriesInCurrentNotebook.entries())
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    
    if (entries.length === 0) return;
    
    // Find currently visible entries
    let currentEntryIndex = 0; // Default to first entry
    let foundVisible = false;
    
    for (let i = 0; i < entries.length; i++) {
        const element = document.getElementById(`page-${entries[i][1]}`);
        if (element) {
            const rect = element.getBoundingClientRect();
            // Check if element is in viewport
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                currentEntryIndex = i;
                foundVisible = true;
                break;
            } else if (rect.top < 0 && rect.bottom > 0) {
                // Element is partially visible at top
                currentEntryIndex = i;
                foundVisible = true;
                break;
            }
        }
    }
    
    // If no visible entry found, find closest one
    if (!foundVisible) {
        for (let i = 0; i < entries.length; i++) {
            const element = document.getElementById(`page-${entries[i][1]}`);
            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top > 0) {
                    // This entry is below viewport
                    currentEntryIndex = Math.max(0, i - 1);
                    break;
                }
            }
        }
    }
    
    // Navigate based on direction
    let targetIndex;
    if (direction === 'prev') {
        targetIndex = Math.max(0, currentEntryIndex - 1);
    } else {
        targetIndex = Math.min(entries.length - 1, currentEntryIndex + 1);
    }
    
    // Scroll to target entry
    const targetPageId = `page-${entries[targetIndex][1]}`;
    const targetElement = document.getElementById(targetPageId);
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Performs search across notebook content and highlights matches
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    const searchResultsCount = document.getElementById('searchResultsCount');
    
    if (searchTerm === '') {
        searchResults.style.display = 'none';
        return;
    }
    
    // Remove previous highlights
    document.querySelectorAll('mark').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });
    
    // Find matches and highlight them
    let matchCount = 0;
    let matches = [];
    
    document.querySelectorAll('.text-content').forEach(textContent => {
        const content = textContent.textContent.toLowerCase();
        const occurrences = content.split(searchTerm).length - 1;
        
        if (occurrences > 0) {
            matchCount += occurrences;
            
            // Highlight matches
            const text = textContent.textContent;
            const regex = new RegExp(searchTerm, 'gi');
            const highlightedText = text.replace(regex, match => `<mark>${match}</mark>`);
            textContent.innerHTML = highlightedText;
            
            // Store references to matches
            textContent.querySelectorAll('mark').forEach(mark => {
                matches.push(mark);
            });
        }
    });
    
    // Update search results display
    if (matchCount > 0) {
        searchResultsCount.textContent = `Found ${matchCount} matches`;
        searchResults.style.display = 'block';
        searchResults.classList.add('visible'); // Add visible class for sticky behavior
        
        // Set up navigation for search results
        const prevResult = document.getElementById('prevResult');
        const nextResult = document.getElementById('nextResult');
        const currentResult = document.getElementById('currentResult');
        let currentIndex = 0;
        
        currentResult.textContent = `1/${matches.length}`;
        
        // Scroll to first match
        matches[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Setup navigation buttons
        prevResult.disabled = true;
        nextResult.disabled = matches.length <= 1;
        
        prevResult.onclick = function() {
            if (currentIndex > 0) {
                currentIndex--;
                matches[currentIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                currentResult.textContent = `${currentIndex + 1}/${matches.length}`;
                nextResult.disabled = false;
                prevResult.disabled = currentIndex === 0;
            }
        };
        
        nextResult.onclick = function() {
            if (currentIndex < matches.length - 1) {
                currentIndex++;
                matches[currentIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                currentResult.textContent = `${currentIndex + 1}/${matches.length}`;
                prevResult.disabled = false;
                nextResult.disabled = currentIndex === matches.length - 1;
            }
        };
    } else {
        searchResultsCount.textContent = 'No matches found';
        searchResults.style.display = 'block';
        searchResults.classList.add('visible'); // Add visible class for sticky behavior
        document.getElementById('prevResult').disabled = true;
        document.getElementById('nextResult').disabled = true;
        document.getElementById('currentResult').textContent = '0/0';
    }
}

/**
 * Tests if fetch is working and network is accessible
 */
function testFetch() {
    fetch('data/notebook_A.txt')
        .then(response => {
            console.log("Fetch test response:", response.status, response.statusText);
            if (!response.ok) {
                console.warn("Fetch test failed - check network and file paths");
            } else {
                console.log("Fetch test succeeded - network and file paths look good");
            }
        })
        .catch(error => {
            console.error("Fetch test error:", error);
        });
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing...");
    
    // Run a quick test to see if fetch is working
    testFetch();
    
    const backToTopBtn = document.getElementById('backToTop');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const tocBtn = document.getElementById('tocBtn');
    const tocContent = document.getElementById('tocContent');
    const prevEntryBtn = document.getElementById('prevEntry');
    const nextEntryBtn = document.getElementById('nextEntry');
    const header = document.querySelector('.header');
    const searchResults = document.querySelector('.search-results');
    
    // Check for all required elements
    if (!backToTopBtn || !searchInput || !searchButton || !tocBtn || 
        !tocContent || !prevEntryBtn || !nextEntryBtn) {
        console.error("One or more required elements are missing from the DOM");
    }
    
    // Set up notebook tab switching
    document.querySelectorAll('.notebook-tab').forEach(tab => {
        console.log(`Setting up tab for ${tab.getAttribute('data-notebook')}`);
        tab.addEventListener('click', function() {
            const notebookId = this.getAttribute('data-notebook');
            console.log(`Tab clicked: ${notebookId}`);
            loadNotebook(notebookId);
        });
    });

    // Load the first notebook by default
    loadNotebook('A');
    
    // Table of contents dropdown functionality
    if (tocBtn) {
        tocBtn.addEventListener('click', function() {
            tocContent.classList.toggle('show');
        });
    }
    
    // Close the dropdown if user clicks outside of it
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.toc-btn')) {
            if (tocContent && tocContent.classList.contains('show')) {
                tocContent.classList.remove('show');
            }
        }
    });
    
    // Entry navigation functionality
    if (prevEntryBtn) {
        prevEntryBtn.addEventListener('click', function() {
            navigateEntries('prev');
        });
    }
    
    if (nextEntryBtn) {
        nextEntryBtn.addEventListener('click', function() {
            navigateEntries('next');
        });
    }
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Handle scroll events for search results highlighting
    window.addEventListener('scroll', function() {
        if (searchResults && searchResults.style.display !== 'none') {
            if (window.scrollY > 100) {
                searchResults.classList.add('scrolling');
            } else {
                searchResults.classList.remove('scrolling');
            }
        }
    });

    // Variables to track scrolling
    let lastScrollTop = 0;
    let scrollTimer = null;

    // Handle scroll events for header visibility
    window.addEventListener('scroll', function() {
        // Clear the timer that will hide the header
        clearTimeout(scrollTimer);
        
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Show header when scrolling starts
        if (header) {
            header.classList.remove('hidden');
        }
        
        // If search results are visible, add scrolling class
        if (searchResults && searchResults.classList.contains('visible')) {
            searchResults.classList.add('scrolling');
        }
        
        // Set timer to hide header after scrolling stops
        scrollTimer = setTimeout(function() {
            // Only hide header if we've scrolled down a bit
            if (currentScrollTop > 100 && header) {
                header.classList.add('hidden');
            }
            
            // Remove scrolling class from search results
            if (searchResults && searchResults.classList.contains('visible')) {
                searchResults.classList.remove('scrolling');
            }
        }, 500); // 0.5 seconds after scrolling stops
        
        // Update last scroll position
        lastScrollTop = currentScrollTop;
    });

    // Show header when hovering near the top of the screen or when scrolling starts
    document.addEventListener('mousemove', function(e) {
        // If mouse is near the top of the viewport (within 20px)
        if (e.clientY <= 20 && header) {
            header.classList.remove('hidden');
        }
    });
    
    // Add scroll direction detection for header visibility
    let isScrollingUp = false;
    let lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Function to show header with transition delay
    function showHeaderWithDelay() {
        if (header && header.classList.contains('hidden')) {
            // Add a class that applies a longer transition for appearing
            header.classList.add('showing');
            
            // Use setTimeout to create a delay before actually showing the header
            setTimeout(function() {
                header.classList.remove('hidden');
                // Remove the showing class after transition completes
                setTimeout(function() {
                    header.classList.remove('showing');
                }, 1500);
            }, 200);
        }
    }
    
    // Detect scroll direction and show header when scrolling up
    window.addEventListener('scroll', function() {
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Determine scroll direction
        isScrollingUp = currentScrollPosition < lastScrollPosition;
        
        // If scrolling up and header is hidden, show it with delay
        if (isScrollingUp && currentScrollPosition > 100) {
            showHeaderWithDelay();
        }
        
        lastScrollPosition = currentScrollPosition;
    });

    // Back to top button
    window.addEventListener('scroll', function() {
        if (backToTopBtn) {
            if (window.pageYOffset > 300) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        }
    });
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});