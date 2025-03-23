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

// Function to load a notebook's text content
async function loadNotebookContent(notebookId) {
    try {
        // Use the correct GitHub path structure for your repository
        const response = await fetch(`data/notebook_${notebookId}.txt`);
        if (!response.ok) {
            throw new Error(`Failed to load notebook ${notebookId}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error loading notebook ${notebookId}:`, error);
        return null;
    }
}

// Function to get the image path for a specific page
function getImagePath(notebookId, pageNumber) {
    // Format page number with leading zeros
    const paddedNumber = pageNumber.toString().padStart(4, '0');
    // Use the correct path to match your GitHub structure
    return `images/notebook_${notebookId}/page-${paddedNumber}.jpg`;
}

// Function to load a specific notebook
async function loadNotebook(notebookId) {
    const container = document.getElementById('notebookContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    
    // Clear existing content
    container.innerHTML = '';
    container.appendChild(loadingMessage);
    loadingMessage.style.display = 'block';
    
    // Update the notebook title
    document.getElementById('notebookTitle').textContent = `Deyerle Meteorite Notebook ${notebookId}`;
    
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

// Function to render a notebook
function renderNotebook(notebookInfo) {
    const container = document.getElementById('notebookContainer');
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
            document.getElementById(`page-${pageNumber}`).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            tocContent.classList.remove('show');
        };
        tocContent.appendChild(entryLink);
    });
    
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
        
        // Create img element instead of placeholder
        const img = document.createElement('img');
        img.loading = 'lazy'; // Enable lazy loading
        img.src = getImagePath(currentNotebook, page.pageNumber);
        img.alt = `Page ${page.pageNumber}`;
        
        // Handle image errors gracefully
        img.onerror = function() {
            // If the image fails to load, show a placeholder instead
            this.src = 'placeholder.jpg';
            this.alt = 'Image not available';
        };
        
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
    
    // Hide loading message
    loadingMessage.style.display = 'none';
    
    // Update navigation buttons state
    updateNavigationState();
}

// Function to update navigation state
function updateNavigationState() {
    const prevEntryBtn = document.getElementById('prevEntry');
    const nextEntryBtn = document.getElementById('nextEntry');
    
    // Logic for enabling/disabling navigation buttons would go here
    // For now, keep them all enabled
    prevEntryBtn.disabled = false;
    nextEntryBtn.disabled = false;
}

// Function to navigate between entries
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

// Search functionality
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
        document.getElementById('prevResult').disabled = true;
        document.getElementById('nextResult').disabled = true;
        document.getElementById('currentResult').textContent = '0/0';
    }
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const backToTopBtn = document.getElementById('backToTop');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const tocBtn = document.getElementById('tocBtn');
    const tocContent = document.getElementById('tocContent');
    const prevEntryBtn = document.getElementById('prevEntry');
    const nextEntryBtn = document.getElementById('nextEntry');
    
    // Load the first notebook by default
    loadNotebook('A');
    
    // Set up notebook tab switching
    document.querySelectorAll('.notebook-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const notebookId = this.getAttribute('data-notebook');
            loadNotebook(notebookId);
        });
    });
    
    // Table of contents dropdown functionality
    tocBtn.addEventListener('click', function() {
        tocContent.classList.toggle('show');
    });
    
    // Close the dropdown if user clicks outside of it
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.toc-btn')) {
            if (tocContent.classList.contains('show')) {
                tocContent.classList.remove('show');
            }
        }
    });
    
    // Entry navigation functionality
    prevEntryBtn.addEventListener('click', function() {
        navigateEntries('prev');
    });
    
    nextEntryBtn.addEventListener('click', function() {
        navigateEntries('next');
    });
    
    // Search functionality
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    
    searchButton.addEventListener('click', performSearch);
    
    // Back to top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});