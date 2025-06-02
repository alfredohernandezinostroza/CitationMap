// Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
// import Graph from 'https://cdn.skypack.dev/graphology';
import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
import { fitViewportToNodes } from './utils.js';
import { clearFilters, updateFilter } from './table.js';
// import Sigma from 'https://cdn.skypack.dev/sigma';

// Load and render the GEXF file
const graph = await load_gexf();
clean_graph(graph);
// clean_graph(graph);
// rotate_graph_180(graph);
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

// const tabButtons = document.querySelectorAll('.tab-button');
// const tabPanes = document.querySelectorAll('.tab-pane');
// console.log(tabButtons);
// console.log(tabPanes);

// tabButtons.forEach((button, index) => {
//   button.addEventListener('click', () => {
//     console.log(`removed active class from button ${index}`);
//     tabButtons.forEach((button) => button.classList.remove('active'));
//     button.classList.add('active');
//     tabPanes.forEach((pane) => pane.classList.remove('active'));
//     tabPanes[index].classList.add('active');
//   });
// });
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
    5915: { label: 'Motor Cortex', positions: [], color: 'rgb(223, 137, 255)' },
    1334: { label: 'Adaptation', positions: [], color: 'rgb(115, 192, 0)' },
    1125: { label: 'Other Applied', positions: [], color: 'rgb(0, 196, 255)' },
    624: { label: 'Sequence Learning', positions: [], color: 'rgb(76, 70, 62)' },
    584: { label: 'Cerebellum', positions: [], color: 'rgb(255, 136, 5)' },
    282: { label: 'Feedback/Rehabilitation', positions: [], color: 'rgb(255, 85, 132)' },
    5738: { label: 'Attention/Motivation', positions: [], color: 'rgb(0, 189, 148)' },
    840: { label: 'Observational Practice', positions: [], color: 'rgb(211, 179, 176)' },
    1: { label: 'Cognitive approach', positions: [], color: 'rgb(209, 17, 0)' },
    2: { label: 'Basal Ganglia', positions: [], color: 'rgb(165, 73, 241)' },
  }, //objects like this: { [key: int]: Cluster }
};

graph.forEachNode((node, atts) => {
  // atts.size = Math.sqrt(graph.degree(node) / 50);
  // atts.size = Math.ceil(atts.citationcount / 100);
  atts.size = atts.size / 85;
  if (atts.size < 1) atts.size = Math.sqrt(atts.size);
  if (
    !(atts.modularity_class in state.clusters) &&
    atts.x > -9112.981 &&
    atts.x < -2971 &&
    atts.y > -6557.1426 &&
    atts.y < -3100
  ) {
    atts.modularity_class = 1;
    atts.color = state.clusters[atts.modularity_class].color;
  }
  if (
    !(atts.modularity_class in state.clusters) &&
    atts.x > 6417.777 &&
    atts.x < 10697.865 &&
    atts.y > 3102.0493 &&
    atts.y < 6008.047
  ) {
    atts.modularity_class = 2;
    atts.color = state.clusters[atts.modularity_class].color;
  }
  if (atts.modularity_class in state.clusters)
    state.clusters[atts.modularity_class].positions.push({ x: atts.x, y: atts.y });
  // node color depends on the cluster it belongs to
  // atts.color = cluster.color;
  // // node size depends on its degree
  // store cluster's nodes positions to calculate cluster label position
});
rotate_graph_180(graph);

graph.forEachEdge((edge, _attributes, _source, _target, sourceAttributes) => {
  graph.setEdgeAttribute(edge, 'color', sourceAttributes.color);
});

for (const key in state.clusters) {
  state.clusters[key].x =
    -state.clusters[key].positions.reduce((acc, p) => acc + p.x, 0) / state.clusters[key].positions.length;
  state.clusters[key].y =
    -state.clusters[key].positions.reduce((acc, p) => acc + p.y, 0) / state.clusters[key].positions.length;
}
const angle = Math.PI / 10;
rotate_graph_n(graph, angle);
rotate_labels(state, angle);

try {
  renderer = await render_gexf(graph, state); //.catch(error => console.error('Error rendering gexf', error));
} catch (error) {
  console.error('Error rendering gexf', error);
}
// fitViewportToNodes(renderer, graph.nodes(), { animate: true });

async function load_gexf() {
  let renderer = null;

  // Add a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Loading graph...';
  loadingIndicator.style.margin = '10px';
  document.querySelector('.header').appendChild(loadingIndicator);

  // let res = await fetch('./MotorLearning.gexf');
  let res = await fetch('./all.gexf');
  // let res = await fetch('./just_center.gexf');
  // let res = await fetch("./with_list_authors_deleted_outside_bounds.gexf");
  let to_parse = await res.text();

  // Hide loading indicator
  loadingIndicator.textContent = 'Graph loaded successfully!';
  loadingIndicator.style.color = 'green';
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
  }, 4000);

  const graph = parse(window.graphology, to_parse);
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

    if (!graph.hasNodeAttribute(node, 'abstract')) {
      graph.setNodeAttribute(node, 'abstract', '');
    }
    if (!graph.hasNodeAttribute(node, 'keywords')) {
      graph.setNodeAttribute(node, 'keywords', []);
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
    enableCameraRotation: false,
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

  add_labels(renderer, state, sigma_container);

  // Bind search input interactions:
  search_input_label.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });
  search_input_author.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });
  search_input_abstract.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });
  search_input_journal.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });
  search_input_keywords.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
  });

  // Bind labels threshold to range input
  minYearThresholdRange.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
    // renderer?.setSetting('labelRenderedSizeThreshold', +labelsThresholdRange.value);
  });
  maxYearThresholdRange.addEventListener('input', () => {
    setSearchQuery2(state, graph, renderer, search_inputs);
    // renderer?.setSetting('labelRenderedSizeThreshold', +labelsThresholdRange.value);
  });

  const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cluster"]'));
  checkboxes.forEach((checkbox) =>
    checkbox.addEventListener('change', () => {
      setSearchQuery2(state, graph, renderer, search_inputs);
      // if (state.suggestions) fitViewportToNodes(renderer, Array.from(state.suggestions), { animate: true });
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

  renderer
    .getCamera()
    .setState({ x: 0.5177388063772427, y: 0.46557488233757816, angle: 0, ratio: 0.29972943598335855 });
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
    res.size = 0.09; // Base edge width
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
  const min_year_value = +search_inputs[5].value; //convert to int
  const max_year_value = +search_inputs[6].value; //convert to int
  let suggestions_label = undefined;
  let suggestions_author = undefined;
  let suggestions_abstract = undefined;
  let suggestions_journal = undefined;
  let suggestions_keywords = undefined;
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

  let year_nodes = graph
    .nodes()
    .map((n) => ({ id: n, year: graph.getNodeAttribute(n, 'date') }))
    .filter(({ year }) => (year ? +year >= min_year_value && +year <= max_year_value : false));
  year_nodes = new Set(year_nodes.map(({ id }) => id));
  debugger;

  const checkedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cluster"]:checked'));
  const checked_mod_classes = checkedCheckboxes.map((v) => v.id.split('-')[1]);
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
    year_nodes,
    nodes_in_checked_classes,
  ].filter(Boolean);
  state.suggestions = definedSuggestions.reduce(
    (acc, suggestion) => acc.intersection(suggestion),
    definedSuggestions[0],
  );

  document.getElementById('label-min-threshold').innerHTML = `Min year: ${search_inputs[5].value}`;
  document.getElementById('label-max-threshold').innerHTML = `Max year: ${search_inputs[6].value}`;

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

function setSearchQueryMulti(state, search_input, property, graph, renderer, search_inputs) {
  // function setSearchQuery(query, state, search_input, graph, renderer) {
  // state.searchQuery = query;

  //   if (search_input.value !== query){
  //     search_input.value = query
  //     console.log(`${query} vs ${search_input.value}`);
  // }
  const suggestions_array = [undefined, undefined];
  const properties = ['label', 'author'];
  search_inputs.forEach((search_input, i) => {
    const query = search_input.value;
    if (query !== '') {
      const lcQuery = query.toLowerCase();
      const suggestions = graph
        .nodes()
        .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, properties[i]) }))
        .filter(({ prop }) => {
          if (Array.isArray(prop)) {
            prop.some((v) => v.toLowerCase().includes(lcQuery));
          } else {
            prop.toLowerCase().includes(lcQuery);
          }
        });
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
        suggestions_array[i] = new Set(suggestions.map(({ id }) => id));
        // state.suggestions = new Set(suggestions.map(({ id }) => id));
      }
    }
    // If the query is empty, then we reset the selectedNode / suggestions state:
    else {
      state.selectedNode = undefined;
      suggestions_array[i] = undefined;
      // state.suggestions = undefined;
    }
  });
  // console.log(`label: ${Boolean(suggestions_array[0])}, author: ${Boolean(suggestions_array[1])}`);
  if (suggestions_array[0] && suggestions_array[1])
    state.suggestions = suggestions_array[0].union(suggestions_array[1]);
  else if (suggestions_array[0]) state.suggestions = suggestions_array[0];
  else if (suggestions_array[1]) state.suggestions = suggestions_array[1];
  else state.suggestions = undefined;
  // console.log(state.suggestions);
  // Refresh rendering
  // You can directly call `renderer.refresh()`, but if you need performances
  // you can provide some options to the refresh method.
  // In this case, we don't touch the graph data so we can skip its reindexation
  renderer.refresh({
    skipIndexation: true,
  });
}

function renderCard(nodeData) {
  // console.log(nodeData)
  const cardContainer = document.querySelector('.card-container');
  // const buttonDiv = document.createElement("div");

  cardContainer.style.display = 'block';

  const closeButton = document.createElement('button');
  closeButton.textContent = '✖';
  closeButton.classList.add('close-button');
  closeButton.addEventListener('click', () => {
    cardContainer.style.display = 'none';
  });

  const abstract = nodeData.abstract ? nodeData.abstract : 'No abstract available';
  // : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet nulla auctor, vestibulum magna sed, convallis ex. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.";
  // <p>Authors: ${nodeData.author.join(', ')}</p>
  const cardHTML = `
    <div class="close-button-card"></div>
    <div class="card-contents">
      <h3>${nodeData.label}</h3>
      <p>Authors: ${nodeData.author.join(', ')}</p>
      <p>Abstract: ${abstract}</p>
      ${nodeData.keywords.length > 0 ? `<p>Keywords: ${nodeData.keywords}</p>` : ''}
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
    clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}">${cluster.label}</div>`;
  }
  clustersLayer.innerHTML = clusterLabelsDoms;

  // insert the layer underneath the hovers layer
  sigma_container.insertBefore(clustersLayer, sigma_container.querySelector('.sigma-hovers'));

  // Clusters labels position needs to be updated on each render
  renderer.on('afterRender', () => {
    const checkedCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"][id^="cluster"]:checked'));
    const checked_mod_classes = checkedCheckboxes.map((v) => v.id.split('-')[1]);
    for (const key in state.clusters) {
      const cluster = state.clusters[key];
      const clusterLabel = document.getElementById(cluster.label);
      if (clusterLabel) {
        // update position from the viewport
        const viewportPos = renderer.graphToViewport(cluster);
        clusterLabel.style.top = `${viewportPos.y}px`;
        clusterLabel.style.left = `${viewportPos.x}px`;
      }
      if (!checked_mod_classes.includes(key) || !state.showLabels) {
        clusterLabel.style.display = 'none';
      } else {
        clusterLabel.style.display = 'block';
      }
      if (state.hoveredNode) {
        clusterLabel.style.opacity = 0.5;
      } else {
        clusterLabel.style.opacity = 1;
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
  // let data_for_table = graph.toJSON().nodes.map((obj) => {
  //   return Object.assign({}, obj, obj.attributes);
  // });
  // const widths = [
  //   '0.324492145099706%',
  //   '0.14221569322271063%',
  //   '0.05408202418328433%',
  //   '0.051077467284212974%',
  //   '0.14221569322271063%',
  //   '0.14221569322271063%',
  //   '0.14370128376466482%',
  // ];

  // const widths = [324, 142, 54, 51, 142, 142, 143.48333740234375];
  const widths = [324, 113.6, 43.2, 40.8, 113.6, 113.6, 114.786669921875];
  const papersTable = new Tabulator('#top-papers-table', {
    data: data_for_table,
    // layout: 'fitData',
    layout: 'fitColumns',
    // autoColumns: true,
    pagination: 'local', // enable local pagination
    paginationSize: 10, // show 10 rows per page
    paginationSizeSelector: [5, 10, 20, 50], // optional page size selector
    // columns: [
    //   { title: 'Paper', field: 'label', width: widths[0] },
    //   { title: 'Authors', field: 'author', width: widths[1] },
    //   { title: 'Citations', field: 'citationcount', sorter: 'number', width: widths[2] },
    //   { title: 'Year', field: 'date', sorter: 'number', width: widths[3] },
    //   { title: 'Journal', field: 'journal', width: widths[4] },
    //   { title: 'Link', field: 'link', formatter: 'link', formatterParams: { target: '_blank' }, width: widths[5] },
    //   { title: 'Doi', field: 'doi', width: widths[6] },
    // ],
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

  // console.log(`formatter: ${papersTable.getColumnDefinition('Citations').formatter}`);
  // console.log(`type: ${papersTable.getColumnDefinition('Citations').type}`);

  return papersTable;
}
