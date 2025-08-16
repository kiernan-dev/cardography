// State management
let sectionStates = {};
let themeData = null;

let allCardsFlipped = false;
let allSectionsExpanded = false;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadThemeData();
    renderThemeSections();
    initializeToggles();
    initializeFilters();
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
    themeData.categories.forEach(cat => {
        cat.themes.forEach(theme => {
            if (theme.colorFamily) {
                allColorFamilies.add(theme.colorFamily);
            }
        });
    });

    const select = document.getElementById('colorFilterSelect');
    select.innerHTML = '<option value="all">All Colors</option>';

    allColorFamilies.forEach(family => {
        const option = document.createElement('option');
        option.value = family;
        option.textContent = family;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        applyFilters();
    });
}

function applyFilters() {
    const select = document.getElementById('colorFilterSelect');
    const selectedColor = select.value;

    const allCards = document.querySelectorAll('.flip-card');
    allCards.forEach(card => {
        const themeId = card.querySelector('.flip-card-front').dataset.theme;
        const theme = findThemeById(themeId);

        if (selectedColor === 'all' || theme.colorFamily === selectedColor) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
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
                        <div>
                            <h3 class="text-xl font-bold mb-2">${theme.name}</h3>
                            ${theme.tagline ? `<p class="text-sm mb-3 opacity-80">${theme.tagline}</p>` : ''}
                        </div>
                        
                        <div class="mt-auto space-y-3 text-sm">
                            <div>
                                <strong class="block mb-1 text-xs uppercase tracking-wider opacity-70">Key Characteristics:</strong>
                                <div class="flex flex-wrap gap-1">
                                    ${theme.keyCharacteristics.slice(0, 3).map(char => `<span class="characteristic-tag">${char}</span>`).join('')}
                                </div>
                            </div>
                            <p><strong>Vibe:</strong> ${theme.vibes.join(', ')}</p>
                            <div class="flex items-center">
                                <strong class="mr-2">Colors:</strong>
                                <div class="flex space-x-1">
                                    ${theme.colorPalette.slice(0, 4).map(color =>
                                        `<div class="w-4 h-4 rounded border border-white/20" style="background: ${color};"></div>`
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
            <div class="theme-section bg-white/10 backdrop-blur-md rounded-lg overflow-hidden border border-white/20">
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
    const select = document.getElementById('colorFilterSelect');
    const isFiltered = select.value !== 'all';

    if (isFiltered) {
        document.getElementById('totalCardCount').textContent = `${visibleCards} / ${totalCards}`;
    } else {
        document.getElementById('totalCardCount').textContent = totalCards;
    }
}
