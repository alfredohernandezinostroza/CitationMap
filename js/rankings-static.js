// Global variables
let yearSlider = null;
let yearMin = 1900;
let yearMax = new Date().getFullYear();
let currentSubfield = null;
let metadata = null;
let originalGraph = null;

// DOM elements
const noDataAlert = document.getElementById('noDataAlert');
const rankingsContent = document.getElementById('rankingsContent');
const subfieldSelect = document.getElementById('subfieldSelect');
const yearRangeSlider = document.getElementById('yearRangeSlider');
const rankingYearMin = document.getElementById('rankingYearMin');
const rankingYearMax = document.getElementById('rankingYearMax');
const topPapersTitle = document.getElementById('topPapersTitle');
const topPapersTable = document.getElementById('topPapersTable');
const topPapersChart = document.getElementById('topPapersChart');
const topAuthorsTitle = document.getElementById('topAuthorsTitle');
const topAuthorsTable = document.getElementById('topAuthorsTable');
const topAuthorsChart = document.getElementById('topAuthorsChart');
const publicationTrendTitle = document.getElementById('publicationTrendTitle');
const publicationTrendChart = document.getElementById('publicationTrendChart');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initYearSlider();
    
    // Load data from localStorage
    const loadedData = loadGraphData();
    
    if (loadedData) {
        metadata = loadedData.metadata;
        
        // Reconstruct graph from JSON data
        originalGraph = reconstructGraph(loadedData.graphData);
        
        if (originalGraph) {
            // Update UI
            updateFilters(metadata);
            showRankingsContent();
            
            // Load initial data for the first subfield
            if (metadata.clusters && metadata.clusters.length > 0) {
                currentSubfield = metadata.clusters[0];
                subfieldSelect.value = currentSubfield;
                loadSubfieldData();
            }
        } else {
            showNoDataAlert();
        }
    } else {
        showNoDataAlert();
    }
    
    // Add event listeners
    if (subfieldSelect) {
        subfieldSelect.addEventListener('change', handleSubfieldChange);
    }
    
    if (yearSlider) {
        yearSlider.on('change', handleYearChange);
    }
});

// Initialize the year slider
function initYearSlider() {
    if (yearRangeSlider) {
        yearSlider = noUiSlider.create(yearRangeSlider, {
            start: [yearMin, yearMax],
            connect: true,
            step: 1,
            range: {
                'min': yearMin,
                'max': yearMax
            },
            format: {
                to: function(value) {
                    return Math.round(value);
                },
                from: function(value) {
                    return Number(value);
                }
            }
        });
        
        // Update the displayed year values
        yearSlider.on('update', function(values) {
            rankingYearMin.textContent = values[0];
            rankingYearMax.textContent = values[1];
        });
    }
}

// Update filters with metadata
function updateFilters(metadata) {
    // Update subfield options
    subfieldSelect.innerHTML = '';
    
    if (metadata.clusters && metadata.clusters.length > 0) {
        metadata.clusters.forEach(cluster => {
            const option = document.createElement('option');
            option.value = cluster;
            option.textContent = cluster;
            subfieldSelect.appendChild(option);
        });
    }
    
    // Update year slider range
    if (metadata.yearRange && metadata.yearRange.length === 2) {
        yearMin = metadata.yearRange[0];
        yearMax = metadata.yearRange[1];
        
        if (yearSlider) {
            yearSlider.updateOptions({
                range: {
                    'min': yearMin,
                    'max': yearMax
                }
            }, true);
            
            yearSlider.set([yearMin, yearMax]);
        }
    }
}

// Handle subfield change
function handleSubfieldChange() {
    currentSubfield = subfieldSelect.value;
    loadSubfieldData();
}

// Handle year range change
function handleYearChange() {
    loadSubfieldData();
}

// Load data for the selected subfield
function loadSubfieldData() {
    if (!currentSubfield || !originalGraph) return;
    
    const yearRange = yearSlider.get().map(Number);
    
    // Update titles
    topPapersTitle.textContent = `Top 10 Papers in ${currentSubfield}`;
    topAuthorsTitle.textContent = `Top 10 Authors in ${currentSubfield}`;
    publicationTrendTitle.textContent = `Publication Trend in ${currentSubfield}`;
    
    // Load top papers
    const papers = getTopPapers(originalGraph, currentSubfield, yearRange, 10);
    updateTopPapersTable(papers);
    updateTopPapersChart(papers);
    
    // Load top authors
    const authors = getTopAuthors(originalGraph, currentSubfield, yearRange, 10);
    updateTopAuthorsTable(authors);
    updateTopAuthorsChart(authors);
    
    // Load publication trend
    const trend = getPublicationTrend(originalGraph, currentSubfield, yearRange);
    updatePublicationTrendChart(trend);
}

// Update top papers table
function updateTopPapersTable(papers) {
    const tbody = topPapersTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!papers || papers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No papers found</td>
            </tr>
        `;
        return;
    }
    
    papers.forEach(paper => {
        const row = document.createElement('tr');
        
        // Format authors
        let authorsText = 'Unknown';
        if (paper.authors) {
            if (Array.isArray(paper.authors)) {
                authorsText = paper.authors.join(', ');
            } else if (typeof paper.authors === 'string') {
                authorsText = paper.authors;
            }
        }
        
        row.innerHTML = `
            <td>${paper.title || 'Untitled'}</td>
            <td>${authorsText}</td>
            <td>${paper.year || 'N/A'}</td>
            <td>${paper.citations || '0'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update top papers chart
function updateTopPapersChart(papers) {
    if (!papers || papers.length === 0) {
        topPapersChart.innerHTML = `<div class="alert alert-info">No data available</div>`;
        return;
    }
    
    // Prepare data for the chart (top 10 papers by citation)
    const sortedPapers = [...papers].sort((a, b) => (b.citations || 0) - (a.citations || 0)).slice(0, 10);
    
    const chartData = [{
        type: 'bar',
        orientation: 'h',
        x: sortedPapers.map(p => p.citations || 0),
        y: sortedPapers.map(p => truncateString(p.title || 'Unknown', 30)),
        marker: {
            color: 'rgba(55, 128, 191, 0.7)'
        }
    }];
    
    const layout = {
        title: `Citation Count of Top Papers in ${currentSubfield}`,
        font: {
            family: 'Arial, sans-serif',
            size: 12
        },
        xaxis: {
            title: 'Citations'
        },
        yaxis: {
            title: '',
            automargin: true
        },
        margin: {
            l: 150,
            r: 30,
            t: 50,
            b: 50
        }
    };
    
    Plotly.newPlot(topPapersChart, chartData, layout, {responsive: true});
}

// Update top authors table
function updateTopAuthorsTable(authors) {
    const tbody = topAuthorsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (!authors || authors.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No authors found</td>
            </tr>
        `;
        return;
    }
    
    authors.forEach(author => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${author.author || 'Unknown'}</td>
            <td>${author.papers || '0'}</td>
            <td>${author.citations || '0'}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update top authors chart
function updateTopAuthorsChart(authors) {
    if (!authors || authors.length === 0) {
        topAuthorsChart.innerHTML = `<div class="alert alert-info">No data available</div>`;
        return;
    }
    
    // Prepare data for the chart (top 10 authors by citation)
    const sortedAuthors = [...authors].sort((a, b) => (b.citations || 0) - (a.citations || 0)).slice(0, 10);
    
    const chartData = [{
        type: 'bar',
        orientation: 'h',
        x: sortedAuthors.map(a => a.citations || 0),
        y: sortedAuthors.map(a => a.author || 'Unknown'),
        marker: {
            color: 'rgba(50, 171, 96, 0.7)'
        }
    }];
    
    const layout = {
        title: `Citation Count of Top Authors in ${currentSubfield}`,
        font: {
            family: 'Arial, sans-serif',
            size: 12
        },
        xaxis: {
            title: 'Citations'
        },
        yaxis: {
            title: ''
        },
        margin: {
            l: 150,
            r: 30,
            t: 50,
            b: 50
        }
    };
    
    Plotly.newPlot(topAuthorsChart, chartData, layout, {responsive: true});
}

// Update publication trend chart
function updatePublicationTrendChart(trend) {
    if (!trend || trend.length === 0) {
        publicationTrendChart.innerHTML = `<div class="alert alert-info">No data available</div>`;
        return;
    }
    
    // Sort by year
    const sortedTrend = [...trend].sort((a, b) => a.year - b.year);
    
    const chartData = [{
        type: 'scatter',
        mode: 'lines+markers',
        x: sortedTrend.map(t => t.year),
        y: sortedTrend.map(t => t.count),
        line: {
            color: 'rgba(67, 133, 215, 0.8)',
            width: 2
        },
        marker: {
            color: 'rgba(67, 133, 215, 1.0)',
            size: 7
        }
    }];
    
    const layout = {
        title: `Publications per Year in ${currentSubfield}`,
        font: {
            family: 'Arial, sans-serif',
            size: 12
        },
        xaxis: {
            title: 'Year'
        },
        yaxis: {
            title: 'Number of Publications'
        }
    };
    
    Plotly.newPlot(publicationTrendChart, chartData, layout, {responsive: true});
}

// Show no data alert
function showNoDataAlert() {
    noDataAlert.style.display = 'block';
    rankingsContent.style.display = 'none';
}

// Show rankings content
function showRankingsContent() {
    noDataAlert.style.display = 'none';
    rankingsContent.style.display = 'block';
}

// Helper function to truncate long strings
function truncateString(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}