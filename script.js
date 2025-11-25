// Global variables
let map;
let markers = [];
let filteredProjects = [...regenerativeProjects];

// DOM elements
let searchInput;
let districtFilter;
let cityFilter;
let practiceFilter;
let productFilter;
let resetFiltersBtn;
let clearSearchBtn;
let listViewBtn;
let mapViewBtn;
let listView;
let mapView;
let projectsList;
let noResults;
let resultsCount;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeElements();
    updateHeaderStats();
    updateFAQStats();
    initializeFilters();
    initializeEventListeners();
    initializeMap();
    displayProjects(filteredProjects);
    updateResultsCount();
});

// Initialize DOM elements
function initializeElements() {
    searchInput = document.getElementById('searchInput');
    districtFilter = document.getElementById('districtFilter');
    cityFilter = document.getElementById('cityFilter');
    practiceFilter = document.getElementById('practiceFilter');
    productFilter = document.getElementById('productFilter');
    resetFiltersBtn = document.getElementById('resetFilters');
    clearSearchBtn = document.getElementById('clearSearch');
    listViewBtn = document.getElementById('listViewBtn');
    mapViewBtn = document.getElementById('mapViewBtn');
    listView = document.getElementById('listView');
    mapView = document.getElementById('mapView');
    projectsList = document.getElementById('projectsList');
    noResults = document.getElementById('noResults');
    resultsCount = document.getElementById('resultsCount');
}

// Update header statistics dynamically
function updateHeaderStats() {
    // Calculate total projects
    const totalProjects = regenerativeProjects.length;

    // Calculate unique cities
    const uniqueCities = new Set(regenerativeProjects.map(project => project.City));
    const totalCities = uniqueCities.size;

    // Update DOM
    const totalProjectsEl = document.getElementById('totalProjects');
    const totalCitiesEl = document.getElementById('totalCities');

    if (totalProjectsEl) totalProjectsEl.textContent = totalProjects;
    if (totalCitiesEl) totalCitiesEl.textContent = totalCities;
}

// Update FAQ statistics dynamically
function updateFAQStats() {
    // Calculate total projects
    const totalProjects = regenerativeProjects.length;

    // Update FAQ DOM elements
    const faqTotalProjectsEl = document.getElementById('faqTotalProjects');

    if (faqTotalProjectsEl) {
        faqTotalProjectsEl.textContent = `${totalProjects} projects`;
    }
}

// Initialize filters with unique values from data
function initializeFilters() {
    // Populate district filter
    const districts = [...new Set(regenerativeProjects.map(project => project.District).filter(d => d))].sort();
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });

    // Populate city filter
    const cities = [...new Set(regenerativeProjects.map(project => project.City))].sort();
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });

    // Populate practice filter
    const practices = new Set();
    regenerativeProjects.forEach(project => {
        if (project['Regenerative Practices']) {
            project['Regenerative Practices'].forEach(p => practices.add(p));
        }
    });
    [...practices].sort().forEach(practice => {
        const option = document.createElement('option');
        option.value = practice;
        option.textContent = practice;
        practiceFilter.appendChild(option);
    });

    // Populate product filter
    const products = new Set();
    regenerativeProjects.forEach(project => {
        if (project['Products']) {
            project['Products'].forEach(p => products.add(p));
        }
    });
    [...products].sort().forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productFilter.appendChild(option);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);

    // Filters
    districtFilter.addEventListener('change', handleFilters);
    cityFilter.addEventListener('change', handleFilters);
    practiceFilter.addEventListener('change', handleFilters);
    productFilter.addEventListener('change', handleFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // View toggle
    listViewBtn.addEventListener('click', () => switchView('list'));
    mapViewBtn.addEventListener('click', () => switchView('map'));
}

// Handle search functionality
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    // Show/hide clear button
    clearSearchBtn.style.display = query ? 'block' : 'none';

    applyFilters();
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    applyFilters();
}

// Handle all filters
function handleFilters() {
    applyFilters();
}

// Apply all filters and search
function applyFilters() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedDistrict = districtFilter.value;
    const selectedCity = cityFilter.value;
    const selectedPractice = practiceFilter.value;
    const selectedProduct = productFilter.value;

    filteredProjects = regenerativeProjects.filter(project => {
        // Search filter
        const matchesSearch = !searchQuery ||
            project['Project Name'].toLowerCase().includes(searchQuery) ||
            project.Country.toLowerCase().includes(searchQuery) ||
            (project.District && project.District.toLowerCase().includes(searchQuery)) ||
            project.City.toLowerCase().includes(searchQuery) ||
            project['Full Address'].toLowerCase().includes(searchQuery) ||
            (project['Regenerative Practices'] && project['Regenerative Practices'].some(p => p.toLowerCase().includes(searchQuery))) ||
            (project['Products'] && project['Products'].some(p => p.toLowerCase().includes(searchQuery)));

        // District filter
        const matchesDistrict = !selectedDistrict || project.District === selectedDistrict;

        // City filter
        const matchesCity = !selectedCity || project.City === selectedCity;

        // Practice filter
        const matchesPractice = !selectedPractice ||
            (project['Regenerative Practices'] && project['Regenerative Practices'].includes(selectedPractice));

        // Product filter
        const matchesProduct = !selectedProduct ||
            (project['Products'] && project['Products'].includes(selectedProduct));

        return matchesSearch && matchesDistrict && matchesCity && matchesPractice && matchesProduct;
    });

    displayProjects(filteredProjects);
    updateMapMarkers();
    updateResultsCount();
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    districtFilter.value = '';
    cityFilter.value = '';
    practiceFilter.value = '';
    productFilter.value = '';
    clearSearchBtn.style.display = 'none';

    filteredProjects = [...regenerativeProjects];
    displayProjects(filteredProjects);
    updateMapMarkers();
    updateResultsCount();
}

// Switch between list and map views
function switchView(view) {
    if (view === 'list') {
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        listView.classList.add('active');
        mapView.classList.remove('active');
    } else {
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.add('active');
        listView.classList.remove('active');
        mapView.classList.add('active');

        // Invalidate map size and fit bounds when switching to map view
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                // Re-fit bounds to ensure proper zoom
                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.05), {
                        maxZoom: 12
                    });
                }
            }
        }, 100);
    }
}

// Show specific project on map
function showOnMap(projectName, lat, lng) {
    // Switch to map view
    switchView('map');

    // Wait for map to be ready, then center on the project
    setTimeout(() => {
        if (map) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

            map.setView([latitude, longitude], 15);

            // Find and open the popup for this project
            markers.forEach(marker => {
                const markerLatLng = marker.getLatLng();
                if (Math.abs(markerLatLng.lat - latitude) < 0.0001 &&
                    Math.abs(markerLatLng.lng - longitude) < 0.0001) {
                    marker.openPopup();
                }
            });
        }
    }, 200);
}

// Display projects in list view
function displayProjects(projects) {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsList.appendChild(projectCard);
    });
}

// Generate LocalBusiness/AgriculturalBusiness schema for each project
function generateLocalBusinessSchema(project) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "additionalType": "https://schema.org/AgriculturalBusiness",
        "name": project['Project Name'],
        "url": project.Website || null,
        "description": `Regenerative Agriculture Project in ${project.Country}. Practices: ${project['Regenerative Practices'] ? project['Regenerative Practices'].join(', ') : ''}`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": project['Full Address'],
            "addressLocality": project.City,
            "addressCountry": project.Country
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": project.Latitude,
            "longitude": project.Longitude
        },
        "telephone": project.Phone,
        "email": project.Email || null,
        "knowsAbout": project['Regenerative Practices'] || [],
        "offers": (project['Products'] || []).map(product => ({
            "@type": "Offer",
            "itemOffered": {
                "@type": "Product",
                "name": product
            }
        }))
    };

    return schema;
}

// Create project card HTML
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const practices = project['Regenerative Practices'] || [];
    const products = project['Products'] || [];

    // Add Schema to each card
    const schema = generateLocalBusinessSchema(project);
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(schema);
    card.appendChild(schemaScript);

    card.innerHTML = `
        <div class="project-header">
            <h2 class="project-name">${escapeHtml(project['Project Name'])}</h2>
            <span class="project-district">${escapeHtml(project.City)}</span>
        </div>
        
        <div class="project-body">
            <div class="project-info">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Location</span>
                        <div class="info-text">${escapeHtml(project.City)}${project.District ? `, ${escapeHtml(project.District)}` : ''}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-phone info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Phone</span>
                        <div class="info-text">
                            ${project.Phone ? `<a href="tel:${project.Phone}">${escapeHtml(project.Phone)}</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-envelope info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Email</span>
                        <div class="info-text">
                            ${project.Email ? `<a href="mailto:${project.Email}">${escapeHtml(project.Email)}</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-globe info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Website</span>
                        <div class="info-text">
                            ${project.Website ? `<a href="${project.Website}" target="_blank" rel="noopener noreferrer">Visit website</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
            </div>
            
            ${practices.length > 0 ? `
            <div class="additional-info">
                <span class="info-label">Regenerative Practices</span>
                <div class="services-list">
                    ${practices.map(practice => `<span class="service-tag practice-tag">${escapeHtml(practice)}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            ${products.length > 0 ? `
            <div class="additional-info">
                <span class="info-label">Products</span>
                <div class="services-list">
                    ${products.map(product => `<span class="service-tag product-tag">${escapeHtml(product)}</span>`).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="project-actions">
                <button class="show-on-map-btn" onclick="showOnMap('${escapeHtml(project['Project Name'])}', ${project.Latitude}, ${project.Longitude})">
                    <i class="fas fa-map-marker-alt"></i>
                    View on map
                </button>
            </div>
        </div>
    `;

    return card;
}

// Update results count
function updateResultsCount() {
    resultsCount.textContent = filteredProjects.length;
}

// Initialize Leaflet map
function initializeMap() {
    // Initialize map without specific view - we'll fit to markers
    map = L.map('map').setView([39.5, -8.0], 7); // Default center on Portugal

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add initial markers and fit view
    updateMapMarkers();
}

// Update map markers based on filtered projects
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add markers for filtered projects
    filteredProjects.forEach(project => {
        const lat = parseFloat(project.Latitude);
        const lng = parseFloat(project.Longitude);

        if (lat && lng) {
            const marker = L.marker([lat, lng]).addTo(map);

            const popupContent = createMapPopupContent(project);
            marker.bindPopup(popupContent);

            markers.push(marker);
        }
    });

    // Adjust map view to fit all markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.05), {
            maxZoom: 12 // Prevent zooming in too much for single markers
        });
    } else {
        // Fallback to Portugal view if no markers
        map.setView([39.5, -8.0], 7);
    }
}

// Create popup content for map markers
function createMapPopupContent(project) {
    return `
        <div class="popup-content">
            <h3 class="popup-title">${escapeHtml(project['Project Name'])}</h3>
            <span class="popup-district">${escapeHtml(project.City)}</span>
            
            <div class="popup-info">
                <div class="popup-info-item">
                    <i class="fas fa-map-marker-alt popup-icon"></i>
                    <span>${escapeHtml(project.City)}${project.District ? `, ${escapeHtml(project.District)}` : ''}</span>
                </div>
                
                <div class="popup-info-item">
                    <i class="fas fa-phone popup-icon"></i>
                    ${project.Phone ? `<a href="tel:${project.Phone}">${escapeHtml(project.Phone)}</a>` : '<span class="not-available">Not Available</span>'}
                </div>
                
                <div class="popup-info-item">
                    <i class="fas fa-globe popup-icon"></i>
                    ${project.Website ? `<a href="${project.Website}" target="_blank" rel="noopener noreferrer">Website</a>` : '<span class="not-available">Not Available</span>'}
                </div>
            </div>
        </div>
    `;
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Handle window resize for map
window.addEventListener('resize', function () {
    if (map && mapView.classList.contains('active')) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});
