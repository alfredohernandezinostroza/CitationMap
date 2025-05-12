// This file manages data sharing between multiple pages in the static GitHub Pages version

// Load graph data from localStorage
function loadGraphData() {
    const savedGraphData = localStorage.getItem('graphData');
    const savedMetadata = localStorage.getItem('metadata');
    
    if (savedGraphData && savedMetadata) {
        try {
            return {
                graphData: JSON.parse(savedGraphData),
                metadata: JSON.parse(savedMetadata)
            };
        } catch (error) {
            console.error('Error loading saved graph:', error);
            // Clear localStorage if there's an error
            localStorage.removeItem('graphData');
            localStorage.removeItem('metadata');
        }
    }
    
    return null;
}

// Utility function to reconstruct a Graphology graph from JSON data
function reconstructGraph(graphData) {
    if (!graphData || !graphData.nodes || !graphData.edges) {
        return null;
    }
    
    const graph = new graphology.Graph();
    
    // Add nodes
    graphData.nodes.forEach(node => {
        if (!graph.hasNode(node.id)) {
            graph.addNode(node.id, node);
        }
    });
    
    // Add edges
    graphData.edges.forEach(edge => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.id)) {
            graph.addEdgeWithKey(edge.id, edge.source, edge.target, edge);
        }
    });
    
    return graph;
}

// Get top papers for a subfield
function getTopPapers(graph, subfield, yearRange, limit = 10) {
    if (!graph) return [];
    
    const papers = [];
    
    graph.forEachNode((node, attributes) => {
        // Check if the node belongs to the requested subfield
        const nodeSubfield = attributes.cluster || attributes.subfield;
        if (subfield && subfield !== 'all' && nodeSubfield !== subfield) {
            return;
        }
        
        // Check if the node's year is within the requested range
        const nodeYear = parseInt(attributes.year);
        if (yearRange && yearRange.length === 2 && 
            (!nodeYear || nodeYear < yearRange[0] || nodeYear > yearRange[1])) {
            return;
        }
        
        // Get citation count (in-degree)
        const citations = graph.inDegree(node);
        
        papers.push({
            id: node,
            title: attributes.title || attributes.label || node,
            authors: attributes.authors,
            year: attributes.year,
            citations
        });
    });
    
    // Sort papers by citation count (descending)
    papers.sort((a, b) => b.citations - a.citations);
    
    // Limit the number of results
    return papers.slice(0, limit);
}

// Get top authors for a subfield
function getTopAuthors(graph, subfield, yearRange, limit = 10) {
    if (!graph) return [];
    
    // Map to store author data
    const authorMap = new Map();
    
    graph.forEachNode((node, attributes) => {
        // Check if the node belongs to the requested subfield
        const nodeSubfield = attributes.cluster || attributes.subfield;
        if (subfield && subfield !== 'all' && nodeSubfield !== subfield) {
            return;
        }
        
        // Check if the node's year is within the requested range
        const nodeYear = parseInt(attributes.year);
        if (yearRange && yearRange.length === 2 && 
            (!nodeYear || nodeYear < yearRange[0] || nodeYear > yearRange[1])) {
            return;
        }
        
        // Get authors from the node
        let authors = attributes.authors;
        if (!authors) return;
        
        // Convert string of authors to array if needed
        if (typeof authors === 'string') {
            authors = authors.split(/,|;/).map(a => a.trim()).filter(a => a);
        } else if (!Array.isArray(authors)) {
            return;
        }
        
        // Get citation count for this paper
        const citations = graph.inDegree(node);
        
        // Update author map
        authors.forEach(author => {
            if (!author) return;
            
            if (!authorMap.has(author)) {
                authorMap.set(author, { papers: 0, citations: 0 });
            }
            
            const authorData = authorMap.get(author);
            authorData.papers += 1;
            authorData.citations += citations;
        });
    });
    
    // Convert map to array
    const authors = Array.from(authorMap.entries()).map(([author, data]) => ({
        author,
        papers: data.papers,
        citations: data.citations
    }));
    
    // Sort authors by citation count (descending)
    authors.sort((a, b) => b.citations - a.citations);
    
    // Limit the number of results
    return authors.slice(0, limit);
}

// Get publication trend for a subfield
function getPublicationTrend(graph, subfield, yearRange) {
    if (!graph) return [];
    
    // Map to store publication counts by year
    const yearMap = new Map();
    
    // Set min and max years from yearRange
    const queryMinYear = yearRange && yearRange.length === 2 ? yearRange[0] : null;
    const queryMaxYear = yearRange && yearRange.length === 2 ? yearRange[1] : null;
    
    graph.forEachNode((node, attributes) => {
        // Check if the node belongs to the requested subfield
        const nodeSubfield = attributes.cluster || attributes.subfield;
        if (subfield && subfield !== 'all' && nodeSubfield !== subfield) {
            return;
        }
        
        // Get node year
        const nodeYear = parseInt(attributes.year);
        if (!nodeYear) return;
        
        // Check if the node's year is within the requested range
        if (queryMinYear && queryMaxYear && (nodeYear < queryMinYear || nodeYear > queryMaxYear)) {
            return;
        }
        
        // Update year count
        if (!yearMap.has(nodeYear)) {
            yearMap.set(nodeYear, 0);
        }
        
        yearMap.set(nodeYear, yearMap.get(nodeYear) + 1);
    });
    
    // Fill in missing years
    const actualMinYear = queryMinYear || (yearMap.size > 0 ? Math.min(...yearMap.keys()) : 1900);
    const actualMaxYear = queryMaxYear || (yearMap.size > 0 ? Math.max(...yearMap.keys()) : new Date().getFullYear());
    
    for (let year = actualMinYear; year <= actualMaxYear; year++) {
        if (!yearMap.has(year)) {
            yearMap.set(year, 0);
        }
    }
    
    // Convert map to array
    const trend = Array.from(yearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);
    
    return trend;
}