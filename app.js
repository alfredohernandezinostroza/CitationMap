
    // Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
    import Graph from 'https://cdn.skypack.dev/graphology';
    import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
    import Sigma from 'https://cdn.skypack.dev/sigma';

    // Load and render the GEXF file
    const graph = await load_gexf();
    let renderer = null;
    
      // Define state for hover interactions
    const state = {
      hoveredNode: undefined,
      hoveredNeighbors: undefined,
      searchQuery: "",
      selectedNode: "",
      suggestions: undefined//new Set()
    };

    try {
      renderer = render_gexf(graph, state)//.catch(error => console.error('Error rendering gexf', error));
    } catch (error) {
      console.error("Error rendering gexf", error);
    }

    async function load_gexf() {
      let renderer = null;

      // Add a loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.textContent = 'Loading graph...';
      loadingIndicator.style.margin = '10px';
      document.querySelector('.header').appendChild(loadingIndicator);

      let res = await fetch('./MotorLearning.gexf');
      let to_parse = await res.text();

      
      // Hide loading indicator
      loadingIndicator.textContent = 'Graph loaded successfully!';
      loadingIndicator.style.color = 'green';
      setTimeout(() => {
        loadingIndicator.style.display = 'none';
      }, 4000);

      const graph = parse(Graph, to_parse);
      return graph
    }

    function render_gexf(graph, state) {
      // Clean up previous renderer if it exists
      // if (renderer) {
      //   renderer.kill();
      //   renderer = null;
      // }

      // Retrieve container element
      const sigma_container = document.getElementById("sigma-container");
      const search_input = document.getElementById("search-input");
      const search_suggestions = document.getElementById("suggestions");
      const search_suggestions_2 = document.getElementById("suggestions-2");

      // Feed the datalist autocomplete values:
      search_suggestions.innerHTML = graph
        .nodes()
        .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
        .join("\n");
      
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
      const renderer = new Sigma(graph, sigma_container, {
        minCameraRatio: 0.08,
        maxCameraRatio: 3,
        renderLabels: false,
        labelRenderedSizeThreshold: 7,
        labelSize: 12,
        defaultNodeColor: "#6c9",
        defaultEdgeColor: "#e0e0e0",
      });
      
      // Bind search input interactions:
      search_input.addEventListener("input", () => {
        setSearchQuery(search_input.value || "", state, search_input, graph, renderer);
      });
      // search_input.addEventListener("blur", () => {
      //   setSearchQuery("", state, search_input, graph, renderer);
      // });

      try{
        bind_graph_interactions2(renderer, state);
      } catch (error) {
        console.error('Error binding graph interactions:', error);
      }
      // Bind graph interactions for hover
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(node);
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(undefined);
      });
      return renderer;
    }
    
    function bind_graph_interactions2(renderer, state) {
      // Node reducer with hover functionality
      renderer.setSetting( "nodeReducer", function(node, data) {
        const res = { ...data };
        res.size = data.size / 3; // Reduce node size by half

        if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
          res.label = "";
          res.color = "#f6f6f6";
          res.opacity = 0.3;
        }

        if (state.selectedNode === node) {
          res.highlighted = true;
          return res;
        }
        
        if (state.suggestions) {
          if (state.suggestions.has(node)) {
            res.forceLabel = true;
          } else {
            res.label = "";
            res.color = "#f6f6f6";
          }
        }
        return res;
      });
      
      // Edge reducer with hover functionality
      renderer.setSetting( "edgeReducer", function(edge, data){
        const res = { ...data };
        res.size = 0.00001;        // Base edge width
        res.color = "#e0e0e0"; // Edge color
        if (
          state.hoveredNode &&
          !graph.extremities(edge).every((n) => n === state.hoveredNode || graph.areNeighbors(n, state.hoveredNode))
        ) {
          res.hidden = true;
        }

        if (
          state.suggestions &&
          (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))
        ) {
          res.hidden = true;
        }

        return res;
      });
      
      // Hover renderer for additional visual cues
      renderer.setSetting( "hoverRenderer", function(context, data, settings) {
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
      });
    }

    function setSearchQuery(query, state, search_input, graph, renderer) {
      state.searchQuery = query;

      if (search_input.value !== query) search_input.value = query;

      if (query) {
        const lcQuery = query.toLowerCase();
        const suggestions = graph
          .nodes()
          .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label")}))
          .filter(({ label }) => label.toLowerCase().includes(lcQuery));

        // If we have a single perfect match, them we remove the suggestions, and
        // we consider the user has selected a node through the datalist
        // autocomplete:
        if (suggestions.length === 1 && suggestions[0].label === query) {
          state.selectedNode = suggestions[0].id;
          state.suggestions = undefined;

          // Move the camera to center it on the selected node:
          const nodePosition = renderer.getNodeDisplayData(state.selectedNode);
          renderer.getCamera().animate(nodePosition, {
            duration: 500,
          });
        }
        // Else, we display the suggestions list:
        else {
          state.selectedNode = undefined;
          state.suggestions = new Set(suggestions.map(({ id }) => id));
        }
      }
      // If the query is empty, then we reset the selectedNode / suggestions state:
      else {
        state.selectedNode = undefined;
        state.suggestions = undefined;
      }

      // Refresh rendering
      // You can directly call `renderer.refresh()`, but if you need performances
      // you can provide some options to the refresh method.
      // In this case, we don't touch the graph data so we can skip its reindexation
      renderer.refresh({
        skipIndexation: true,
      });
    }