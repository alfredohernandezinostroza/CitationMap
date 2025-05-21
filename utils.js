const CameraState = {
  angle: null,
  ratio: null,
};
export function getCorrectionRatio(viewportDimensions, graphDimensions) {
  const viewportRatio = viewportDimensions.height / viewportDimensions.width;
  const graphRatio = graphDimensions.height / graphDimensions.width;

  // If the stage and the graphs are in different directions (such as the graph being wider that tall while the stage
  // is taller than wide), we can stop here to have indeed nodes touching opposite sides:
  if ((viewportRatio < 1 && graphRatio > 1) || (viewportRatio > 1 && graphRatio < 1)) {
    return 1;
  }

  // Else, we need to fit the graph inside the stage:
  // 1. If the graph is "squarer" (i.e. with a ratio closer to 1), we need to make the largest sides touch;
  // 2. If the stage is "squarer", we need to make the smallest sides touch.
  return Math.min(Math.max(graphRatio, 1 / graphRatio), Math.max(1 / viewportRatio, viewportRatio));
}

const DEFAULT_FIT_VIEWPORT_TO_NODES_OPTIONS = {
  animate: true,
};

function getCameraStateToFitViewportToNodes(sigma, nodes, opts = {}) {
  if (!nodes.length) {
    throw new Error('getCameraStateToFitViewportToNodes: There should be at least one node.');
  }

  let groupMinX = Infinity;
  let groupMaxX = -Infinity;
  let groupMinY = Infinity;
  let groupMaxY = -Infinity;
  let groupFramedMinX = Infinity;
  let groupFramedMaxX = -Infinity;
  let groupFramedMinY = Infinity;
  let groupFramedMaxY = -Infinity;

  const graph = sigma.getGraph();
  nodes.forEach((node) => {
    const data = sigma.getNodeDisplayData(node);
    if (!data) {
      throw new Error(`getCameraStateToFitViewportToNodes: Node ${node} not found in sigma's graph.`);
    }

    const { x, y } = graph.getNodeAttributes(node);
    const { x: framedX, y: framedY } = data;

    groupMinX = Math.min(groupMinX, x);
    groupMaxX = Math.max(groupMaxX, x);
    groupMinY = Math.min(groupMinY, y);
    groupMaxY = Math.max(groupMaxY, y);
    groupFramedMinX = Math.min(groupFramedMinX, framedX);
    groupFramedMaxX = Math.max(groupFramedMaxX, framedX);
    groupFramedMinY = Math.min(groupFramedMinY, framedY);
    groupFramedMaxY = Math.max(groupFramedMaxY, framedY);
  });

  const { x, y } = sigma.getCustomBBox() || sigma.getBBox();
  const graphWidth = x[1] - x[0] || 1;
  const graphHeight = y[1] - y[0] || 1;

  const groupCenterX = (groupFramedMinX + groupFramedMaxX) / 2;
  const groupCenterY = (groupFramedMinY + groupFramedMaxY) / 2;
  const groupWidth = groupMaxX - groupMinX || graphWidth;
  const groupHeight = groupMaxY - groupMinY || graphHeight;

  const { width, height } = sigma.getDimensions();
  const correction = getCorrectionRatio({ width, height }, { width: graphWidth, height: graphHeight });
  const ratio =
    ((groupHeight / groupWidth < height / width ? groupWidth : groupHeight) / Math.max(graphWidth, graphHeight)) *
    correction;

  const camera = sigma.getCamera();
  return {
    ...camera.getState(),
    angle: 0,
    x: groupCenterX,
    y: groupCenterY,
    ratio,
  };
}
export async function fitViewportToNodes(sigma, nodes, opts = {}) {
  const { animate } = { ...DEFAULT_FIT_VIEWPORT_TO_NODES_OPTIONS, ...opts };

  const camera = sigma.getCamera();
  const newCameraState = getCameraStateToFitViewportToNodes(sigma, nodes, opts);
  if (animate) {
    await camera.animate(newCameraState);
  } else {
    camera.setState(newCameraState);
  }
}
