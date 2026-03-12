export const getDistance = (centroid1: [number, number], centroid2: [number, number]) => {
  if (!centroid1 || !centroid2) return Infinity;
  const [lon1, lat1] = centroid1;
  const [lon2, lat2] = centroid2;
  return Math.sqrt(Math.pow(lon1 - lon2, 2) + Math.pow(lat1 - lat2, 2));
};

export const matchClustersByCentroid = (original: any[], scenario: any[]) => {
  if (!original.length || !scenario.length) return scenario;

  // If scenario clusters already have the same cluster numbers as original clusters,
  // we can simply return them as they are (backend now ensures this)
  if (scenario.length === original.length) {
    // Verify that cluster numbers match
    const scenarioNumbers = scenario.map(s => s.cluster_number).sort();
    const originalNumbers = original.map(o => o.cluster_number).sort();
    
    if (JSON.stringify(scenarioNumbers) === JSON.stringify(originalNumbers)) {
      console.log('Scenario clusters already have matching cluster numbers, no remapping needed');
      return scenario;
    }
  }

  // Fallback to centroid-based matching if cluster numbers don't match
  console.log('Using centroid-based cluster matching as fallback');
  const matchedScenarioClusters = [...scenario];
  const usedOriginalIndices = new Set();

  return matchedScenarioClusters.map(sc => {
    let bestMatch: any = null;
    let minDistance = Infinity;
    let bestIndex = -1;

    original.forEach((oc, index) => {
      if (!usedOriginalIndices.has(index)) {
        const distance = getDistance(sc.centroid, oc.centroid);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = oc;
          bestIndex = index;
        }
      }
    });

    if (bestMatch) {
      usedOriginalIndices.add(bestIndex);
      return {
        ...sc,
        cluster: bestMatch.cluster, // Use original cluster ID
        cluster_id: bestMatch.cluster_id,
        cluster_number: bestMatch.cluster_number,
      };
    }
    return sc; // Return original if no match found
  });
};
