// State management
let sectionStates = {};
let themeData = null;

let allCardsFlipped = false;
let allSectionsExpanded = false;

// Filter state
let activeFilters = {
    colors: new Set(),
    designs: new Set()
};

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadThemeData();
    renderThemeSections();
    initializeToggles();
    initializeFilters();
    initializeMobileDrawer();
    initializeBackToTop();
    updateCardCount();
});

// Toggle section expansion
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const arrow = document.getElementById(sectionId + '-arrow');
    
    sectionStates[sectionId] = !sectionStates[sectionId];
    
    if (sectionStates[sectionId]) {
        content.classList.add('expanded');
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.classList.remove('expanded');
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Flip individual card
function flipCard(card) {
    card.classList.toggle('flipped');
}

// Toggle controls
function initializeToggles() {
    // Expand All Toggle
    document.getElementById('expandAllToggle').addEventListener('click', function() {
        allSectionsExpanded = !allSectionsExpanded;
        this.classList.toggle('active');
        
        Object.keys(sectionStates).forEach(sectionId => {
            const content = document.getElementById(sectionId + '-content');
            const arrow = document.getElementById(sectionId + '-arrow');
            
            if (content && arrow) {
                sectionStates[sectionId] = allSectionsExpanded;
                
                if (allSectionsExpanded) {
                    content.classList.add('expanded');
                    arrow.style.transform = 'rotate(180deg)';
                } else {
                    content.classList.remove('expanded');
                    arrow.style.transform = 'rotate(0deg)';
                }
            }
        });
    });

    // Flip All Toggle
    document.getElementById('flipAllToggle').addEventListener('click', function() {
        allCardsFlipped = !allCardsFlipped;
        this.classList.toggle('active');
        
        const allCards = document.querySelectorAll('.flip-card');
        allCards.forEach(card => {
            if (allCardsFlipped) {
                card.classList.add('flipped');
            } else {
                card.classList.remove('flipped');
            }
        });
    });

}

// Filter logic
function initializeFilters() {
    const allColorFamilies = new Set();
    const allDesignSystems = new Set();
    
    themeData.categories.forEach(cat => {
        cat.themes.forEach(theme => {
            if (theme.colorFamily) {
                allColorFamilies.add(theme.colorFamily);
            }
            if (theme.designSystem) {
                allDesignSystems.add(theme.designSystem);
            }
        });
    });

    // Create color pills
    const colorPillsContainer = document.getElementById('colorPills');
    colorPillsContainer.innerHTML = '';
    Array.from(allColorFamilies).sort().forEach(color => {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.textContent = color;
        pill.dataset.type = 'color';
        pill.dataset.value = color;
        pill.addEventListener('click', () => toggleFilter('color', color, pill));
        colorPillsContainer.appendChild(pill);
    });

    // Create design system pills
    const designPillsContainer = document.getElementById('designPills');
    designPillsContainer.innerHTML = '';
    Array.from(allDesignSystems).sort().forEach(design => {
        const pill = document.createElement('div');
        pill.className = 'filter-pill design-pill';
        pill.textContent = design;
        pill.dataset.type = 'design';
        pill.dataset.value = design;
        pill.addEventListener('click', () => toggleFilter('design', design, pill));
        designPillsContainer.appendChild(pill);
    });

    // Initialize clear button
    const clearBtn = document.getElementById('clearFilters');
    clearBtn.addEventListener('click', clearAllFilters);
    updateClearButton();
}

function toggleFilter(type, value, pillElement) {
    const filterSet = type === 'color' ? activeFilters.colors : activeFilters.designs;
    
    if (filterSet.has(value)) {
        // Remove filter
        filterSet.delete(value);
        pillElement.classList.remove('active');
    } else {
        // Add filter
        filterSet.add(value);
        pillElement.classList.add('active');
    }
    
    updateClearButton();
    applyFilters();
}

function clearAllFilters() {
    // Clear all active filters
    activeFilters.colors.clear();
    activeFilters.designs.clear();
    
    // Remove active class from all pills
    document.querySelectorAll('.filter-pill.active').forEach(pill => {
        pill.classList.remove('active');
    });
    
    updateClearButton();
    applyFilters();
}

function updateClearButton() {
    const clearBtn = document.getElementById('clearFilters');
    const hasActiveFilters = activeFilters.colors.size > 0 || activeFilters.designs.size > 0;
    
    if (hasActiveFilters) {
        clearBtn.classList.add('active');
    } else {
        clearBtn.classList.remove('active');
    }
}

function applyFilters() {
    const allCards = document.querySelectorAll('.flip-card');
    
    allCards.forEach(card => {
        const themeId = card.querySelector('.flip-card-front').dataset.theme;
        const theme = findThemeById(themeId);
        
        let shouldShow = true;
        
        // Apply color filters (if any are selected, theme must match at least one)
        if (activeFilters.colors.size > 0) {
            shouldShow = shouldShow && activeFilters.colors.has(theme.colorFamily);
        }
        
        // Apply design system filters (if any are selected, theme must match at least one)
        if (activeFilters.designs.size > 0) {
            shouldShow = shouldShow && activeFilters.designs.has(theme.designSystem);
        }
        
        card.style.display = shouldShow ? 'block' : 'none';
    });
    
    updateCardCount();
}

function findThemeById(id) {
    for (const category of themeData.categories) {
        const found = category.themes.find(theme => theme.id === id);
        if (found) return found;
    }
    return null;
}

// Load theme data from JSON
async function loadThemeData() {
    try {
        const response = await fetch('./theme-library.json');
        themeData = await response.json();
        
        // Initialize section states
        themeData.categories.forEach(section => {
            sectionStates[section.id] = section.id === 'core'; // Only core section expanded by default
        });
    } catch (error) {
        console.error('Error loading theme data:', error);
    }
}

// Generate card HTML from theme data
function createThemeCard(theme) {
    const backCardStyle = `background: ${theme.backCard.theme.backgroundGradient}; color: ${theme.frontCard.textColor};`;
    
    return `
        <div class="flip-card" onclick="flipCard(this)">
            <div class="flip-card-inner">
                <div class="flip-card-front" data-theme="${theme.id}">
                    <div class="p-6 cursor-pointer h-full flex flex-col text-white">
                        <!-- Header Section -->
                        <div class="mb-4">
                            <h3 class="text-lg font-bold mb-1 leading-tight">${theme.name}</h3>
                            ${theme.tagline ? `<p class="text-xs font-medium opacity-75 uppercase tracking-wide">${theme.tagline}</p>` : ''}
                        </div>
                        
                        <!-- Historical Context Section -->
                        <div class="flex-1 mb-4">
                            <div class="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                <p class="text-xs leading-relaxed text-white/90">${theme.historicalContext}</p>
                            </div>
                        </div>
                        
                        <!-- Footer Section -->
                        <div class="space-y-3">
                            <!-- Vibe -->
                            <div class="space-y-1">
                                <span class="text-xs font-semibold opacity-70">VIBE:</span>
                                <div class="flex flex-wrap gap-1">
                                    ${theme.vibes.map(vibe => 
                                        `<span class="vibe-tag">${vibe}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            
                            <!-- Colors -->
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold opacity-70 min-w-[40px]">COLORS:</span>
                                <div class="flex gap-1">
                                    ${theme.colorPalette.slice(0, 4).map(color =>
                                        `<div class="w-5 h-5 rounded-md border border-white/30 shadow-sm" style="background: ${color};"></div>`
                                    ).join('')}
                                </div>
                            </div>
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
                                               border: ${theme.backCard.components.button.border || 'none'};">Demo Button</button>
                                <div class="opacity-75 p-3 rounded text-sm">
                                    <p>${theme.tagline || 'Theme showcase'}</p>
                                </div>
                                <div class="flex justify-center space-x-2">
                                    ${theme.backCard.theme.primaryColors.slice(0, 4).map(color => 
                                        `<div class="w-4 h-4 rounded" style="background: ${color};"></div>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render all theme sections
function renderThemeSections() {
    if (!themeData) return;
    
    const container = document.getElementById('themeSections');
    container.innerHTML = '';
    
    themeData.categories.forEach(section => {
        const sectionHTML = `
            <div class="theme-section frosted-card rounded-lg overflow-hidden mb-6">
                <div class="section-header p-4 cursor-pointer" onclick="toggleSection('${section.id}')">
                    <h2 class="text-xl font-bold text-white flex items-center justify-between">
                        <span>${section.title} <span class="section-count text-yellow-300">(${section.themes.length})</span></span>
                        <i class="fas fa-chevron-down transition-transform duration-300" id="${section.id}-arrow"></i>
                    </h2>
                </div>
                <div class="section-content ${sectionStates[section.id] ? 'expanded' : ''}" id="${section.id}-content">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-black/10">
                        ${section.themes.map(theme => createThemeCard(theme)).join('')}
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += sectionHTML;
        
        // Set initial arrow state
        setTimeout(() => {
            const arrow = document.getElementById(`${section.id}-arrow`);
            if (arrow) {
                arrow.style.transform = sectionStates[section.id] ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }, 0);
    });
}


// Update card count
function updateCardCount() {
    const totalCards = themeData.categories.flatMap(c => c.themes).length;
    const visibleCards = document.querySelectorAll('.flip-card:not([style*="display: none"])').length;
    const isFiltered = activeFilters.colors.size > 0 || activeFilters.designs.size > 0;

    if (isFiltered) {
        document.getElementById('totalCardCount').textContent = `${visibleCards} / ${totalCards}`;
    } else {
        document.getElementById('totalCardCount').textContent = totalCards;
    }
}

// Mobile drawer functionality
function initializeMobileDrawer() {
    const toggleBtn = document.getElementById('filterToggle');
    const drawer = document.getElementById('filterContainer');
    const toggleText = document.querySelector('.filter-toggle-text');
    
    if (!toggleBtn || !drawer) return;
    
    // Start with drawer collapsed on mobile
    if (window.innerWidth < 768) {
        drawer.classList.add('collapsed');
    } else {
        drawer.classList.add('expanded');
    }
    
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = drawer.classList.contains('collapsed');
        
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
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            drawer.classList.remove('collapsed');
            drawer.classList.add('expanded');
            toggleBtn.classList.remove('active');
            toggleText.textContent = 'Show Filters';
        }
    });
}

// Back to Top functionality
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
