
    // Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
    import Graph from 'https://cdn.skypack.dev/graphology';
    import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
    import Sigma from 'https://cdn.skypack.dev/sigma';

    // This follows the example structure closely, but loads a specific file
    const init = () => {
      let renderer = null;

      // Add a loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.textContent = 'Loading graph...';
      loadingIndicator.style.margin = '10px';
      document.querySelector('.header').appendChild(loadingIndicator);

      // Load the specific GEXF file directly
      fetch('./MotorLearning.gexf')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .then(gexf => {
          // Hide loading indicator
          loadingIndicator.textContent = 'Graph loaded successfully!';
          loadingIndicator.style.color = 'green';
          setTimeout(() => {
            loadingIndicator.style.display = 'none';
          }, 2000);
          
          // Parse GEXF string:
          const graph = parse(Graph, gexf);

          // Retrieve container element
          const container = document.getElementById("sigma-container");

          // Clean up previous renderer if it exists
          if (renderer) {
            renderer.kill();
            renderer = null;
          }
          
          // Define state for hover interactions
          const state = {
            hoveredNode: undefined,
            hoveredNeighbors: undefined
          };

          // Function to handle hover state
          function setHoveredNode(node) {
            if (node) {
              state.hoveredNode = node;
              state.hoveredNeighbors = new Set(graph.neighbors(node));
            } else {
              state.hoveredNode = undefined;
              state.hoveredNeighbors = undefined;
            }

            // Refresh rendering without reindexing
            renderer.refresh({
              skipIndexation: true,
            });
          }
          
          // Instantiate sigma with custom settings for labels
          renderer = new Sigma(graph, container, {
            minCameraRatio: 0.08,
            maxCameraRatio: 3,
            renderLabels: false,
            labelRenderedSizeThreshold: 7,
            labelSize: 12,
            defaultNodeColor: "#6c9",
            defaultEdgeColor: "#e0e0e0",
            
            // Node reducer with hover functionality
            nodeReducer: (node, data) => {
              const res = {...data};
              res.size = data.size / 3; // Reduce node size by half
              
              // Apply hover effects
              if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
                res.label = "";
                res.color = "#f6f6f6";
                res.opacity = 0.3;
              }
              
              // Highlight hovered node
              if (state.hoveredNode === node) {
                res.highlighted = true;
                res.forceLabel = true;
              }
              
              return res;
            },
            
            // Edge reducer with hover functionality
            edgeReducer: (edge, data) => {
              const res = {...data};
              res.size = 0.00001;        // Base edge width
              res.color = "#e0e0e0"; // Edge color
              // Hide edges not connected to hovered node
              if (
                state.hoveredNode &&
                !graph.extremities(edge).every((n) => 
                  n === state.hoveredNode || 
                  (state.hoveredNeighbors && state.hoveredNeighbors.has(n))
                )
              ) {
                res.hidden = true;
              }
              
              return res;
            },
            
            // Hover renderer for additional visual cues
            hoverRenderer: (context, data, settings) => {
              // This draws the hovered node differently
              const size = settings.nodeReducer?.(data.node, data.data)?.size || data.data.size;
              context.beginPath();
              context.arc(data.x, data.y, size, 0, Math.PI * 2);
              context.fillStyle = "#FFA500"; // Orange highlight for hovered node
              context.fill();
              
              // Draw the label for the hovered node
              if (data.label) {
                context.font = "bold 12px Arial";
                context.fillStyle = "#000";
                context.textAlign = "center";
                context.fillText(data.label, data.x, data.y + size + 12);
              }
            }
          });
          
          // Bind graph interactions for hover
          renderer.on("enterNode", ({ node }) => {
            setHoveredNode(node);
          });
          
          renderer.on("leaveNode", () => {
            setHoveredNode(undefined);
          });
          
          // Add minimal keyboard controls for zooming
          document.addEventListener("keydown", (e) => {
            const camera = renderer.getCamera();
            if (e.key === "+" || e.key === "=") {
              camera.animatedZoom({ duration: 600 });
            } else if (e.key === "-") {
              camera.animatedUnzoom({ duration: 600 });
            } else if (e.key === "0") {
              camera.animatedReset({ duration: 600 });
            }
          });
        })
        .catch(error => {
          loadingIndicator.textContent = `Error loading graph: ${error.message}`;
          loadingIndicator.style.color = 'red';
          console.error('Error loading the GEXF file:', error);
        });
    };

    // Initialize the app
    init();