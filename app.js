// Import libraries from ES modules CDN (skypack, unpkg or esm.sh)
// import Graph from 'https://cdn.skypack.dev/graphology';
import { parse } from 'https://cdn.skypack.dev/graphology-gexf/browser';
import { fitViewportToNodes } from './utils.js';
import { clearFilters, updateFilter } from './table.js';
// import Sigma from 'https://cdn.skypack.dev/sigma';
const loadingAnimation = document.getElementById('loading-animation');

const versionNoticeOverlay = document.getElementById('version-notice-overlay');
document.getElementById('version-notice-close-button').addEventListener('click', () => {
  versionNoticeOverlay.style.display = 'none';
});
// The graph parse below blocks the main thread for several seconds, so clicks queue up
// and all fire at once when it's done. Without this guard, repeated clicks open one
// "_blank" tab each, which browsers flag as a popup-spam attempt.
let hasNavigatedToLatestVersion = false;
const guardAgainstQueuedClicks = (event) => {
  if (hasNavigatedToLatestVersion) {
    event.preventDefault();
    return;
  }
  hasNavigatedToLatestVersion = true;
};
document.getElementById('take-me-there-button').addEventListener('click', guardAgainstQueuedClicks);
document.getElementById('version-notice-inline-link').addEventListener('click', guardAgainstQueuedClicks);

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
console.log('starting')
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
  showKeywords: true,
  clusters: {
    2: {
      displaylabel: 'Basic: Adaptation',
      label: 'Basic: Adaptation',
      positions: [],
      color: '#9A9CFF',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: -60, y: -130 },
      top_keywords:{
        "Motor  Learning": 1083,
        "Motor Ability": 326,
        "Learning": 165,
        "Motor Adaptation": 127,
        "Physiological Adaptation": 116,
        "Motor Control": 109,
        "Adaptation": 99,
        "Proprioception": 93,
        "Visuomotor Coordination": 89,
        "Memory": 89,
        "Sensorimotor Integration": 89,
        "Sensorimotor Cortex": 88,
        "Psychology Of Movement": 82,
        "Motor Cortex": 81,
        "Kinematics": 79,
        "Locomotion": 74,
        "Cerebellum": 73,
        "Adaptability (Personality)": 69,
        "Visual Perception": 66,
        "Internal Model": 65,
      },
      top_tdidf_keywords:{
        "Savings": 0.028039134745169367,
        "Sensorimotor Adaptation": 0.02730180427204751,
        "Robots": 0.02462311454497258,
        "Motor Adaptation": 0.02146597433093391,
        "Physiological Adaptation": 0.01960671671171917,
        "Visuomotor Rotation": 0.018739569171635696,
        "Internal Model": 0.01756097006030567,
        "Generalization": 0.01675046374983002,
        "Adaptation": 0.016733318572932736,
        "Object Manipulation": 0.014629113780088365,
        "Split-Belt Treadmill": 0.013410020965081003,
        "Locomotion": 0.012507733074717399,
        "Cerebellum": 0.012338709654788785,
        "Interference": 0.011798987996955808,
        "Treadmills": 0.011550763345866253,
        "Perturbation Theory": 0.011104929879487819,
        "Biological Adaptation": 0.011025728648326879,
        "Noise": 0.010943606464432258,
        "Reaching": 0.01014140519571681,
        "Impedance Control": 0.010031639259062903,
        
      }
    },
    7: {
      displaylabel: 'Applied: Feedback and\ntraining scheduling',
      label: 'Applied: Feedback and\ntraining scheduling',
      positions: [],
      color: '#FF891B',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: -10, y: -170 },
      top_keywords:{
        "Motor  Learning": 708,
        "Motor Ability": 338,
        "Learning": 139,
        "Virtual Reality": 106,
        "Training": 100,
        "Psychology Of Movement": 95,
        "Rehabilitation": 86,
        "Ability": 78,
        "Descriptive Statistics": 76,
        "Task Performance": 75,
        "Stroke": 70,
        "Memory": 67,
        "Research Funding": 65,
        "Perceptual Motor Learning": 60,
        "Skill Acquisition": 58,
        "Randomized Controlled Trial": 57,
        "Physical Therapy": 53,
        "Comparative Studies": 51,
        "Psychological Feedback": 51,
        "Analysis Of Variance": 51,
      },
      top_tdidf_keywords:{
        "Microsurgery": 0.03536722752244063,
        "Speech Therapy": 0.02876484529211046,
        "Augmented Feedback": 0.02301187623368837,
        "Suturing": 0.021417712894306783,
        "Contextual Interference": 0.020847058019965226,
        "Operative Surgery": 0.01889798196556481,
        "Observational Learning": 0.01791518647970591,
        "Knowledge Of Results": 0.017407812363386635,
        "Sonification": 0.01684153691544792,
        "Practice Schedule": 0.016378251036822833,
        "Speech Apraxia": 0.015231835817963309,
        "Medical Education": 0.014432578629206695,
        "Haptic Guidance": 0.013858520108080861,
        "Childhood Apraxia Of Speech": 0.013473229532358336,
        "U-Statistics": 0.013473229532358336,
        "Laparoscopy": 0.013363498730746938,
        "Robots": 0.012598654643709873,
        "Speech Evaluation": 0.012330533757398869,
        "Surgical Anastomosis": 0.011789075840813545,
        "Speech Therapists": 0.011789075840813545,
      }
    },
    12: {
      displaylabel: 'Ecological Dynamics',
      label: 'Ecological Dynamics',
      positions: [],
      color: '#FF6587',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: 40, y: -150 },
      top_keywords: {
        "Motor  Learning": 156,
        "Skill Acquisition": 124,
        "Learning": 109,
        "Motor Ability": 108,
        "Ability": 82,
        "Training": 70,
        "Expertise": 54,
        "Athletic Ability": 50,
        "Task Performance": 42,
        "Physical Training & Conditioning": 41,
        "Psychology Of Movement": 40,
        "Cognition": 37,
        "Physical Education": 35,
        "Psychology Of Learning": 33,
        "Psychology": 30,
        "Cognitive Ability": 30,
        "Body Movement": 28,
        "Individual Differences": 27,
        "Sports": 26,
        "Video Games": 25,
      },
      top_tdidf_keywords:{
        "Ecological Dynamics": 0.060716404620882326,
        "Ecosystem Dynamics": 0.04857312369670586,
        "Expertise": 0.04844031084965804,
        "Soccer": 0.04009533597976002,
        "Coaching": 0.03687175729084722,
        "Cricket (Sport)": 0.03642984277252939,
        "Deliberate Practice": 0.03642984277252939,
        "Skill Acquisition": 0.03285792489580979,
        "Talent Development": 0.032262787629491314,
        "Constraint-Led Approach": 0.030280095253642402,
        "Athletic Equipment": 0.02833432215641175,
        "Athletic Ability": 0.028060467664854028,
        "Coaches (Athletics)": 0.02765381796813541,
        "Australia": 0.02534933313745746,
        "Act-R": 0.02428656184835293,
        "England": 0.02428656184835293,
        "Cricket": 0.02428656184835293,
        "Electronic Games": 0.02428656184835293,
        "Chess": 0.02428656184835293,
        "Sports": 0.023323112631316832,
      }
    },
    15: {
      displaylabel: 'Applied: Motivation\nand Attention',
      label: 'Applied: Motivation\nand Attention',
      positions: [],
      color: '#FC001C',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: 0, y: 150 },
      top_keywords: {
        "Motor  Learning": 423,
        "Motor Ability": 210,
        "Attention": 107,
        "Learning": 95,
        "Ability": 66,
        "Training": 66,
        "Task Performance": 65,
        "Self-Efficacy": 55,
        "Psychology Of Movement": 53,
        "Descriptive Statistics": 53,
        "Randomized Controlled Trial": 51,
        "Implicit Learning": 46,
        "Self-Control": 44,
        "Comparative Studies": 43,
        "Body Movement": 41,
        "Kinematics": 41,
        "Statistical Sampling": 40,
        "Learning Strategies": 38,
        "Attentional Focus": 38,
        "Motivation (Psychology)": 37,
      },
      top_tdidf_keywords:{
        "Attentional Focus": 0.07257828741600397,
        "Self-Control": 0.06395763744234137,
        "Focus Of Attention": 0.06382938774772547,
        "Self-Efficacy": 0.06047760624206931,
        "Autonomy": 0.04851033468827136,
        "Optimal Theory": 0.03574445713872627,
        "Autonomy Support": 0.033191281628817244,
        "Anterior Cruciate Ligament Injuries": 0.033191281628817244,
        "Enhanced Expectancies": 0.033191281628817244,
        "Autonomy (Psychology)": 0.031978818721170685,
        "Golf": 0.028362673193232293,
        "Stereotype Threat": 0.028084930608999206,
        "Intrinsic Motivation": 0.027618070713738323,
        "External Focus": 0.025531755099090187,
        "Anterior Cruciate Ligament Injury Prevention": 0.02482941411600136,
        "Golf Putting": 0.02100950425200115,
        "Attention": 0.01788414192591352,
        "Analogy": 0.017872228569363133,
        "Injury Prevention": 0.017872228569363133,
        "Choice": 0.017872228569363133,
      }
    },
    11: {
      displaylabel: 'Basic: Sequence Learning',
      label: 'Basic: Sequence Learning',
      positions: [],
      color: '#0018FF',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: 20, y: 170 },
      top_keywords:{
        "Motor  Learning": 779,
        "Motor Ability": 294,
        "Learning": 189,
        "Sleep": 171,
        "Memory": 165,
        "Movement Sequence": 140,
        "Motor Cortex": 106,
        "Implicit Learning": 91,
        "Fmri": 79,
        "Neuroplasticity": 79,
        "Aging": 78,
        "Magnetic Resonance Imaging": 77,
        "Reaction Time": 77,
        "Cerebellum": 73,
        "Functional Magnetic Resonance Imaging": 69,
        "Memory Consolidation": 61,
        "Motor Sequence Learning": 60,
        "Consolidation": 58,
        "Sequence Learning": 58,
        "Task Performance": 57,
      },
      top_tdidf_keywords:{
        "Motor Sequence Learning": 0.03932947218905,
        "Sleep": 0.03608459685602714,
        "Memory Consolidation": 0.02946754230404729,
        "Sleep Spindles": 0.02846414167879021,
        "Basal Ganglia": 0.02753524444804419,
        "Naps (Sleep)": 0.022830051608211593,
        "Stuttering": 0.022529318172311758,
        "Polysomnography": 0.021308048167664156,
        "Sleep Disorders": 0.019786044727116717,
        "Diffusion Tensor Imaging": 0.01819675698532873,
        "Sleep-Wake Cycle": 0.017078485007274127,
        "Cerebellum": 0.01540453549994141,
        "Conditional Motor Learning": 0.015220034405474394,
        "Transcranial Alternating Current Stimulation": 0.01480135367297091,
        "Functional Magnetic Resonance Imaging": 0.014560451362958316,
        "Brain Imaging": 0.014503822091194758,
        "Movement Sequence": 0.013949136684692214,
        "Wakefulness": 0.013864195798345696,
        "Motor Memory Consolidation": 0.013698030964926956,
        "Sleep Deprivation": 0.013662788005819302,
      }
    },
    6: {
      displaylabel: 'Basic: Motor Cortex',
      label: 'Basic: Motor Cortex',
      positions: [],
      color: '#54D3FF',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: -30, y: 150 },
      top_keywords: {
        "Motor  Learning": 754,
        "Motor Cortex": 426,
        "Transcranial Magnetic  Stimulation": 297,
        "Motor Ability": 266,
        "Neuroplasticity": 250,
        "Transcranial Direct Current Stimulation": 200,
        "Stroke": 116,
        "Brain Stimulation": 115,
        "Cerebellum": 100,
        "Learning": 88,
        "Plasticity": 83,
        "Rehabilitation": 69,
        "Tdcs": 52,
        "Evoked Potentials (Electrophysiology)": 51,
        "Frontal Lobe": 49,
        "Task Performance": 46,
        "Sensorimotor Integration": 45,
        "Cerebral Cortex": 45,
        "Neurophysiology": 44,
        "Neural Circuitry": 44,
      },
      top_tdidf_keywords:{
        "Transcranial Magnetic  Stimulation": 0.055969600793570426,
        "Motor Cortex": 0.037905209909983445,
        "Transcranial Direct Current Stimulation": 0.03768996686435719,
        "Brain Stimulation": 0.03464031729823155,
        "Dendritic Spines": 0.030503477357991273,
        "Tdcs": 0.030439689919457103,
        "Laboratory Rats": 0.023988683085190175,
        "Pyramidal Neurons": 0.0223692167291936,
        "Transcranial Direct Current Stimulation ( Tdcs )": 0.019318868993394474,
        "Cerebellum": 0.018844983432178594,
        "Primary Motor Cortex": 0.01725615705209829,
        "Electric Stimulation": 0.01725615705209829,
        "Laboratory Mice": 0.01725615705209829,
        "Plasticity": 0.015641336248708233,
        "Pyramidal Tract": 0.01553054134688846,
        "Transcranial Alternating Current Stimulation": 0.015251738678995637,
        "Long-Term Potentiation": 0.015219844959728552,
        "Basal Ganglia": 0.015099137420586004,
        "Synapses": 0.0146344663074313,
        "Motor Training": 0.013373521715376174,
      }
    },
    5: {
      displaylabel: 'Basic: Basal Ganglia',
      label: 'Basic: Basal Ganglia',
      positions: [],
      color: '#32AC7C',
      label_bias: { x: 0, y: 0 },
      keywords_bias: { x: -40, y: 90 },
      top_keywords: {
        "Motor  Learning": 53,
        "Basal Ganglia": 44,
        "Songbirds": 39,
        "Zebra Finch": 25,
        "Neuroplasticity": 20,
        "Birdsongs": 20,
        "Motor Ability": 20,
        "Dopamine": 19,
        "Vocal Learning": 18,
        "Neural Circuitry": 15,
        "Neurons": 13,
        "Learning": 12,
        "Reinforcement Learning": 12,
        "Dystonia": 12,
        "Birdsong": 11,
        "Songbird": 11,
        "Sensorimotor Cortex": 11,
        "Striatum": 11,
        "Speech": 10,
        "Acetylcholine": 10,
      },
      top_tdidf_keywords:{
        "Songbirds": 0.20163011209677215,
        "Birdsongs": 0.18161918141929195,
        "Zebra Finch": 0.16982990884847138,
        "Basal Ganglia": 0.1268185669190205,
        "Vocal Learning": 0.12227753437089939,
        "Birdsong": 0.09989054978061059,
        "Songbird": 0.05687003161703829,
        "Lateral Magnocellular Nucleus Of Anterior Nidopallium (Lman)": 0.04540479535482299,
        "Dopamine": 0.03823698963963484,
        "Genetic Mutation": 0.03519860577019551,
        "Dystonia": 0.03458688188700559,
        "Striatum": 0.03170464172975512,
        "Gene Expression": 0.031287649573507124,
        "Acetylcholine": 0.028822401572504656,
        "Medium Spiny Neuron ( Msn )": 0.0272428772128938,
        "Foxp2": 0.0272428772128938,
        "Bird Behavior": 0.0272428772128938,
        "Robust Nucleus Of Arcopallium (Ra)": 0.0272428772128938,
        "Animal Sounds": 0.0272428772128938,
        "Birds": 0.02717278541575542,
      }
    },
    1: {
      displaylabel: 'Basic: Cerebellum',
      label: 'Basic: Cerebellum',
      positions: [],
      color: '#00A50F',
      label_bias: { x: 0, y: 0 },
      keywords_bias: {  x: -50, y: -140 },
      top_keywords:{
        "Motor  Learning": 509,
        "Cerebellum": 351,
        "Purkinje Cell": 251,
        "Motor Ability": 114,
        "Cerebellar Cortex": 99,
        "Neuroplasticity": 93,
        "Parkinsons Disease": 72,
        "Vestibulo-Ocular Reflex": 68,
        "Neurons": 63,
        "Eye Movement": 58,
        "Neural Circuitry": 57,
        "Synapses": 57,
        "Learning": 54,
        "Laboratory Mice": 51,
        "Saccadic Eye Movements": 50,
        "Memory": 49,
        "Cerebellar Nuclei": 39,
        "Nervous System": 31,
        "Classical Conditioning": 30,
        "Neural Transmission": 28,
      },
      top_tdidf_keywords:{
        "Purkinje Cell": 0.19109910874166278,
        "Vestibulo-Ocular Reflex": 0.08992595710472684,
        "Cerebellum": 0.08603020070186695,
        "Cerebellar Cortex": 0.05554786196663253,
        "Synapses": 0.04339700875806685,
        "Eyeblink Conditioning": 0.03570589473275918,
        "Classical Conditioning": 0.03019353953229552,
        "Cerebellar Nuclei": 0.029692690202887843,
        "Laboratory Mice": 0.028615565255537965,
        "Saccadic Eye Movements": 0.028054475740723495,
        "Mice": 0.027174185579065965,
        "Inferior Olive": 0.022981430531624002,
        "Long-Term Synaptic Depression": 0.02115904873052396,
        "Laboratory Rats": 0.019122575037120497,
        "Ltd": 0.01851416763920847,
        "Long-Term Depression": 0.01827242474023867,
        "Eyeblink": 0.017678023485864617,
        "Granule Cells": 0.01719172709355072,
        "Glutamate Receptor": 0.01598837164770884,
        "Deep Cerebellar Nuclei": 14.484941211906904,
      }
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
  state.clusters[key].x += state.clusters[key].label_bias.x;
  state.clusters[key].y += state.clusters[key].label_bias.y;
}

try {
  renderer = await render_gexf(graph, state);
} catch (error) {
  console.error('Error rendering gexf', error);
}
window.renderer = renderer;

loadingAnimation.classList.remove('show');
// fitViewportToNodes(renderer, graph.nodes(), { animate: true });

// Initialize IndexedDB for caching large graph data
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CitationMapDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('graphs')) {
        db.createObjectStore('graphs', { keyPath: 'id' });
      }
    };
  });
}

function getCachedGraph() {
  return new Promise(async (resolve) => {
    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['graphs'], 'readonly');
      const store = transaction.objectStore('graphs');
      const request = store.get('main_graph');
      
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => resolve(null);
    } catch (e) {
      console.warn('IndexedDB error:', e);
      resolve(null);
    }
  });
}

function cacheGraph(graphJson) {
  return new Promise(async (resolve) => {
    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['graphs'], 'readwrite');
      const store = transaction.objectStore('graphs');
      store.put({ id: 'main_graph', data: graphJson });
      
      transaction.oncomplete = () => {
        console.log('graph cached in IndexedDB');
        resolve();
      };
      transaction.onerror = () => {
        console.warn('Failed to cache graph');
        resolve();
      };
    } catch (e) {
      console.warn('Could not cache graph:', e);
      resolve();
    }
  });
}

function clearCachedGraph() {
  return new Promise(async (resolve) => {
    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['graphs'], 'readwrite');
      const store = transaction.objectStore('graphs');
      store.delete('main_graph');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    } catch (e) {
      console.warn('Could not clear cache:', e);
      resolve();
    }
  });
}

async function load_gexf() {
  // Add a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.textContent = 'Loading graph...';
  loadingIndicator.style.margin = '10px';
  document.querySelector('.header').appendChild(loadingIndicator);
  
  let graph;

  // Try to load from cache first
  const cachedGraphJson = await getCachedGraph();
  if (cachedGraphJson) {
    loadingIndicator.textContent = 'Loading graph from cache...';
    console.log('loading graph from cache');
    graph = window.graphology.from(cachedGraphJson);
  } else {
    // Fetch and parse from file if not in cache
    loadingIndicator.textContent = 'Parsing graph data...';
    console.log('fetching gexf');
    let res = await fetch('./filtered_with_transferred_mesh.gexf');
    // let res = await fetch('./test.gexf');
    let to_parse = await res.text();
    console.log('fetched gexf');

    console.log('parsing gexf');
    graph = parse(window.graphology, to_parse, { addMissingNodes: true });
    console.log('parsed gexf');
    
    // Store parsed graph in cache for next time
    const graphJson = graph.toJSON();
    await cacheGraph(graphJson);
  }
  
  // Hide loading indicator
  loadingIndicator.textContent = 'Graph loaded successfully!';
  loadingIndicator.style.color = 'green';
  setTimeout(() => {
    loadingIndicator.style.display = 'none';
  }, 4000);

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

  add_labels(renderer, state, sigma_container);

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
  const checkbox_keywords = document.getElementById('show-keywords-checkbox-input');
  checkbox_keywords.addEventListener('change', () => {
    if (checkbox_keywords.checked) {
      state.showKeywords = true;
      console.log(state.showKeywords);
    } else {
      state.showKeywords = false;
      console.log(state.showKeywords);
    }
    renderer.refresh({
      skipIndexation: true,
    });
  });
  const checkbox_labels = document.getElementById('show-labels-checkbox-input');
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

  // Clear cache button
  // const clearCacheButton = document.getElementById('clear-cache-button');
  // if (clearCacheButton) {
  //   clearCacheButton.addEventListener('click', async () => {
  //     await clearCachedGraph();
  //     alert('Cache cleared! The graph will be re-parsed on your next visit.');
  //   });
  // }

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
  const keywordsLayer = document.createElement('div');
  clustersLayer.id = 'clustersLayer';
  keywordsLayer.id = 'keywordsLayer';
  let clusterLabelsDoms = '';
  let keywordsDoms = '';
  // insert the layer underneath the hovers layer
  sigma_container.insertBefore(keywordsLayer, sigma_container.querySelector('.sigma-hovers'));
  for (const key in state.clusters) {
    // for each cluster create a div label
    const cluster = state.clusters[key];
    // adapt the position to viewport coordinates
    const viewportPos = renderer.graphToViewport(cluster);
    viewportPos.x += cluster.label_bias.x;
    viewportPos.y += cluster.label_bias.y;
    clusterLabelsDoms += `<div id='${cluster.label}' class="clusterLabel" style="top:${viewportPos.y}px;left:${viewportPos.x}px;color:${cluster.color}">${cluster.displaylabel}</div>`;
    keywordsDoms += `<div id='${cluster.label}_keywords' class="keywords-list" style="top:${viewportPos.y + cluster.keywords_bias.y}px;left:${viewportPos.x + cluster.keywords_bias.y}px;color:${cluster.color}">${Object.keys(cluster.top_tdidf_keywords).join('\n')}</div>`;
  }
  
  keywordsLayer.innerHTML = keywordsDoms;
  clustersLayer.innerHTML = clusterLabelsDoms;

  // insert the layer underneath the hovers layer
  sigma_container.insertBefore(clustersLayer, sigma_container.querySelector('.sigma-hovers'));
  sigma_container.insertBefore(keywordsLayer, sigma_container.querySelector('.sigma-hovers'));

  // Store the current checked cluster classes in state
  state.visibleClusters = new Set(Object.keys(state.clusters));

  // Clusters labels position needs to be updated on each render
  renderer.on('afterRender', () => {
    for (const key in state.clusters) {
      const cluster = state.clusters[key];
      const clusterLabel = document.getElementById(cluster.label);
      const keywords = document.getElementById(`${cluster.label}_keywords`);
      if (clusterLabel) {
        // update position from the viewport
        const viewportPos = renderer.graphToViewport(cluster);
        clusterLabel.style.top = `${viewportPos.y}px`;
        clusterLabel.style.left = `${viewportPos.x}px`;
        clusterLabel.style.fontSize = `${0.7 / renderer.getCamera().ratio}rem`;
        keywords.style.top = `${viewportPos.y+ cluster.keywords_bias.y/ renderer.getCamera().ratio}px`;
        keywords.style.left = `${viewportPos.x + cluster.keywords_bias.x/ renderer.getCamera().ratio}px`;
        keywords.style.fontSize = `${0.35 / Math.sqrt(renderer.getCamera().ratio)}rem`;
      }
      // Only hide/show based on state.visibleClusters (updated by Filter button), not checkbox state
      if (!state.visibleClusters.has(key) || !state.showLabels) {
        if (clusterLabel) clusterLabel.style.display = 'none';
      } else {
        if (clusterLabel) clusterLabel.style.display = 'block';
      }
      if (state.hoveredNode) {
        if (clusterLabel) clusterLabel.style.opacity = 0.5;
        if (keywords) keywords.style.opacity = 0.5;
      } else {
        if (clusterLabel) clusterLabel.style.opacity = 1;
        if (keywords) keywords.style.opacity = 1;
      }
      // 
      if (!state.showKeywords) {
        if (keywords) keywords.style.display = 'none';
      } else {
        if (keywords) keywords.style.display = 'block';
      }
    }
  });

  const clusterLabelsSection = document.createElement('div');
  clusterLabelsSection.className = 'cluster-labels-section';
  document.querySelector('#global-filters').append(clusterLabelsSection);

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
