// Optimized JavaScript with memory leak prevention and performance improvements

// State management - more efficient data structures
let sectionStates = new Map();
let themeData = null;
let themeCache = new Map(); // Cache for theme lookups

let allCardsFlipped = false;
let allSectionsExpanded = false;
let activeThemeCard = null;

// Filter state - using Sets for better performance
let activeFilters = {
    colors: new Set(),
    designs: new Set()
};

// Event listener cleanup tracking
let eventListeners = [];

// Throttled functions for performance
let throttledScroll = null;
let throttledResize = null;

// Initialize with cleanup
document.addEventListener('DOMContentLoaded', async function() {
    await loadThemeData();
    renderThemeSections();
    initializeToggles();
    initializeFilters();
    initializeMobileDrawer();
    initializeBackToTop();
    updateCardCount();
    
    // Add cleanup on beforeunload
    window.addEventListener('beforeunload', cleanup);
});

// Cleanup function to prevent memory leaks
function cleanup() {
    // Remove all tracked event listeners
    eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    eventListeners = [];
    
    // Clear caches
    themeCache.clear();
    sectionStates.clear();
    activeFilters.colors.clear();
    activeFilters.designs.clear();
    
    // Cancel any pending timers
    if (throttledScroll) clearTimeout(throttledScroll);
    if (throttledResize) clearTimeout(throttledResize);
}

// Helper to track event listeners for cleanup
function addTrackedEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
}

// Optimized throttle function
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Optimized section toggle with better DOM manipulation
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const arrow = document.getElementById(sectionId + '-arrow');
    
    if (!content || !arrow) return;
    
    const isExpanded = sectionStates.get(sectionId);
    sectionStates.set(sectionId, !isExpanded);
    
    // Use requestAnimationFrame for smoother animations
    requestAnimationFrame(() => {
        if (!isExpanded) {
            content.classList.add('expanded');
            arrow.style.transform = 'rotate(180deg)';
        } else {
            content.classList.remove('expanded');
            arrow.style.transform = 'rotate(0deg)';
        }
    });
}

// Optimized card flip with event delegation
function flipCard(card) {
    if (!card) return;
    
    setActiveThemeCard(card);
    requestAnimationFrame(() => {
        card.classList.toggle('flipped');
    });
}

// More efficient active card management
function setActiveThemeCard(card) {
    if (activeThemeCard && activeThemeCard !== card) {
        activeThemeCard.classList.remove('active');
    }
    
    activeThemeCard = card;
    requestAnimationFrame(() => {
        card.classList.add('active');
    });
}

// Optimized toggle controls with better event handling
function initializeToggles() {
    const expandToggle = document.getElementById('expandAllToggle');
    const flipToggle = document.getElementById('flipAllToggle');
    
    if (!expandToggle || !flipToggle) return;
    
    // Expand All Toggle
    const handleExpandToggle = function() {
        allSectionsExpanded = !allSectionsExpanded;
        this.classList.toggle('active');
        
        // Batch DOM updates for better performance
        const updates = [];
        sectionStates.forEach((state, sectionId) => {
            const content = document.getElementById(sectionId + '-content');
            const arrow = document.getElementById(sectionId + '-arrow');
            
            if (content && arrow) {
                sectionStates.set(sectionId, allSectionsExpanded);
                updates.push({ content, arrow, expanded: allSectionsExpanded });
            }
        });
        
        // Apply all updates in a single frame
        requestAnimationFrame(() => {
            updates.forEach(({ content, arrow, expanded }) => {
                if (expanded) {
                    content.classList.add('expanded');
                    arrow.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.remove('expanded');
                    arrow.style.transform = 'rotate(0deg)';
                }
            });
        });
    };
    
    // Flip All Toggle with optimized DOM queries
    const handleFlipToggle = function() {
        allCardsFlipped = !allCardsFlipped;
        this.classList.toggle('active');
        
        const allCards = document.querySelectorAll('.flip-card');
        const cardsToUpdate = [];
        
        allCards.forEach(card => {
            if (card !== activeThemeCard) {
                cardsToUpdate.push(card);
            }
        });
        
        requestAnimationFrame(() => {
            cardsToUpdate.forEach(card => {
                if (allCardsFlipped) {
                    card.classList.add('flipped');
                } else {
                    card.classList.remove('flipped');
                }
            });
        });
    };
    
    addTrackedEventListener(expandToggle, 'click', handleExpandToggle);
    addTrackedEventListener(flipToggle, 'click', handleFlipToggle);
}

// Optimized filter initialization with better data structures
function initializeFilters() {
    const allColorFamilies = new Set();
    const allDesignSystems = new Set();
    
    // Build lookup cache while collecting filter options
    themeData.categories.forEach(cat => {
        cat.themes.forEach(theme => {
            themeCache.set(theme.id, theme);
            
            if (theme.colorFamily) {
                allColorFamilies.add(theme.colorFamily);
            }
            if (theme.designSystem) {
                allDesignSystems.add(theme.designSystem);
            }
        });
    });

    // Create pills with event delegation for better performance
    createFilterPills('colorPills', allColorFamilies, 'color');
    createFilterPills('designPills', allDesignSystems, 'design');

    // Initialize clear button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        addTrackedEventListener(clearBtn, 'click', clearAllFilters);
    }
    updateClearButton();
}

// Helper function for creating filter pills
function createFilterPills(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const fragment = document.createDocumentFragment();
    
    Array.from(items).sort().forEach(item => {
        const pill = document.createElement('div');
        pill.className = `filter-pill ${type === 'design' ? 'design-pill' : ''}`;
        pill.textContent = item;
        pill.dataset.type = type;
        pill.dataset.value = item;
        
        // Use event delegation instead of individual listeners
        fragment.appendChild(pill);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Single event listener for all pills in container
    addTrackedEventListener(container, 'click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (pill) {
            const pillType = pill.dataset.type;
            const value = pill.dataset.value;
            toggleFilter(pillType, value, pill);
        }
    });
}

// Optimized filter toggle
function toggleFilter(type, value, pillElement) {
    const filterSet = type === 'color' ? activeFilters.colors : activeFilters.designs;
    
    if (filterSet.has(value)) {
        filterSet.delete(value);
        pillElement.classList.remove('active');
    } else {
        filterSet.add(value);
        pillElement.classList.add('active');
    }
    
    updateClearButton();
    
    // Debounce filter application for better performance
    if (applyFilters.timeoutId) {
        clearTimeout(applyFilters.timeoutId);
    }
    applyFilters.timeoutId = setTimeout(applyFilters, 50);
}

// Optimized clear filters
function clearAllFilters() {
    activeFilters.colors.clear();
    activeFilters.designs.clear();
    
    // Batch DOM updates
    const activePills = document.querySelectorAll('.filter-pill.active');
    requestAnimationFrame(() => {
        activePills.forEach(pill => pill.classList.remove('active'));
    });
    
    updateClearButton();
    applyFilters();
}

// Efficient clear button update
function updateClearButton() {
    const clearBtn = document.getElementById('clearFilters');
    if (!clearBtn) return;
    
    const hasActiveFilters = activeFilters.colors.size > 0 || activeFilters.designs.size > 0;
    
    requestAnimationFrame(() => {
        clearBtn.classList.toggle('active', hasActiveFilters);
    });
}

// Highly optimized filter application
function applyFilters() {
    const allCards = document.querySelectorAll('.flip-card');
    const visibilityUpdates = [];
    
    allCards.forEach(card => {
        const front = card.querySelector('.flip-card-front');
        if (!front) return;
        
        const themeId = front.dataset.theme;
        const theme = themeCache.get(themeId);
        
        if (!theme) return;
        
        let shouldShow = true;
        
        if (activeFilters.colors.size > 0) {
            shouldShow = shouldShow && activeFilters.colors.has(theme.colorFamily);
        }
        
        if (activeFilters.designs.size > 0) {
            shouldShow = shouldShow && activeFilters.designs.has(theme.designSystem);
        }
        
        visibilityUpdates.push({ card, shouldShow });
    });
    
    // Batch all visibility updates
    requestAnimationFrame(() => {
        visibilityUpdates.forEach(({ card, shouldShow }) => {
            card.style.display = shouldShow ? 'block' : 'none';
        });
        updateCardCount();
    });
}

// Optimized theme lookup using cache
function findThemeById(id) {
    return themeCache.get(id) || null;
}

// Efficient data loading
async function loadThemeData() {
    try {
        const response = await fetch('./theme-library.json');
        themeData = await response.json();
        
        // Initialize section states efficiently
        themeData.categories.forEach(section => {
            sectionStates.set(section.id, section.id === 'core');
        });
    } catch (error) {
        console.error('Error loading theme data:', error);
    }
}

// Redesigned card with better visual layout
function createThemeCard(theme) {
    const backCardStyle = `background: ${theme.backCard.theme.backgroundGradient}; color: ${theme.frontCard.textColor};`;
    
    // Pre-build repeated elements
    const vibesHTML = theme.vibes.map(vibe => `<span class="vibe-tag">${vibe}</span>`).join('');
    const colorPaletteHTML = theme.colorPalette.slice(0, 5).map(color =>
        `<div class="color-dot" style="background: ${color};"></div>`
    ).join('');
    const primaryColorsHTML = theme.backCard.theme.primaryColors.slice(0, 4).map(color => 
        `<div class="w-4 h-4 rounded" style="background: ${color};"></div>`
    ).join('');
    
    return `
        <div class="flip-card" onclick="flipCard(this)">
            <div class="flip-card-inner">
                <div class="flip-card-front" data-theme="${theme.id}">
                    <div class="theme-card-content">
                        <!-- Header with Title and Tagline -->
                        <div class="theme-header">
                            <h3 class="theme-title">${theme.name}</h3>
                            ${theme.tagline ? `<p class="theme-tagline">${theme.tagline}</p>` : ''}
                        </div>
                        
                        <!-- Color Palette Strip -->
                        <div class="color-palette-strip">
                            ${colorPaletteHTML}
                        </div>
                        
                        <!-- Historical Context Box -->
                        <div class="context-box">
                            <div class="context-label">Historical Context</div>
                            <p class="context-text">${theme.historicalContext}</p>
                        </div>
                        
                        <!-- Bottom Section with Vibes -->
                        <div class="vibes-section">
                            <div class="vibes-label">Style Characteristics</div>
                            <div class="vibes-container">${vibesHTML}</div>
                        </div>
                    </div>
                </div>
                <div class="flip-card-back" style="${backCardStyle}" data-theme="${theme.id}">
                    <div class="p-6 flex flex-col justify-center h-full">
                        <div class="text-center">
                            <h4 class="text-xl font-bold mb-4">${theme.displayName}</h4>
                            <div class="space-y-3">
                                <button class="w-full py-3 rounded font-semibold" 
                                        style="background: ${theme.backCard.components.button.background}; 
                                               color: ${theme.backCard.components.button.color || theme.frontCard.textColor};
                                               border: ${theme.backCard.components.button.border || 'none'};">Button Style</button>
                                <div class="opacity-75 p-3 rounded text-sm">
                                    <p>${theme.tagline || 'Theme showcase'}</p>
                                </div>
                                <div class="flex justify-center space-x-2">${primaryColorsHTML}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Optimized section rendering
function renderThemeSections() {
    if (!themeData) return;
    
    const container = document.getElementById('themeSections');
    if (!container) return;
    
    const fragment = document.createDocumentFragment();
    
    themeData.categories.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'theme-section frosted-card rounded-lg overflow-hidden mb-6';
        
        const cardsHTML = section.themes.map(theme => createThemeCard(theme)).join('');
        
        sectionDiv.innerHTML = `
            <div class="section-header p-4 cursor-pointer" onclick="toggleSection('${section.id}')">
                <h2 class="text-xl font-bold text-white flex items-center justify-between">
                    <span>${section.title} <span class="section-count text-yellow-300">(${section.themes.length})</span></span>
                    <i class="fas fa-chevron-down transition-transform duration-300" id="${section.id}-arrow"></i>
                </h2>
            </div>
            <div class="section-content ${sectionStates.get(section.id) ? 'expanded' : ''}" id="${section.id}-content">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-black/10">
                    ${cardsHTML}
                </div>
            </div>
        `;
        
        fragment.appendChild(sectionDiv);
    });
    
    container.innerHTML = '';
    container.appendChild(fragment);
    
    // Set initial arrow states and fix card heights
    requestAnimationFrame(() => {
        themeData.categories.forEach(section => {
            const arrow = document.getElementById(`${section.id}-arrow`);
            if (arrow) {
                arrow.style.transform = sectionStates.get(section.id) ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
        
        // Fix card heights to prevent overlap
        fixCardHeights();
    });
}

// Function to fix card heights based on content
function fixCardHeights() {
    // Process each grid container separately
    const gridContainers = document.querySelectorAll('.grid');
    
    gridContainers.forEach(gridContainer => {
        const cards = gridContainer.querySelectorAll('.flip-card');
        const cardHeights = [];
        
        // First pass: calculate all card heights
        cards.forEach(card => {
            const inner = card.querySelector('.flip-card-inner');
            const front = card.querySelector('.flip-card-front');
            
            if (inner && front) {
                const frontContent = front.querySelector('.theme-card-content');
                
                if (frontContent) {
                    // Create a temporary container with exact styling
                    const tempDiv = document.createElement('div');
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.visibility = 'hidden';
                    tempDiv.style.width = front.offsetWidth + 'px';
                    tempDiv.style.background = 'rgba(255, 255, 255, 0.1)';
                    tempDiv.style.backdropFilter = 'blur(10px)';
                    tempDiv.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    tempDiv.style.borderRadius = '12px';
                    tempDiv.style.boxSizing = 'border-box';
                    tempDiv.innerHTML = front.innerHTML;
                    document.body.appendChild(tempDiv);
                    
                    // Get the full height including padding
                    const contentHeight = tempDiv.scrollHeight;
                    document.body.removeChild(tempDiv);
                    
                    // Add extra padding to ensure no cutoff
                    const calculatedHeight = Math.max(420, contentHeight + 20);
                    cardHeights.push(calculatedHeight);
                } else {
                    cardHeights.push(420);
                }
            } else {
                cardHeights.push(420);
            }
        });
        
        // Find the maximum height in this grid
        const maxHeight = Math.max(...cardHeights);
        
        // Second pass: apply the maximum height to all cards in this grid
        cards.forEach(card => {
            const inner = card.querySelector('.flip-card-inner');
            const front = card.querySelector('.flip-card-front');
            const back = card.querySelector('.flip-card-back');
            
            if (inner && front && back) {
                inner.style.height = maxHeight + 'px';
                front.style.height = maxHeight + 'px';
                back.style.height = maxHeight + 'px';
            }
        });
    });
}

// Optimized card count update
function updateCardCount() {
    if (!themeData) return;
    
    const totalCards = themeData.categories.reduce((sum, c) => sum + c.themes.length, 0);
    const visibleCards = document.querySelectorAll('.flip-card:not([style*="display: none"])').length;
    const isFiltered = activeFilters.colors.size > 0 || activeFilters.designs.size > 0;

    const countElement = document.getElementById('totalCardCount');
    if (countElement) {
        countElement.textContent = isFiltered ? `${visibleCards} / ${totalCards}` : totalCards;
    }
}

// Optimized mobile drawer with throttled resize
function initializeMobileDrawer() {
    const toggleBtn = document.getElementById('filterToggle');
    const drawer = document.getElementById('filterContainer');
    const toggleText = document.querySelector('.filter-toggle-text');
    
    if (!toggleBtn || !drawer || !toggleText) return;
    
    // Initial state
    const setInitialState = () => {
        if (window.innerWidth < 768) {
            drawer.classList.add('collapsed');
            drawer.classList.remove('expanded');
        } else {
            drawer.classList.remove('collapsed');
            drawer.classList.add('expanded');
        }
    };
    
    setInitialState();
    
    const handleToggle = () => {
        const isCollapsed = drawer.classList.contains('collapsed');
        
        requestAnimationFrame(() => {
            if (isCollapsed) {
                drawer.classList.remove('collapsed');
                drawer.classList.add('expanded');
                toggleBtn.classList.add('active');
                toggleText.textContent = 'Hide Filters';
            } else {
                drawer.classList.remove('expanded');
                drawer.classList.add('collapsed');
                toggleBtn.classList.remove('active');
                toggleText.textContent = 'Show Filters';
            }
        });
    };
    
    addTrackedEventListener(toggleBtn, 'click', handleToggle);
    
    // Throttled resize handler
    throttledResize = throttle(() => {
        if (window.innerWidth >= 768) {
            requestAnimationFrame(() => {
                drawer.classList.remove('collapsed');
                drawer.classList.add('expanded');
                toggleBtn.classList.remove('active');
                toggleText.textContent = 'Show Filters';
            });
        }
    }, 250);
    
    addTrackedEventListener(window, 'resize', throttledResize);
}

// Optimized back to top with throttled scroll
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;
    
    let isVisible = false;
    
    const updateVisibility = (shouldShow) => {
        if (shouldShow !== isVisible) {
            isVisible = shouldShow;
            requestAnimationFrame(() => {
                backToTopBtn.classList.toggle('visible', shouldShow);
            });
        }
    };
    
    // Throttled scroll handler
    throttledScroll = throttle(() => {
        updateVisibility(window.scrollY > 300);
    }, 100);
    
    addTrackedEventListener(window, 'scroll', throttledScroll);
    
    addTrackedEventListener(backToTopBtn, 'click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}