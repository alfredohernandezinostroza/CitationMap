// Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
// import Graph from 'https://cdn.skypack.dev/graphology';
import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
import { fitViewportToNodes } from './utils.js';
import { clearFilters, updateFilter } from './table.js';
// import Sigma from 'https://cdn.skypack.dev/sigma';
const loadingAnimation = document.getElementById('loading-animation');

loadingAnimation.classList.add('show');
// Load and render the GEXF file
const graph = await load_gexf();
clean_graph(graph);
const papersTable = await create_table();
// papersTable.getColumnDefinition("Citations")

//Update filters on value change
document.getElementById('filter-field').addEventListener('change', () => {
  updateFilter(papersTable);
});
document.getElementById('filter-type').addEventListener('change', () => {
  updateFilter(papersTable);
});
document.getElementById('filter-value').addEventListener('keyup', () => {
  updateFilter(papersTable);
});

//Clear filters on "Clear Filters" button click
document.getElementById('filter-clear').addEventListener('click', () => {
  clearFilters(papersTable);
});
// papersTable.setData(data_for_table);

let renderer = null;

// Define state for hover interactions
const state = {
  hoveredNode: undefined,
  hoveredNeighbors: undefined,
  searchQuery: '',
  selectedNode: '',
  suggestions: undefined, //new Set()
  query_label: '',
  query_author: '',
  showLabels: true,
  clusters: {
    2: {
      displaylabel: 'Basic: Adaptation',
      label: 'Basic: Adaptation',
      positions: [],
      color: '#9A9CFF',
      bias: { x: 0, y: 0 },
    },
    7: {
      displaylabel: 'Applied: Feedback and\ntraining scheduling',
      label: 'Applied: Feedback and\ntraining scheduling',
      positions: [],
      color: '#FF891B',
      bias: { x: 0, y: 0 },
    },
    12: {
      displaylabel: 'Cognitive Approach',
      label: 'Cognitive Approach',
      positions: [],
      color: '#FF6587',
      bias: { x: 0, y: 0 },
    },
    15: {
      displaylabel: 'Applied: Motivation\nand Attention',
      label: 'Applied: Motivation\nand Attention',
      positions: [],
      color: '#FC001C',
      bias: { x: 0, y: 0 },
    },
    11: {
      displaylabel: 'Basic: Sequence Learning',
      label: 'Basic: Sequence Learning',
      positions: [],
      color: '#0018FF',
      bias: { x: 0, y: 0 },
    },
    6: {
      displaylabel: 'Basic: Motor Cortex',
      label: 'Basic: Motor Cortex',
      positions: [],
      color: '#54D3FF',
      bias: { x: 0, y: 0 },
    },
    5: {
      displaylabel: 'Basic: Basal Ganglia',
      label: 'Basic: Basal Ganglia',
      positions: [],
      color: '#32AC7C',
      bias: { x: 0, y: 0 },
    },
    1: {
      displaylabel: 'Basic: Cerebellum',
      label: 'Basic: Cerebellum',
      positions: [],
      color: '#00A50F',
      bias: { x: 0, y: 0 },
    },
  }, //objects like this: { [key: int]: Cluster }
};

graph.forEachNode((node, atts) => {
  atts.size = atts.size / 8;
  // if these atts are not liststrings in the graph, they need to be converted to:
  if (!Array.isArray(atts.author)) {
    atts.author = atts.author.split(',').map((x) => x.trim().replace('  ', ' '));
  }
  if (!Array.isArray(atts.keywords)) {
    atts.keywords = atts.keywords.split(',').map((x) => x.trim().replace('  ', ' '));
  }
  if (!Array.isArray(atts.mesh)) {
    atts.mesh = atts.mesh.split(',').map((x) => x.trim().replace('  ', ' '));
  }
  if (!Array.isArray(atts.mesh_id)) {
    atts.mesh_id = atts.mesh_id.split(',').map((x) => x.trim().replace('  ', ' '));
  }
  if (atts.size < 1) atts.size = Math.sqrt(atts.size);
  // if (
  //   !(atts.modularity_class in state.clusters) &&
  //   atts.x > -9112.981 &&
  //   atts.x < -2971 &&
  //   atts.y > -6557.1426 &&
  //   atts.y < -3100
  // ) {
  //   atts.modularity_class = 1;
  //   atts.color = state.clusters[atts.modularity_class].color;
  // }
  // if (
  //   !(atts.modularity_class in state.clusters) &&
  //   atts.x > 6417.777 &&
  //   atts.x < 10697.865 &&
  //   atts.y > 3102.0493 &&
  //   atts.y < 6008.047
  // ) {
  //   atts.modularity_class = 2;
  //   atts.color = state.clusters[atts.modularity_class].color;
  // }
  if (atts.modularity_class in state.clusters)
    state.clusters[atts.modularity_class].positions.push({ x: atts.x, y: atts.y });
});

graph.forEachEdge((edge, _attributes, _source, _target, sourceAttributes) => {
  graph.setEdgeAttribute(edge, 'color', sourceAttributes.color);
});
// Label positions
for (const key in state.clusters) {
  state.clusters[key].x =
    state.clusters[key].positions.reduce((acc, p) => acc + p.x, 0) / state.clusters[key].positions.length;
  state.clusters[key].y =
    state.clusters[key].positions.reduce((acc, p) => acc + p.y, 0) / state.clusters[key].positions.length;
}
// Rotate graph
// const angle = Math.PI + Math.PI / 10;
// //this could be avoided by simply rotating the graph
// rotate_graph_n(graph, angle);
// rotate_labels(state, angle);

for (const key in state.clusters) {
  state.clusters[key].x += state.clusters[key].bias.x;
  state.clusters[key].y += state.clusters[key].bias.y;
}

try {
  renderer = await render_gexf(graph, state);
} catch (error) {
  console.error('Error rendering gexf', error);
}
window.renderer = renderer;

loadingAnimation.classList.remove('show');
// fitViewportToNodes(renderer, graph.nodes(), { animate: true });

async function load_gexf() {
  // Add a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Loading graph...';
  loadingIndicator.style.margin = '10px';
  document.querySelector('.header').appendChild(loadingIndicator);

  // let res = await fetch('./filtered_with_transferred_mesh.gexf');
  let res = await fetch('./test.gexf');
  let to_parse = await res.text();

  // Hide loading indicator
  loadingIndicator.textContent = 'Graph loaded successfully!';
  loadingIndicator.style.color = 'green';
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
  }, 4000);

  const graph = parse(window.graphology, to_parse, { addMissingNodes: true });
  return graph;
}

function clean_graph(graph) {
  graphologyLibrary.components.cropToLargestConnectedComponent(graph);
  graph.forEachNode((node) => {
    //there is a problem in which some nodes have edges towards or from nodes that are going to be deleted, thus,
    //you need to call the function twice if you want to delete all the nodes
    // if (
    //   !graph.hasNodeAttribute(node, 'citationcount') ||
    //   graph.getNodeAttribute(node, 'citationcount') == 0 ||
    //   graph.edges(node).length == 0
    // ) {
    //   graph.dropNode(node);
    //   return;
    // }
    // drop nodes that start with '10.', they are DOI duplicates lower (or uppercase) versions
    if (graph.getNodeAttribute(node, 'label').slice(0, 3) == '10.') {
      graph.dropNode(node);
      return;
    }
    if (!graph.hasNodeAttribute(node, 'abstract')) {
      graph.setNodeAttribute(node, 'abstract', '');
    }
    if (!graph.hasNodeAttribute(node, 'keywords')) {
      graph.setNodeAttribute(node, 'keywords', []);
    }
    if (!graph.hasNodeAttribute(node, 'mesh')) {
      graph.setNodeAttribute(node, 'mesh', []);
    }
    if (!graph.hasNodeAttribute(node, 'mesh_id')) {
      graph.setNodeAttribute(node, 'mesh_id', []);
    }
    if (!graph.hasNodeAttribute(node, 'citationcount')) {
      graph.setNodeAttribute(node, 'citationcount', parseInt(graph.getNodeAttribute(node, 'citationcount')));
    }
    if (!graph.hasNodeAttribute(node, 'link')) {
      graph.setNodeAttribute(node, 'link', `https://doi.org/${graph.getNodeAttribute(node, 'doi')}`);
    }
    if (graph.hasNodeAttribute(node, 'date')) {
      graph.setNodeAttribute(node, 'date', parse_year(graph.getNodeAttribute(node, 'date')));
    } else {
      graph.setNodeAttribute(node, 'date', 'undefined');
    }
  });
}

function rotate_graph_180(graph) {
  graph.forEachNode((node) => {
    graph.updateNodeAttribute(node, 'x', (x) => -x);
    graph.updateNodeAttribute(node, 'y', (y) => -y);
  });
}
function rotate_graph_n(graph, n) {
  graph.forEachNode((node) => {
    const x_old = graph.getNodeAttribute(node, 'x');
    const y_old = graph.getNodeAttribute(node, 'y');
    graph.updateNodeAttribute(node, 'x', (x) => Math.cos(n) * x + Math.sin(n) * y_old);
    graph.updateNodeAttribute(node, 'y', (y) => -Math.sin(n) * x_old + Math.cos(n) * y);
  });
}
function rotate_labels(state, n) {
  for (const key in state.clusters) {
    const cluster = state.clusters[key];
    const x_old = cluster.x;
    const y_old = cluster.y;
    cluster.x = Math.cos(n) * x_old + Math.sin(n) * y_old;
    cluster.y = -Math.sin(n) * x_old + Math.cos(n) * y_old;
  }
}

async function render_gexf(graph, state) {
  // Clean up previous renderer if it exists
  // if (renderer) {
  //   renderer.kill();
  //   renderer = null;
  // }

  // Retrieve container element
  const sigma_container = document.getElementById('sigma-container');
  const search_container = document.getElementById('search-container');
  const search_inputs = Array.from(search_container.querySelectorAll('input[type="search"]'));

  const search_input_label = document.getElementById('search-input-label');
  const search_input_author = document.getElementById('search-input-author');
  const search_input_keywords = document.getElementById('search-input-keywords');
  const search_input_journal = document.getElementById('search-input-journal');
  const search_input_abstract = document.getElementById('search-input-abstract');

  const minYearThresholdRange = document.getElementById('year-min-threshold');
  const maxYearThresholdRange = document.getElementById('year-max-threshold');
  search_inputs.push(minYearThresholdRange);
  search_inputs.push(maxYearThresholdRange);

  const search_suggestions_label = document.getElementById('suggestions-label');
  const search_suggestions_author = document.getElementById('suggestions-author');
  const search_suggestions_keywords = document.getElementById('suggestions-keywords');
  const search_suggestions_journal = document.getElementById('suggestions-journal');
  const search_suggestions_abstract = document.getElementById('suggestions-abstract');

  const selectedNodesCountText = document.getElementById('selected-nodes-count-text');
  selectedNodesCountText.textContent = `Nodes selected: ${graph.nodes().length}`;

  // Feed the datalist autocomplete values:
  search_suggestions_label.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, 'label')}"></option>`)
    .join('\n');

  search_suggestions_author.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, 'author')}"></option>`)
    .join('\n');

  search_suggestions_keywords.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, 'keywords')}"></option>`)
    .join('\n');

  const search_input_mesh = document.getElementById('search-input-mesh');
  const search_suggestions_mesh = document.getElementById('suggestions-mesh');
  if (search_input_mesh) {
    search_suggestions_mesh.innerHTML = graph
      .nodes()
      .map((node) => `<option value="${graph.getNodeAttribute(node, 'mesh')}"></option>`)
      .join('\n');
  }

  search_suggestions_journal.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, 'journal')}"></option>`)
    .join('\n');

  search_suggestions_abstract.innerHTML = graph
    .nodes()
    .map((node) => `<option value="${graph.getNodeAttribute(node, 'abstract')}"></option>`)
    .join('\n');

  // Function to handle hover state
  function setHoveredNode(node) {
    if (
      node &&
      !state.suggestions
      // ||
      // (node && state.suggestions && state.suggestions.has(node))
    ) {
      // if (node) {
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
  const renderer = new window.Sigma(graph, sigma_container, {
    zoomToSizeRatioFunction: (value) => value,
    minEdgeThickness: 0,
    enableCameraRotation: true,
    minCameraRatio: 0.08,
    maxCameraRatio: 3,
    renderLabels: false,
    labelRenderedSizeThreshold: 7,
    labelSize: 12,
    defaultNodeColor: '#6c9',
    defaultEdgeColor: '#e0e0e0',
    zIndex: true,
    enableHovering: false,
    allowInvalidContainer: true,
  });


  // Replace live filtering with an explicit Filter button to improve performance.
  const applyFilterButtonContainer = document.createElement('div');
  applyFilterButtonContainer.class = 'filter-button-container';
  const applyFilterButton = document.createElement('button');
  applyFilterButton.id = 'apply-filters-button';
  applyFilterButton.textContent = 'Filter';
  applyFilterButton.className = 'rounded-div';
  applyFilterButtonContainer.prepend(applyFilterButton)
  const globalFiltersEl = document.getElementById('filter-button-container') || search_container;
  globalFiltersEl.prepend(applyFilterButtonContainer);
  add_labels(renderer, state, sigma_container);

  applyFilterButton.addEventListener('click', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });

  // Run filtering when user presses Enter in any search input (not range sliders)
  [search_input_label, search_input_author, search_input_abstract, search_input_journal, search_input_keywords, search_input_mesh].forEach((input) => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setSearchQuery2(state, graph, renderer, search_inputs);
        }
      });
    }
  });

  // Update year labels live on slider change (without running full filter)
  if (minYearThresholdRange) {
    minYearThresholdRange.addEventListener('input', () => {
      document.getElementById('label-min-threshold').innerHTML = `Min year: ${minYearThresholdRange.value}`;
    });
  }
  if (maxYearThresholdRange) {
    maxYearThresholdRange.addEventListener('input', () => {
      document.getElementById('label-max-threshold').innerHTML = `Max year: ${maxYearThresholdRange.value}`;
    });
  }

  const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cluster"]'));
  checkboxes.forEach((checkbox) =>
    checkbox.addEventListener('change', () => {
      // inexpensive UI refresh only; full filtering runs when user clicks 'Filter' or presses Enter
      renderer.refresh({ skipIndexation: true });
    }),
  );

  // Set proper range initial value:
  minYearThresholdRange.value = '1900';
  maxYearThresholdRange.value = '2025';

  try {
    bind_graph_interactions(renderer, state);
  } catch (error) {
    console.error('Error binding graph interactions:', error);
  }
  const checkbox_labels = document.getElementById('show-labels-checkbox-input');
  console.log(checkbox_labels);
  checkbox_labels.addEventListener('change', () => {
    if (checkbox_labels.checked) {
      state.showLabels = true;
      console.log(state.showLabels);
    } else {
      state.showLabels = false;
      console.log(state.showLabels);
    }
    renderer.refresh({
      skipIndexation: true,
    });
  });

  const helpButton = document.getElementById('help-button');
  helpButton.addEventListener('click', () => {
    renderHelp();
  });

  //Bind click behavior
  renderer.on('clickNode', ({ node }) => {
    const nodeData = graph.getNodeAttributes(node);
    // console.log(nodeData)
    renderCard(nodeData);
  });
  // Bind graph interactions for hover
  renderer.on('enterNode', ({ node }) => {
    setHoveredNode(node);
  });
  renderer.on('leaveNode', () => {
    setHoveredNode(undefined);
  });

  renderer.getCamera().setState({ x: 0.42471387164646907, y: 0.3642796959806819, angle: 0, ratio: 0.539634738577534 });
  return renderer;
}

function bind_graph_interactions(renderer, state) {
  // Node reducer with hover functionality
  renderer.setSetting('nodeReducer', function (node, data) {
    const res = { ...data };
    // res.size = data.size / 3; // Reduce node size by half

    if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
      res.label = '';
      res.color = '#f6f6f6';
      res.opacity = 0.3;
    }

    if (state.selectedNode === node) {
      res.highlighted = true;
      return res;
    }

    if (state.suggestions) {
      if (state.suggestions.has(node)) {
        res.forceLabel = true;
        res.zIndex = 10;
      } else {
        res.label = '';
        res.color = '#f6f6f6';
        res.opacity = 0.3;
        res.zIndex = 0;
      }
    }
    return res;
  });

  // Edge reducer with hover functionality
  renderer.setSetting('edgeReducer', function (edge, data) {
    const res = { ...data };
    res.size = 0.11; // Base edge width
    if (
      state.hoveredNode &&
      !graph.extremities(edge).every((n) => n === state.hoveredNode || graph.areNeighbors(n, state.hoveredNode))
    ) {
      res.hidden = true;
    }

    if (state.suggestions) {
      if (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge))) res.hidden = true;
      else res.zIndex = 11;
    }
    return res;
  });

  // Hover renderer for additional visual cues
  renderer.setSetting('defaultDrawNodeHover', function (context, data, settings) {
    // if (state.query_label !== "" && state.query_author !== "") {
    // This draws the hovered node differently
    const size = settings.nodeReducer?.(data.node, data.data)?.size || data.size;
    // const size = 10;
    context.beginPath();
    context.arc(data.x, data.y, size, 0, Math.PI * 2);
    context.fillStyle = '#FFA500'; // Orange highlight for hovered node
    context.fill();

    // Draw the label for the hovered node
    if (data.label) {
      const maxWidth = 400;

      const size = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight;

      context.font = `${weight} ${size}px ${font}`;

      // Then we draw the label background
      context.fillStyle = '#FFF';
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 8;
      context.shadowColor = '#000';

      const PADDING = 2;

      // split the text into multiple lines
      const lines = [];
      let currentLine = '';
      for (const word of data.label.split(' ')) {
        if (context.measureText(currentLine + word).width > maxWidth) {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      lines.push(currentLine.trim());

      const textWidth = context.measureText(lines[0]).width,
        boxWidth = Math.round(textWidth + 5),
        boxHeight = Math.round(size * (lines.length + 1) + 2 * PADDING),
        radius = Math.max(data.size, (size * (lines.length + 1)) / 2) + PADDING;

      const angleRadian = Math.asin(boxHeight / 2 / radius);
      const xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));

      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();

      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 0;

      const color = settings.labelColor.attribute
        ? data[settings.labelColor.attribute] || settings.labelColor.color || '#000'
        : settings.labelColor.color;

      context.fillStyle = color;
      if (lines.length == 1) context.fillText(lines[0], data.x + data.size + 3, data.y + size / 3);
      else {
        lines.forEach((line, i) => {
          context.fillText(line, data.x + data.size + 3, data.y - size / 6 + i * size);
        });
      }
    }
  });
}

function setSearchQuery2(state, graph, renderer, search_inputs, checkboxes) {
  const query_label = search_inputs[0].value;
  const query_author = search_inputs[1].value;
  const query_abstract = search_inputs[2].value;
  const query_journal = search_inputs[3].value;
  const query_keywords = search_inputs[4].value;
  const query_mesh = search_inputs[5].value;
  const min_year_value = +search_inputs[6].value; //convert to int
  const max_year_value = +search_inputs[7].value; //convert to int
  let suggestions_label = undefined;
  let suggestions_author = undefined;
  let suggestions_abstract = undefined;
  let suggestions_journal = undefined;
  let suggestions_keywords = undefined;
  let suggestions_mesh = undefined;
  state.query_label = query_label;
  state.query_author = query_author;
  state.query_abstract = query_abstract;
  state.query_journal = query_journal;
  state.query_keywords = query_keywords;
  if (query_label !== '') {
    const lcQuery = query_label.toLowerCase();
    suggestions_label = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'label') }))
      .filter(({ prop }) => prop?.toLowerCase().includes(lcQuery) ?? false);
    suggestions_label = new Set(suggestions_label.map(({ id }) => id));
  }
  if (query_author !== '') {
    const queries = query_author.split(',');
    suggestions_author = new Set();
    queries.forEach((query) => {
      const lcQuery = query.toLowerCase();
      let suggestions = graph
        .nodes()
        .map((n) => ({ id: n, array_prop: graph.getNodeAttribute(n, 'author') }))
        .filter(({ array_prop }) => array_prop?.some((v) => v.toLowerCase().includes(lcQuery)) ?? false);
      suggestions_author = suggestions_author.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  if (query_abstract !== '') {
    const lcQuery = query_abstract.toLowerCase();
    suggestions_abstract = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'abstract') }))
      .filter(({ prop }) => prop?.toLowerCase().includes(lcQuery) ?? false);
    suggestions_abstract = new Set(suggestions_abstract.map(({ id }) => id));
  }
  if (query_journal !== '') {
    const lcQuery = query_journal.toLowerCase();
    suggestions_journal = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'journal') }))
      .filter(({ prop }) => prop?.toLowerCase().includes(lcQuery) ?? false);
    suggestions_journal = new Set(suggestions_journal.map(({ id }) => id));
  }
  if (query_keywords !== '') {
    const queries = query_keywords.split(',');
    suggestions_keywords = new Set();
    queries.forEach((query) => {
      const lcQuery = query.toLowerCase();
      let suggestions = graph
        .nodes()
        .map((n) => ({ id: n, array_prop: graph.getNodeAttribute(n, 'keywords') }))
        .filter(({ array_prop }) => array_prop?.some((v) => v.toLowerCase().includes(lcQuery)) ?? false);
      suggestions_keywords = suggestions_keywords.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  if (query_mesh !== '') {
    const queries = query_mesh.split(',');
    suggestions_mesh = new Set();
    queries.forEach((query) => {
      const lcQuery = query.toLowerCase();
      let suggestions = graph
        .nodes()
        .map((n) => ({ id: n, array_prop: graph.getNodeAttribute(n, 'mesh') }))
        .filter(({ array_prop }) => array_prop?.some((v) => v.toLowerCase().includes(lcQuery)) ?? false);
      suggestions_mesh = suggestions_mesh.union(new Set(suggestions.map(({ id }) => id)));
    });
  }

  let year_nodes = graph
    .nodes()
    .map((n) => ({ id: n, year: graph.getNodeAttribute(n, 'date') }))
    .filter(({ year }) => (year ? +year >= min_year_value && +year <= max_year_value : false));
  year_nodes = new Set(year_nodes.map(({ id }) => id));
  debugger;

  const checkedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cluster"]:checked'));
  const checked_mod_classes = checkedCheckboxes.map((v) => v.id.split('-')[1]);
  
  // Update visible clusters for label display (only when Filter is clicked)
  state.visibleClusters = new Set(checked_mod_classes);
  
  let nodes_in_checked_classes = graph
    .nodes()
    .map((n) => ({ id: n, mod_class: graph.getNodeAttribute(n, 'modularity_class') }))
    .filter(
      ({ mod_class }) =>
        checked_mod_classes.includes(mod_class.toString()) ||
        !Object.keys(state.clusters).includes(mod_class.toString()),
    );
  nodes_in_checked_classes = new Set(nodes_in_checked_classes.map(({ id }) => id));

  const definedSuggestions = [
    suggestions_label,
    suggestions_author,
    suggestions_abstract,
    suggestions_journal,
    suggestions_keywords,
    suggestions_mesh,
    year_nodes,
    nodes_in_checked_classes,
  ].filter(Boolean);
  state.suggestions = definedSuggestions.reduce(
    (acc, suggestion) => acc.intersection(suggestion),
    definedSuggestions[0],
  );

  document.getElementById('label-min-threshold').innerHTML = `Min year: ${search_inputs[6].value}`;
  document.getElementById('label-max-threshold').innerHTML = `Max year: ${search_inputs[7].value}`;

  const selectedNodesCountText = document.getElementById('selected-nodes-count-text');
  if (state.suggestions) selectedNodesCountText.textContent = `Nodes selected: ${state.suggestions.size}`;
  else selectedNodesCountText.textContent = `Nodes selected: ${graph.nodes().length}`;

  // if (state.suggestions && state.suggestions.size < 50)
  //   fitViewportToNodes(renderer, Array.from(state.suggestions), { animate: true });

  let new_table_data = graph.toJSON().nodes.filter((node) => state.suggestions.has(node.key));
  new_table_data = new_table_data.map((obj) => {
    let res = { ...obj, ...obj.attributes };
    delete res.attributes;
    return res;
  });

  papersTable.replaceData(new_table_data);

  renderer.refresh({
    skipIndexation: true,
  });
}

function renderCard(nodeData) {
  const cardContainer = document.querySelector('.card-container');

  cardContainer.style.display = 'block';

  const closeButton = document.createElement('button');
  closeButton.textContent = '✖';
  closeButton.classList.add('close-button');
  closeButton.addEventListener('click', () => {
    cardContainer.style.display = 'none';
  });

  const abstract = nodeData.abstract ? nodeData.abstract : 'No abstract available';
  const cardHTML = `
    <div class="close-button-card"></div>
    <div class="card-contents">
      <h3>${nodeData.label}</h3>
      <h3>${nodeData.modularity_class}</h3>
      <p>Authors: ${nodeData.author.join(', ')}</p>
      <p>Abstract: ${abstract}</p>
      ${nodeData.keywords.length > 0 ? `<p>Keywords: ${nodeData.keywords}</p>` : ''}
      ${nodeData.mesh.length > 0 ? `<p>MeSH Headers: ${nodeData.mesh.join(', ')}</p>` : ''}
      ${nodeData.mesh_id.length > 0 ? `<p>MeSH IDs: ${nodeData.mesh_id.join(', ')}</p>` : ''}
      <p>Year: ${nodeData.date}</p>
      <p>Journal: ${nodeData.journal}</p>
      <p>Citations: ${nodeData.citationcount}</p>
      <p>Link: <a href="${nodeData.link}" target="_blank">${nodeData.link.substring(8)}</a></p>
      <p>DOI: ${nodeData.doi}</p>
    </div>
  `;
  cardContainer.innerHTML = cardHTML;
  const buttonDiv = document.querySelector('.close-button-card');
  buttonDiv.appendChild(closeButton);
}
function renderHelp() {
  const helpContainer = document.querySelector('.help-container');

  helpContainer.style.display = 'block';

  const closeButton = document.createElement('button');
  closeButton.textContent = '✖';
  closeButton.classList.add('close-button');
  closeButton.addEventListener('click', () => {
    helpContainer.style.display = 'none';
  });
  const buttonDiv = document.querySelector('.close-button-help');
  buttonDiv.appendChild(closeButton);
}

function parse_year(year) {
  if (year === undefined) {
    return 'undefined';
  }
  if (year.length > 0 && !isNaN(year[0])) {
    return year.substring(0, 4);
  } else {
    return year.substring(year.length - 4);
  }
}

function add_labels(renderer, state, sigma_container) {
  // create the clustersLabel layer
  const clustersLayer = document.createElement('div');
  clustersLayer.id = 'clustersLayer';
  let clusterLabelsDoms = '';
  for (const key in state.clusters) {
    // for each cluster create a div label
    const cluster = state.clusters[key];
    // adapt the position to viewport coordinates
    const viewportPos = renderer.graphToViewport(cluster);
    viewportPos.x += cluster.bias.x;
    viewportPos.y += cluster.bias.y;
    clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}">${cluster.displaylabel}</div>`;
  }
  clustersLayer.innerHTML = clusterLabelsDoms;

  // insert the layer underneath the hovers layer
  sigma_container.insertBefore(clustersLayer, sigma_container.querySelector('.sigma-hovers'));

  // Store the current checked cluster classes in state
  state.visibleClusters = new Set(Object.keys(state.clusters));

  // Clusters labels position needs to be updated on each render
  renderer.on('afterRender', () => {
    for (const key in state.clusters) {
      const cluster = state.clusters[key];
      const clusterLabel = document.getElementById(cluster.label);
      if (clusterLabel) {
        // update position from the viewport
        const viewportPos = renderer.graphToViewport(cluster);
        clusterLabel.style.top = `${viewportPos.y}px`;
        clusterLabel.style.left = `${viewportPos.x}px`;
        clusterLabel.style.fontSize = `${0.7 / Math.sqrt(renderer.getCamera().ratio)}rem`;
      }
      // Only hide/show based on state.visibleClusters (updated by Filter button), not checkbox state
      if (!state.visibleClusters.has(key) || !state.showLabels) {
        if (clusterLabel) clusterLabel.style.display = 'none';
      } else {
        if (clusterLabel) clusterLabel.style.display = 'block';
      }
      if (state.hoveredNode) {
        if (clusterLabel) clusterLabel.style.opacity = 0.5;
      } else {
        if (clusterLabel) clusterLabel.style.opacity = 1;
      }
    }
  });

  const clusterLabelsSection = document.createElement('div');
  clusterLabelsSection.className = 'cluster-labels-section';
  document.querySelector('#global-filters').prepend(clusterLabelsSection);

  for (const cluster in state.clusters) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `cluster-${cluster}`;
    checkbox.checked = true;
    const label = document.createElement('label');
    label.textContent = state.clusters[cluster].label;
    label.htmlFor = `cluster-${cluster}`;
    const clusterLabelsRow = document.createElement('div');
    clusterLabelsRow.className = 'cluster-labels-row';
    label.prepend(checkbox);
    clusterLabelsRow.appendChild(label);
    clusterLabelsSection.appendChild(clusterLabelsRow);
  }
}

async function create_table() {
  let data_for_table = graph.toJSON().nodes.map((obj) => {
    let res = { ...obj, ...obj.attributes };
    delete res.attributes;
    return res;
  });
  const widths = [324, 113.6, 43.2, 40.8, 113.6, 113.6, 114.786669921875];
  const papersTable = new Tabulator('#top-papers-table', {
    data: data_for_table,
    // layout: 'fitData',
    layout: 'fitColumns',
    // autoColumns: true,
    pagination: 'local', // enable local pagination
    paginationSize: 10, // show 10 rows per page
    paginationSizeSelector: [5, 10, 20, 50], //  page size selector
    columns: [
      { title: 'Paper', field: 'label', width: widths[0] },
      { title: 'Authors', field: 'author', width: widths[1] },
      { title: 'Citations', field: 'citationcount', sorter: 'number', width: widths[2] },
      { title: 'Year', field: 'date', sorter: 'number', width: widths[3] },
      { title: 'Journal', field: 'journal', width: widths[4] },
      { title: 'Link', field: 'link', formatter: 'link', formatterParams: { target: '_blank' }, width: widths[5] },
      { title: 'Doi', field: 'doi', width: widths[6] },
    ],
    initialSort: [
      { column: 'citationcount', dir: 'desc' }, // Sort by 'age' descending on load
    ],
  });
  // Wait for the table to be fully initialized
  await new Promise((resolve) => {
    papersTable.on('tableBuilt', () => {
      resolve();
    });
  });

  const tabButton1 = document.getElementById('tab-button-1');
  const tabButton2 = document.getElementById('tab-button-2');
  const tabPane1 = document.getElementById('tab-pane-1');
  const tabPane2 = document.getElementById('tab-pane-2');

  tabButton1.addEventListener('click', () => {
    tabButton1.classList.add('active');
    tabButton2.classList.remove('active');
    tabPane1.classList.add('active');
    tabPane2.classList.remove('active');
  });

  tabButton2.addEventListener('click', () => {
    tabButton1.classList.remove('active');
    tabButton2.classList.add('active');
    tabPane1.classList.remove('active');
    tabPane2.classList.add('active');
  });

  return papersTable;
}
