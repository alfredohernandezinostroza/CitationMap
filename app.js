// Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
import Graph from 'https://cdn.skypack.dev/graphology';
import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
import { fitViewportToNodes } from './utils.js';
// import Sigma from 'https://cdn.skypack.dev/sigma';

// Load and render the GEXF file
const graph = await load_gexf();
clean_graph(graph);
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
// Define state for hover interactions
const state = {
  hoveredNode: undefined,
  hoveredNeighbors: undefined,
  searchQuery: '',
  selectedNode: '',
  suggestions: undefined, //new Set()
  query_label: '',
  query_author: '',
};

try {
  renderer = render_gexf(graph, state); //.catch(error => console.error('Error rendering gexf', error));
} catch (error) {
  console.error('Error rendering gexf', error);
}

async function load_gexf() {
  let renderer = null;

  // Add a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Loading graph...';
  loadingIndicator.style.margin = '10px';
  document.querySelector('.header').appendChild(loadingIndicator);

  // let res = await fetch('./MotorLearning.gexf');
  let res = await fetch('./just_center.gexf');
  // let res = await fetch("./with_list_authors_deleted_outside_bounds.gexf");
  let to_parse = await res.text();

  // Hide loading indicator
  loadingIndicator.textContent = 'Graph loaded successfully!';
  loadingIndicator.style.color = 'green';
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
  }, 4000);

  const graph = parse(Graph, to_parse);
  return graph;
}

function clean_graph(graph) {
  graph.forEachNode((node) => {
    if (!graph.hasNodeAttribute(node, 'abstract')) {
      graph.setNodeAttribute(node, 'abstract', '');
    }
    if (!graph.hasNodeAttribute(node, 'keywords')) {
      graph.setNodeAttribute(node, 'keywords', []);
    }
    if (graph.hasNodeAttribute(node, 'date')) {
      graph.setNodeAttribute(node, 'date', parse_year(graph.getNodeAttribute(node, 'date')));
    } else {
      graph.setNodeAttribute(node, 'date', 'undefined');
    }
  });
}

function render_gexf(graph, state) {
  // Clean up previous renderer if it exists
  // if (renderer) {
  //   renderer.kill();
  //   renderer = null;
  // }

  // Retrieve container element
  const sigma_container = document.getElementById('sigma-container');
  const search_container = document.getElementById('search-container');
  const search_inputs = Array.from(search_container.querySelectorAll('input[type="search"]'));
  console.log(search_inputs);

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
    minCameraRatio: 0.08,
    maxCameraRatio: 3,
    renderLabels: false,
    labelRenderedSizeThreshold: 7,
    labelSize: 12,
    defaultNodeColor: '#6c9',
    defaultEdgeColor: '#e0e0e0',
    zIndex: true,
    enableHovering: false,
  });

  // Bind search input interactions:
  search_input_label.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
  });
  search_input_author.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
  });
  search_input_abstract.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
  });
  search_input_journal.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
  });
  search_input_keywords.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
  });

  // Bind labels threshold to range input
  minYearThresholdRange.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
    // renderer?.setSetting('labelRenderedSizeThreshold', +labelsThresholdRange.value);
  });
  maxYearThresholdRange.addEventListener('input', () => {
    setSearchQuery4(state, graph, renderer, search_inputs);
    // renderer?.setSetting('labelRenderedSizeThreshold', +labelsThresholdRange.value);
  });

  // Set proper range initial value:
  minYearThresholdRange.value = '1900';
  maxYearThresholdRange.value = '2025';

  try {
    bind_graph_interactions2(renderer, state);
  } catch (error) {
    console.error('Error binding graph interactions:', error);
  }
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
  return renderer;
}

function bind_graph_interactions2(renderer, state) {
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
    res.size = 0.00001; // Base edge width
    res.color = '#e0e0e0'; // Edge color
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
    debugger;
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

      const textWidth = context.measureText(data.label).width,
        boxWidth = Math.round(textWidth + 5),
        boxHeight = Math.round(size + 2 * PADDING),
        radius = Math.max(data.size, size / 2) + PADDING;

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

      context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
    }
    // }
  });
}

function setSearchQuery(state, search_input, property, graph, renderer, search_inputs) {
  // function setSearchQuery(query, state, search_input, graph, renderer) {
  // state.searchQuery = query;

  //   if (search_input.value !== query){
  //     search_input.value = query
  //     console.log(`${query} vs ${search_input.value}`);
  // }
  const query = search_input.value;
  if (query !== '') {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, property) }))
      .filter(({ prop }) => prop.some((v) => v.toLowerCase().includes(lcQuery)));

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

function setSearchQuery2(state, graph, renderer, search_inputs) {
  const query_label = search_inputs[0].value;
  const query_author = search_inputs[1].value;
  let suggestions_label = undefined;
  let suggestions_author = undefined;
  state.query_label = query_label;
  state.query_author = query_author;
  if (query_label !== '') {
    const lcQuery = query_label.toLowerCase();
    suggestions_label = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'label') }))
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
    suggestions_label = new Set(suggestions_label.map(({ id }) => id));
  }
  if (query_author !== '') {
    const lcQuery = query_author.toLowerCase();
    suggestions_author = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'author') }))
      .filter(({ prop }) => prop.some((v) => v.toLowerCase().includes(lcQuery)));
    suggestions_author = new Set(suggestions_author.map(({ id }) => id));
  }
  const definedSuggestions = [suggestions_label, suggestions_author].filter(Boolean);
  state.suggestions = definedSuggestions.reduce(
    (acc, suggestion) => acc.intersection(suggestion),
    definedSuggestions[0],
  );
  if (state.suggestions) fitViewportToNodes(renderer, Array.from(state.suggestions), { animate: true });

  renderer.refresh({
    skipIndexation: true,
  });
}

function setSearchQuery3(state, graph, renderer, search_inputs) {
  const query_label = search_inputs[0].value;
  const query_author = search_inputs[1].value;
  const query_abstract = search_inputs[2].value;
  const query_journal = search_inputs[3].value;
  const query_keywords = search_inputs[4].value;
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
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
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
        .filter(({ array_prop }) => array_prop.some((v) => v.toLowerCase().includes(lcQuery)));
      suggestions_author = suggestions_author.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  // if (query_author !== '') {
  //   const lcQuery = query_author.toLowerCase();
  //   suggestions_author = graph
  //     .nodes()
  //     .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'author') }))
  //     .filter(({ prop }) => prop.some((v) => v.toLowerCase().includes(lcQuery)));
  //   suggestions_author = new Set(suggestions_author.map(({ id }) => id));
  // }
  if (query_abstract !== '') {
    const lcQuery = query_abstract.toLowerCase();
    suggestions_abstract = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'abstract') }))
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
    suggestions_abstract = new Set(suggestions_abstract.map(({ id }) => id));
  }
  if (query_journal !== '') {
    const lcQuery = query_journal.toLowerCase();
    suggestions_journal = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'journal') }))
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
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
        .filter(({ array_prop }) => array_prop.some((v) => v.toLowerCase().includes(lcQuery)));
      suggestions_keywords = suggestions_keywords.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  // if (query_keywords !== '') {
  //   const lcQuery = query_keywords.toLowerCase();
  //   suggestions_keywords = graph
  //     .nodes()
  //     .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'keywords') }))
  //     .filter(({ prop }) => prop.some((v) => v.toLowerCase().includes(lcQuery)));
  //   suggestions_keywords = new Set(suggestions_keywords.map(({ id }) => id));
  // }
  const definedSuggestions = [
    suggestions_label,
    suggestions_author,
    suggestions_abstract,
    suggestions_journal,
    suggestions_keywords,
  ].filter(Boolean);
  state.suggestions = definedSuggestions.reduce(
    (acc, suggestion) => acc.intersection(suggestion),
    definedSuggestions[0],
  );
  if (state.suggestions) fitViewportToNodes(renderer, Array.from(state.suggestions), { animate: true });

  renderer.refresh({
    skipIndexation: true,
  });
}

function setSearchQuery4(state, graph, renderer, search_inputs) {
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
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
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
        .filter(({ array_prop }) => array_prop.some((v) => v.toLowerCase().includes(lcQuery)));
      suggestions_author = suggestions_author.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  if (query_abstract !== '') {
    const lcQuery = query_abstract.toLowerCase();
    suggestions_abstract = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'abstract') }))
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
    suggestions_abstract = new Set(suggestions_abstract.map(({ id }) => id));
  }
  if (query_journal !== '') {
    const lcQuery = query_journal.toLowerCase();
    suggestions_journal = graph
      .nodes()
      .map((n) => ({ id: n, prop: graph.getNodeAttribute(n, 'journal') }))
      .filter(({ prop }) => prop.toLowerCase().includes(lcQuery));
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
        .filter(({ array_prop }) => array_prop.some((v) => v.toLowerCase().includes(lcQuery)));
      suggestions_keywords = suggestions_keywords.union(new Set(suggestions.map(({ id }) => id)));
    });
  }
  let year_nodes = graph
    .nodes()
    .map((n) => ({ id: n, year: graph.getNodeAttribute(n, 'date') }))
    .filter(({ year }) => (year ? +year >= min_year_value && +year <= max_year_value : false));
  year_nodes = new Set(year_nodes.map(({ id }) => id));
  const definedSuggestions = [
    suggestions_label,
    suggestions_author,
    suggestions_abstract,
    suggestions_journal,
    suggestions_keywords,
    year_nodes,
  ].filter(Boolean);
  state.suggestions = definedSuggestions.reduce(
    (acc, suggestion) => acc.intersection(suggestion),
    definedSuggestions[0],
  );

  document.getElementById('label-min-threshold').innerHTML = `Min year: ${search_inputs[5].value}`;
  document.getElementById('label-max-threshold').innerHTML = `Max year: ${search_inputs[6].value}`;
  if (state.suggestions) fitViewportToNodes(renderer, Array.from(state.suggestions), { animate: true });

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
      console.log(suggestions);
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
  console.log(`label: ${Boolean(suggestions_array[0])}, author: ${Boolean(suggestions_array[1])}`);
  if (suggestions_array[0] && suggestions_array[1])
    state.suggestions = suggestions_array[0].union(suggestions_array[1]);
  else if (suggestions_array[0]) state.suggestions = suggestions_array[0];
  else if (suggestions_array[1]) state.suggestions = suggestions_array[1];
  else state.suggestions = undefined;
  console.log(state.suggestions);
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
      <p>Link: <a href="https://doi.org/${nodeData.doi}" target="_blank">doi.org/${nodeData.doi}</a></p>
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
    console.log(year.substring(0, 4));
    return year.substring(0, 4);
  } else {
    console.log(year.substring(year.length - 4));
    return year.substring(year.length - 4);
  }
}
