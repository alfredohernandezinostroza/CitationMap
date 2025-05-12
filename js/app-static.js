// Global variables
let sigmaInstance = null;
let graph = null;
let yearSlider = null;
let yearMin = 1900;
let yearMax = new Date().getFullYear();
let selectedNodeId = null;
let graphData = null;
let metadata = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const errorAlert = document.getElementById('errorAlert');
const successAlert = document.getElementById('successAlert');
const mainContent = document.getElementById('mainContent');
const noGraphContent = document.getElementById('noGraphContent');
const clusterFilter = document.getElementById('clusterFilter');
const authorFilter = document.getElementById('authorFilter');
const yearSliderElement = document.getElementById('yearSlider');
const yearMinElement = document.getElementById('yearMin');
const yearMaxElement = document.getElementById('yearMax');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const paperDetails = document.getElementById('paperDetails');
const statsNodes = document.getElementById('statsNodes');
const statsEdges = document.getElementById('statsEdges');
const statsComponents = document.getElementById('statsComponents');
const statsDensity = document.getElementById('statsDensity');
const graphContainer = document.getElementById('graph-container');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    initYearSlider();
    
    // Add event listeners
    uploadBtn.addEventListener('click', handleFileUpload);
    applyFiltersBtn.addEventListener('click', applyFilters);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Check localStorage for previously loaded graph
    const savedGraphData = localStorage.getItem('graphData');
    const savedMetadata = localStorage.getItem('metadata');
    
    if (savedGraphData && savedMetadata) {
        try {
            graphData = JSON.parse(savedGraphData);
            metadata = JSON.parse(savedMetadata);
            updateUIWithGraphData(graphData, metadata);
        } catch (error) {
            console.error('Error loading saved graph:', error);
            // Clear localStorage if there's an error
            localStorage.removeItem('graphData');
            localStorage.removeItem('metadata');
        }
    }
});

// Initialize the year slider
function initYearSlider() {
    if (yearSliderElement) {
        yearSlider = noUiSlider.create(yearSliderElement, {
            start: [yearMin, yearMax],
            connect: true,
            step: 1,
            range: {
                'min': yearMin,
                'max': yearMax
            },
            format: {
                to: function (value) {
                    return Math.round(value);
                },
                from: function (value) {
                    return Number(value);
                }
            }
        });
        
        // Update the displayed year values
        yearSlider.on('update', function (values) {
            yearMinElement.textContent = values[0];
            yearMaxElement.textContent = values[1];
        });
    }
}

// Handle file upload
async function handleFileUpload() {
    if (!fileInput.files || fileInput.files.length === 0) {
        showError('Please select a file to upload.');
        return;
    }
    
    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.gexf') && 
        !file.name.toLowerCase().endsWith('.graphml') && 
        !file.name.toLowerCase().endsWith('.xml')) {
        showError('Please upload a GEXF or GraphML file.');
        return;
    }
    
    // Clear previous alerts
    hideError();
    hideSuccess();
    
    try {
        // Show loading state
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
        
        // Read the file
        const fileContent = await readFileAsText(file);
        
        // Parse file based on extension
        let parsedGraph;
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (fileExtension === '.gexf' || file.name.toLowerCase().includes('gexf')) {
            parsedGraph = graphology.gexf.parse(graphology.Graph, fileContent);
        } else if (fileExtension === '.graphml' || file.name.toLowerCase().includes('graphml')) {
            parsedGraph = graphology.graphml.parse(graphology.Graph, fileContent);
        } else if (fileExtension === '.xml') {
            // Try both formats
            try {
                parsedGraph = graphology.gexf.parse(graphology.Graph, fileContent);
            } catch (gexfError) {
                try {
                    parsedGraph = graphology.graphml.parse(graphology.Graph, fileContent);
                } catch (graphmlError) {
                    throw new Error('Could not parse the XML file as either GEXF or GraphML');
                }
            }
        } else {
            throw new Error('Unsupported file format. Please upload a GEXF or GraphML file.');
        }
        
        // Apply force layout if graph doesn't have positions
        const hasPositions = parsedGraph.someNode(node => 
            parsedGraph.getNodeAttribute(node, 'x') !== undefined && 
            parsedGraph.getNodeAttribute(node, 'y') !== undefined
        );
        
        if (!hasPositions) {
            // Run force layout algorithm
            const positions = graphology.forceAtlas2.forceAtlas2(parsedGraph, { iterations: 100 });
            
            // Apply positions to the graph
            parsedGraph.forEachNode((node) => {
                if (positions[node]) {
                    parsedGraph.setNodeAttribute(node, 'x', positions[node].x);
                    parsedGraph.setNodeAttribute(node, 'y', positions[node].y);
                }
            });
        }
        
        // Extract metadata
        metadata = extractGraphMetadata(parsedGraph);
        
        // Convert to graph data for visualization
        graphData = convertGraphToJSON(parsedGraph);
        
        // Store the original graph
        graph = parsedGraph;
        
        // Save to localStorage
        localStorage.setItem('graphData', JSON.stringify(graphData));
        localStorage.setItem('metadata', JSON.stringify(metadata));
        
        // Show success message
        showSuccess('File processed successfully!');
        
        // Update UI
        updateUIWithGraphData(graphData, metadata);
        
    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'Failed to process the file.');
    } finally {
        // Reset upload button
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = 'Upload and Analyze';
    }
}

// Update UI with graph data
function updateUIWithGraphData(graphData, metadata) {
    // Show main content and hide intro content
    mainContent.style.display = 'flex';
    noGraphContent.style.display = 'none';
    
    // Update filters
    updateFilters(metadata);
    
    // Update network statistics
    updateNetworkStats(metadata.stats);
    
    // Render graph
    renderGraph(graphData);
}

// Update filters with metadata
function updateFilters(metadata) {
    // Update cluster filter
    clusterFilter.innerHTML = '<option value="all">All</option>';
    metadata.clusters.forEach(cluster => {
        const option = document.createElement('option');
        option.value = cluster;
        option.textContent = cluster;
        clusterFilter.appendChild(option);
    });
    
    // Update author filter
    authorFilter.innerHTML = '<option value="all">All</option>';
    metadata.authors.forEach(author => {
        const option = document.createElement('option');
        option.value = author;
        option.textContent = author;
        authorFilter.appendChild(option);
    });
    
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

// Update network statistics
function updateNetworkStats(stats) {
    statsNodes.textContent = stats.nodes || 'N/A';
    statsEdges.textContent = stats.edges || 'N/A';
    statsComponents.textContent = stats.components || 'N/A';
    statsDensity.textContent = stats.density ? stats.density.toFixed(4) : 'N/A';
}

// Render graph with sigma.js
function renderGraph(graphData) {
    // Clear previous graph
    if (sigmaInstance) {
        sigmaInstance.kill();
        sigmaInstance = null;
    }
    
    // Clear the container
    graphContainer.innerHTML = '';
    
    // Create a new graph instance
    const networkGraph = new graphology.Graph();
    
    // Add nodes to the graph
    graphData.nodes.forEach(node => {
        networkGraph.addNode(node.id, {
            x: node.x || Math.random(),
            y: node.y || Math.random(),
            size: node.size || 5,
            color: node.color || getColorByCluster(node.cluster || 'unknown'),
            label: node.label || node.id,
            cluster: node.cluster || 'unknown',
            ...node
        });
    });
    
    // Add edges to the graph
    graphData.edges.forEach(edge => {
        if (networkGraph.hasNode(edge.source) && networkGraph.hasNode(edge.target)) {
            networkGraph.addEdge(edge.source, edge.target, {
                color: '#ccc',
                size: 1,
                ...edge
            });
        }
    });
    
    // Create sigma instance
    sigmaInstance = new Sigma(networkGraph, graphContainer, {
        renderLabels: true,
        labelSize: 12,
        labelColor: "#000",
        labelDensity: 0.07,
        labelGridCellSize: 60,
        labelRenderedSizeThreshold: 15,
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
    });
    
    // Custom node rendering to highlight selected node
    sigmaInstance.setSetting("nodeReducer", (node, data) => {
        const res = { ...data };
        
        // Highlight selected node if any
        if (selectedNodeId === node) {
            res.color = '#ff0000';
            res.highlighted = true;
            res.size = data.size * 1.5;
        }
        
        return res;
    });
    
    // Add click event handler
    sigmaInstance.on('clickNode', ({ node }) => {
        selectedNodeId = node;
        sigmaInstance.refresh();
        showPaperDetails(node);
    });
    
    // Add background click to deselect
    sigmaInstance.getMouseCaptor().on('click', e => {
        if (!e.target.classList.contains('sigma-node')) {
            selectedNodeId = null;
            sigmaInstance.refresh();
            clearPaperDetails();
        }
    });
}

// Apply filters
function applyFilters() {
    if (!graph) return;
    
    const cluster = clusterFilter.value;
    const author = authorFilter.value;
    const yearRange = yearSlider.get();
    
    try {
        applyFiltersBtn.disabled = true;
        applyFiltersBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Applying...';
        
        // Create a filtered copy of the graph
        const filteredGraph = graph.copy();
        
        // Apply filters
        filteredGraph.forEachNode((node, attributes) => {
            let keepNode = true;
            
            // Filter by cluster/subfield
            if (cluster && cluster !== 'all') {
                const nodeCluster = attributes.cluster || attributes.subfield;
                if (nodeCluster !== cluster) {
                    keepNode = false;
                }
            }
            
            // Filter by author
            if (author && author !== 'all' && keepNode) {
                const nodeAuthors = attributes.authors;
                if (!nodeAuthors || (Array.isArray(nodeAuthors) && !nodeAuthors.includes(author)) ||
                    (typeof nodeAuthors === 'string' && !nodeAuthors.includes(author))) {
                    keepNode = false;
                }
            }
            
            // Filter by year
            if (yearRange && yearRange.length === 2 && keepNode) {
                const nodeYear = parseInt(attributes.year);
                if (isNaN(nodeYear) || nodeYear < parseInt(yearRange[0]) || nodeYear > parseInt(yearRange[1])) {
                    keepNode = false;
                }
            }
            
            // Remove node if it doesn't match filters
            if (!keepNode) {
                filteredGraph.dropNode(node);
            }
        });
        
        // Convert filtered graph to JSON
        const filteredGraphData = convertGraphToJSON(filteredGraph);
        
        // Update graph visualization
        renderGraph(filteredGraphData);
        
    } catch (error) {
        console.error('Filter error:', error);
        showError('Failed to apply filters: ' + error.message);
    } finally {
        applyFiltersBtn.disabled = false;
        applyFiltersBtn.innerHTML = 'Apply Filters';
    }
}

// Reset filters
function resetFilters() {
    clusterFilter.value = 'all';
    authorFilter.value = 'all';
    yearSlider.set([yearMin, yearMax]);
    
    // Use the original graph data
    renderGraph(graphData);
}

// Show paper details when a node is clicked
function showPaperDetails(nodeId) {
    try {
        if (!graph || !graph.hasNode(nodeId)) {
            paperDetails.innerHTML = '<div class="alert alert-danger">Paper details not found</div>';
            return;
        }
        
        const attributes = graph.getNodeAttributes(nodeId);
        
        // Get incoming edges (citations)
        const citations = graph.inDegree(nodeId);
        
        let detailsHTML = `
            <h4 class="paper-title">${attributes.title || attributes.label || 'Untitled Paper'}</h4>
            <div class="paper-section">
                <label>Authors:</label>
                <span>${formatAuthors(attributes.authors) || 'Unknown'}</span>
            </div>
            <div class="paper-section">
                <label>Year:</label>
                <span>${attributes.year || 'Unknown'}</span>
            </div>
            <div class="paper-section">
                <label>Cluster/Subfield:</label>
                <span>${attributes.cluster || attributes.subfield || 'Unknown'}</span>
            </div>
        `;
        
        // Add citation count if available
        if (citations) {
            detailsHTML += `
                <div class="paper-section">
                    <label>Citations:</label>
                    <span>${citations}</span>
                </div>
            `;
        }
        
        // Add DOI link if available
        if (attributes.doi) {
            detailsHTML += `
                <div class="paper-section">
                    <label>DOI:</label>
                    <a href="https://doi.org/${attributes.doi}" target="_blank">${attributes.doi}</a>
                </div>
            `;
        }
        
        // Add URL link if available
        if (attributes.url) {
            detailsHTML += `
                <div class="paper-section">
                    <label>URL:</label>
                    <a href="${attributes.url}" target="_blank">${attributes.url}</a>
                </div>
            `;
        }
        
        // Add abstract if available
        if (attributes.abstract) {
            detailsHTML += `
                <div class="paper-section">
                    <label>Abstract:</label>
                    <div class="abstract-container">${attributes.abstract}</div>
                </div>
            `;
        }
        
        paperDetails.innerHTML = detailsHTML;
        
    } catch (error) {
        console.error('Error showing paper details:', error);
        paperDetails.innerHTML = `<div class="alert alert-danger">Failed to load paper details: ${error.message}</div>`;
    }
}

// Clear paper details
function clearPaperDetails() {
    paperDetails.innerHTML = '<div class="alert alert-info">Click on a node in the network to view paper details</div>';
}

// Extract metadata from the graph
function extractGraphMetadata(graph) {
    // Get basic graph statistics
    const nodeCount = graph.order;
    const edgeCount = graph.size;
    
    // Calculate graph density
    const density = edgeCount / (nodeCount * (nodeCount - 1));
    
    // Get connected components
    const components = new Set();
    graph.forEachNode((node, attributes) => {
        const component = attributes.component || 0;
        components.add(component);
    });
    
    // Extract unique clusters/subfields
    const clusters = new Set();
    graph.forEachNode((node, attributes) => {
        const cluster = attributes.cluster || attributes.subfield;
        if (cluster) clusters.add(cluster);
    });
    
    // Extract unique authors
    const authors = new Set();
    graph.forEachNode((node, attributes) => {
        let nodeAuthors = attributes.authors;
        
        if (!nodeAuthors) return;
        
        if (typeof nodeAuthors === 'string') {
            // Split authors string by common separators
            nodeAuthors = nodeAuthors.split(/,|;/).map(a => a.trim()).filter(a => a);
        }
        
        if (Array.isArray(nodeAuthors)) {
            nodeAuthors.forEach(author => {
                if (author) authors.add(author);
            });
        }
    });
    
    // Extract year range
    let minYear = Infinity;
    let maxYear = -Infinity;
    
    graph.forEachNode((node, attributes) => {
        const year = parseInt(attributes.year);
        if (!isNaN(year)) {
            minYear = Math.min(minYear, year);
            maxYear = Math.max(maxYear, year);
        }
    });
    
    // Adjust year range if no years found
    if (minYear === Infinity) minYear = 1900;
    if (maxYear === -Infinity) maxYear = new Date().getFullYear();
    
    return {
        stats: {
            nodes: nodeCount,
            edges: edgeCount,
            components: components.size,
            density
        },
        clusters: Array.from(clusters),
        authors: Array.from(authors),
        yearRange: [minYear, maxYear]
    };
}

// Convert graphology graph to JSON format for visualization
function convertGraphToJSON(graph) {
    const nodes = [];
    const edges = [];
    
    // Extract nodes
    graph.forEachNode((node, attributes) => {
        nodes.push({
            id: node,
            label: attributes.label || attributes.title || node,
            title: attributes.title || attributes.label || node,
            x: attributes.x || Math.random(),
            y: attributes.y || Math.random(),
            size: attributes.size || Math.min(10, 5 + (graph.inDegree(node) / 5)),
            color: attributes.color || getColorByCluster(attributes.cluster || attributes.subfield || 'unknown'),
            cluster: attributes.cluster || attributes.subfield || 'unknown',
            year: attributes.year,
            authors: attributes.authors,
            doi: attributes.doi,
            abstract: attributes.abstract,
            url: attributes.url
        });
    });
    
    // Extract edges
    graph.forEachEdge((edge, attributes, source, target) => {
        edges.push({
            id: edge,
            source: source,
            target: target,
            ...attributes
        });
    });
    
    return { nodes, edges };
}

// Helper function to get a color based on cluster
function getColorByCluster(cluster) {
    // Simple hash function to generate a color
    const stringToHash = str => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };
    
    const hashToColor = hash => {
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 50%)`;
    };
    
    return hashToColor(stringToHash(cluster));
}

// Format authors array or string
function formatAuthors(authors) {
    if (!authors) return 'Unknown';
    
    if (Array.isArray(authors)) {
        return authors.join(', ');
    } else if (typeof authors === 'string') {
        return authors;
    }
    
    return 'Unknown';
}

// Show error message
function showError(message) {
    errorAlert.textContent = message;
    errorAlert.classList.remove('d-none');
}

// Hide error message
function hideError() {
    errorAlert.classList.add('d-none');
}

// Show success message
function showSuccess(message) {
    successAlert.textContent = message;
    successAlert.classList.remove('d-none');
}

// Hide success message
function hideSuccess() {
    successAlert.classList.add('d-none');
}

// Read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}