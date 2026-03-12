from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
import copy
import hdbscan
from sklearn.impute import SimpleImputer
import logging
import random
from math import radians, cos, sin, asin, sqrt
import requests
import json
import time
import os
from dotenv import load_dotenv
import uuid

# Import configuration
from config import get_config

# Import Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("Warning: google-generativeai not installed. AI insights will not be available.")
    GEMINI_AVAILABLE = False

# Import Ollama SDK
try:
    import ollama as ollama_sdk
    OLLAMA_SDK_AVAILABLE = True
except ImportError:
    print("Warning: ollama package not installed. Run 'pip install ollama' to enable local AI.")
    OLLAMA_SDK_AVAILABLE = False
from feature_descriptions import get_feature_description, get_features_by_category, get_all_categories, get_feature_suggestions, FEATURE_DESCRIPTIONS

# Load configuration
load_dotenv()
config_obj = get_config()

# Validate configuration and display warnings
config_warnings = config_obj.validate()
for warning in config_warnings:
    print(f"⚠️  {warning}")

# --- App & Logging Setup ---
app = Flask(__name__)

# Configure CORS based on environment
if config_obj.ALLOWED_ORIGINS == '*':
    # Development: Allow all origins
    CORS(app)
    print("🔓 CORS: Allowing all origins (development mode)")
else:
    # Production: Restrict to specific origins
    CORS(app, resources={r"/api/*": {"origins": config_obj.ALLOWED_ORIGINS}})
    print(f"🔒 CORS: Restricted to {config_obj.ALLOWED_ORIGINS}")

logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

# --- Gemini AI Configuration ---
GEMINI_API_KEY = config_obj.GEMINI_API_KEY
if not GEMINI_API_KEY:
    GEMINI_AVAILABLE = False

# --- Decorators ---
def performance_monitor(func):
    """A decorator to monitor the execution time of a function."""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        logger.info(f"{func.__name__} executed in {execution_time:.4f} seconds")
        return result
    return wrapper

# --- Core Helper Functions ---

def _get_nearest_city(lat, lng):
    """Get the nearest major city based on coordinates."""
    # Major Indian cities with their coordinates
    major_cities = {
        'Mumbai': (19.0760, 72.8777),
        'Delhi': (28.7041, 77.1025),
        'Bangalore': (12.9716, 77.5946),
        'Hyderabad': (17.3850, 78.4867),
        'Chennai': (13.0827, 80.2707),
        'Kolkata': (22.5726, 88.3639),
        'Pune': (18.5204, 73.8567),
        'Ahmedabad': (23.0225, 72.5714),
        'Jaipur': (26.9124, 75.7873),
        'Surat': (21.1702, 72.8311),
        'Lucknow': (26.8467, 80.9462),
        'Kanpur': (26.4499, 80.3319),
        'Nagpur': (21.1458, 79.0882),
        'Indore': (22.7196, 75.8577),
        'Thane': (19.2183, 72.9781),
        'Bhopal': (23.2599, 77.4126),
        'Visakhapatnam': (17.6868, 83.2185),
        'Pimpri-Chinchwad': (18.6298, 73.7997),
        'Patna': (25.5941, 85.1376),
        'Vadodara': (22.3072, 73.1812),
        'Ghaziabad': (28.6692, 77.4538),
        'Ludhiana': (30.9010, 75.8573),
        'Agra': (27.1767, 78.0081),
        'Nashik': (19.9975, 73.7898),
        'Faridabad': (28.4089, 77.3178),
        'Meerut': (28.9845, 77.7064),
        'Rajkot': (22.3039, 70.8022),
        'Kalyan-Dombivali': (19.2350, 73.1295),
        'Vasai-Virar': (19.4259, 72.8225),
        'Varanasi': (25.3176, 82.9739),
        'Srinagar': (34.0837, 74.7973),
        'Aurangabad': (19.8762, 75.3433),
        'Dhanbad': (23.7957, 86.4304),
        'Amritsar': (31.6340, 74.8723),
        'Allahabad': (25.4358, 81.8463),
        'Ranchi': (23.3441, 85.3096),
        'Howrah': (22.5958, 88.2636),
        'Coimbatore': (11.0168, 76.9558),
        'Jabalpur': (23.1815, 79.9864),
        'Gwalior': (26.2183, 78.1828),
        'Vijayawada': (16.5062, 80.6480),
        'Jodhpur': (26.2389, 73.0243),
        'Madurai': (9.9252, 78.1198),
        'Raipur': (21.2514, 81.6296),
        'Kota': (25.2138, 75.8648),
        'Guwahati': (26.1445, 91.7362),
        'Chandigarh': (30.7333, 76.7794),
        'Solapur': (17.6599, 75.9064),
        'Hubli-Dharwad': (15.3647, 75.1240),
        'Bareilly': (28.3670, 79.4304),
        'Moradabad': (28.8389, 78.7738),
        'Mysore': (12.2958, 76.6394),
        'Gurgaon': (28.4595, 77.0266),
        'Aligarh': (27.8974, 78.0880),
        'Jalandhar': (31.3260, 75.5762),
        'Tiruchirappalli': (10.7905, 78.7047),
        'Bhubaneswar': (20.2961, 85.8245),
        'Salem': (11.6643, 78.1460),
        'Warangal': (17.9689, 79.5941),
        'Guntur': (16.2991, 80.4575),
        'Bhiwandi': (19.2969, 73.0629),
        'Saharanpur': (29.9675, 77.5451),
        'Gorakhpur': (26.7606, 83.3732),
        'Bikaner': (28.0229, 73.3119),
        'Amravati': (20.9374, 77.7796),
        'Noida': (28.5355, 77.3910),
        'Jamshedpur': (22.8046, 86.2029),
        'Bhilai': (21.2094, 81.4285),
        'Cuttack': (20.4625, 85.8830),
        'Firozabad': (27.1591, 78.3958),
        'Kochi': (9.9312, 76.2673),
        'Bhavnagar': (21.7645, 72.1519),
        'Dehradun': (30.3165, 78.0322),
        'Durgapur': (23.5204, 87.3119),
        'Asansol': (23.6889, 86.9661),
        'Rourkela': (22.2494, 84.8828),
        'Nanded': (19.1383, 77.3210),
        'Kolhapur': (16.7050, 74.2433),
        'Ajmer': (26.4499, 74.6399),
        'Gulbarga': (17.3297, 76.8343),
        'Loni': (28.7515, 77.2889),
        'Ujjain': (23.1765, 75.7885),
        'Siliguri': (26.7271, 88.3953),
        'Jhansi': (25.4484, 78.5685),
        'Ulhasnagar': (19.2183, 73.1634),
        'Jammu': (32.7266, 74.8570),
        'Sangli-Miraj': (16.8524, 74.5815),
        'Mangalore': (12.9141, 74.8560),
        'Erode': (11.3410, 77.7172),
        'Belgaum': (15.8497, 74.4977),
        'Ambattur': (13.0982, 80.1614),
        'Tirunelveli': (8.7139, 77.7567),
        'Malegaon': (20.5538, 74.5254),
        'Gaya': (24.7914, 85.0002),
        'Jalgaon': (21.0077, 75.5626),
        'Udaipur': (24.5854, 73.7125),
        'Maheshtala': (22.5086, 88.2532),
        'Tiruppur': (11.1085, 77.3411),
        'Davanagere': (14.4644, 75.9218),
        'Kozhikode': (11.2588, 75.7804),
        'Akola': (20.7096, 77.0022),
        'Kurnool': (15.8281, 78.0373),
        'Rajpur': (22.3039, 70.8022),
        'Bokaro': (23.6693, 86.1511),
        'South Dumdum': (22.6100, 88.4000),
        'Bellary': (15.1394, 76.9214),
        'Patiala': (30.3398, 76.3869),
        'Gopalpur': (19.2593, 84.9000),
        'Agartala': (23.8315, 91.2868),
        'Bhagalpur': (25.2445, 87.0108),
        'Muzaffarnagar': (29.4727, 77.7085),
        'Bhatpara': (22.8664, 88.4011),
        'Panihati': (22.6941, 88.3745),
        'Latur': (18.4088, 76.5604),
        'Dhule': (20.9029, 74.7773),
        'Rohtak': (28.8955, 76.6066),
        'Korba': (22.3458, 82.6963),
        'Bhilwara': (25.3463, 74.6364),
        'Brahmapur': (19.3149, 84.7941),
        'Muzaffarpur': (26.1209, 85.3647),
        'Ahmednagar': (19.0952, 74.7496),
        'Mathura': (27.4924, 77.6737),
        'Kollam': (8.8932, 76.6141),
        'Avadi': (13.1147, 80.0997),
        'Kadapa': (14.4753, 78.8358),
        'Anantapur': (14.6819, 77.6006),
        'Tirupati': (13.6288, 79.4192),
        'Hisar': (29.1492, 75.7217),
        'Panipat': (29.3909, 76.9635),
        'Arrah': (25.5545, 84.6628),
        'Karimnagar': (18.4386, 79.1288),
        'Parbhani': (19.2686, 76.7708),
        'Etawah': (26.7769, 79.0239),
        'Bharatpur': (27.2173, 77.4901),
        'Begusarai': (25.4180, 86.1309),
        'New Delhi': (28.6139, 77.2090),
        'Gandhinagar': (23.2156, 72.6369),
        'Baroda': (22.3072, 73.1812),
        'Dehra Dun': (30.3165, 78.0322),
        'Tiruchchirappalli': (10.7905, 78.7047),
        'Pondicherry': (11.9416, 79.8083),
        'Thiruvananthapuram': (8.5241, 76.9366),
        'Panaji': (15.4909, 73.8278),
        'Shillong': (25.5788, 91.8933),
        'Gangtok': (27.3389, 88.6065),
        'Kohima': (25.6751, 94.1086),
        'Imphal': (24.8170, 93.9368),
        'Aizawl': (23.7307, 92.7173),
        'Agartala': (23.8315, 91.2868),
        'Shimla': (31.1048, 77.1734),
        'Srinagar': (34.0837, 74.7973),
        'Chandigarh': (30.7333, 76.7794),
        'Port Blair': (11.6234, 92.7265)
    }
    
    def calculate_distance(lat1, lng1, lat2, lng2):
        """Calculate distance between two points using Haversine formula."""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    
    # Find nearest city
    nearest_city = "Unknown Location"
    min_distance = float('inf')
    
    for city, (city_lat, city_lng) in major_cities.items():
        distance = calculate_distance(lat, lng, city_lat, city_lng)
        if distance < min_distance:
            min_distance = distance
            nearest_city = city
    
    # Add distance information
    if min_distance < 50:
        location_desc = f"Near {nearest_city} ({min_distance:.1f} km away)"
    elif min_distance < 100:
        location_desc = f"Within {min_distance:.1f} km of {nearest_city}"
    else:
        location_desc = f"Approximately {min_distance:.1f} km from {nearest_city}"
    
    return location_desc

def _extract_coordinates(polygons):
    """Extracts longitude and latitude from polygon geometries."""
    coordinates = []
    valid_indices = []
    for i, p in enumerate(polygons):
        geom = p.get('geometry', {})
        coords = None
        if geom.get('type') == 'Point':
            coords = geom['coordinates']
        elif geom.get('type') == 'Polygon':
            coords = np.mean(geom['coordinates'][0], axis=0)
        elif geom.get('type') == 'MultiPolygon':
            coords = np.mean(geom['coordinates'][0][0], axis=0)
        
        if coords is not None and len(coords) == 2:
            coordinates.append(coords)
            valid_indices.append(i)
            
    return np.array(coordinates), valid_indices

def _buffer_clustering(coords, radius_km, min_points):
    """
    Custom buffer clustering that groups points within a specified radius.
    
    Args:
        coords: Array of coordinates (lng, lat)
        radius_km: Radius in kilometers for grouping
        min_points: Minimum number of points required for a cluster
    
    Returns:
        Array of cluster labels
    """
    from sklearn.neighbors import BallTree
    import numpy as np
    
    if len(coords) == 0:
        return np.array([])
    
    # Convert radius from km to radians for haversine distance
    earth_radius_km = 6371.0
    radius_rad = radius_km / earth_radius_km
    
    # Convert coordinates to radians for haversine calculation
    coords_rad = np.radians(coords)
    
    # Use BallTree for efficient spatial queries
    tree = BallTree(coords_rad, metric='haversine')
    
    n_points = len(coords)
    labels = np.full(n_points, -1)  # -1 indicates noise/unassigned
    cluster_id = 0
    
    # Track which points have been assigned
    assigned = np.zeros(n_points, dtype=bool)
    
    # Sort points by suitability score if available (for better clustering)
    # For now, we'll use a simple approach
    for i in range(n_points):
        if assigned[i]:
            continue
            
        # Find all points within radius of current point
        indices = tree.query_radius([coords_rad[i]], r=radius_rad)[0]
        
        if len(indices) >= min_points:
            # Create a new cluster
            labels[indices] = cluster_id
            assigned[indices] = True
            cluster_id += 1
        else:
            # Mark as noise if not enough points
            labels[i] = -1
    
    return labels

def _get_clustering_model(algorithm, params):
    """Returns a configured clustering model instance based on the algorithm name."""
    if algorithm == 'dbscan':
        earth_radius_km = 6371.0
        eps_rad = params['dbscan_eps'] / earth_radius_km
        min_samples = max(1, params['dbscan_min_samples'])  # Ensure at least 1
        return DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine', algorithm='ball_tree')
    elif algorithm == 'kmeans':
        n_clusters = max(1, params['n_clusters'])  # Ensure at least 1
        return KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    elif algorithm == 'hierarchical':
        n_clusters = max(1, params['n_clusters'])  # Ensure at least 1
        return AgglomerativeClustering(n_clusters=n_clusters)
    elif algorithm == 'hdbscan':
        min_cluster_size = max(1, params.get('min_polygons_per_cluster', 5))
        return hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric='haversine')

    # Add other algorithms here if needed
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

def _generate_unique_id():
    """Generate a unique numeric ID for clusters."""
    import time
    return int(time.time() * 1000) + random.randint(1, 999)

def _ensure_unique_cluster_numbers(clusters, prefix=""):
    """Ensure all cluster numbers are unique within a set of clusters."""
    if not clusters:
        return clusters
    
    # Check for duplicates in cluster numbers
    cluster_numbers = [c.get('cluster_number', 0) for c in clusters]
    if len(cluster_numbers) == len(set(cluster_numbers)):
        logger.info(f"All {prefix}cluster numbers are unique: {cluster_numbers}")
    else:
        logger.warning(f"Duplicate cluster numbers found in {prefix}clusters: {cluster_numbers}")
        
        # Fix duplicates by reassigning
        seen_numbers = set()
        for cluster in clusters:
            original_number = cluster.get('cluster_number', 0)
            while cluster.get('cluster_number', 0) in seen_numbers:
                cluster['cluster_number'] = cluster.get('cluster_number', 0) + 1
            seen_numbers.add(cluster['cluster_number'])
            if cluster['cluster_number'] != original_number:
                logger.info(f"Reassigned {prefix}cluster number from {original_number} to {cluster['cluster_number']}")
    
    # Check for duplicates in cluster IDs
    cluster_ids = [c.get('cluster_id', '') for c in clusters if c.get('cluster_id')]
    if len(cluster_ids) == len(set(cluster_ids)):
        logger.info(f"All {prefix}cluster IDs are unique: {cluster_ids}")
    else:
        logger.warning(f"Duplicate cluster IDs found in {prefix}clusters: {cluster_ids}")
        
        # Fix duplicates by reassigning
        seen_ids = set()
        for cluster in clusters:
            if 'cluster_id' in cluster:
                original_id = cluster['cluster_id']
                while cluster['cluster_id'] in seen_ids:
                    cluster['cluster_id'] = f"{original_id}_{_generate_unique_id()}"
                seen_ids.add(cluster['cluster_id'])
                if cluster['cluster_id'] != original_id:
                    logger.info(f"Reassigned {prefix}cluster ID from {original_id} to {cluster['cluster_id']}")
    
    # Verify uniqueness after fixing
    final_numbers = [c.get('cluster_number', 0) for c in clusters]
    final_ids = [c.get('cluster_id', '') for c in clusters if c.get('cluster_id')]
    
    numbers_unique = len(final_numbers) == len(set(final_numbers))
    ids_unique = len(final_ids) == len(set(final_ids))
    
    logger.info(f"Final {prefix}cluster numbers: {final_numbers}")
    logger.info(f"Final {prefix}cluster IDs: {final_ids}")
    logger.info(f"All {prefix}cluster numbers are now unique: {numbers_unique}")
    logger.info(f"All {prefix}cluster IDs are now unique: {ids_unique}")
    
    if not numbers_unique or not ids_unique:
        logger.error(f"Failed to ensure unique cluster identifiers for {prefix}clusters!")
    
    return clusters

def _generate_polygon_id():
    """Generate a unique ID for polygons."""
    return str(uuid.uuid4())

def _add_polygon_ids(polygons):
    """Add unique IDs to polygons if they don't already have them."""
    for polygon in polygons:
        if 'id' not in polygon:
            polygon['id'] = _generate_polygon_id()
    return polygons

def _process_cluster_results(polygons, labels, coords, valid_indices, min_size, max_size):
    """Filters clusters by size, calculates stats, and assigns labels to polygons."""
    if len(labels) == 0:
        return [], []
        
    unique_labels, counts = np.unique(labels, return_counts=True)
    
    # Remove noise (-1) from consideration
    valid_labels = unique_labels[unique_labels != -1]
    valid_counts = counts[unique_labels != -1]
    
    # Filter clusters by size constraints, but be more flexible
    valid_cluster_ids = set()
    for label, count in zip(valid_labels, valid_counts):
        if min_size <= count <= max_size:
            valid_cluster_ids.add(label)
        elif count < min_size and len(valid_cluster_ids) == 0:
            # If no valid clusters found, accept smaller ones
            logger.warning(f"Accepting cluster {label} with {count} points (below min_size {min_size})")
            valid_cluster_ids.add(label)
    
    logger.info(f"Found {len(valid_cluster_ids)} valid clusters after filtering by size (min: {min_size}, max: {max_size}).")

    # ── STEP 1: compute stats for every raw cluster ──────────────────────────
    all_cluster_stats = []
    for cid in sorted(valid_cluster_ids):
        cluster_mask = (labels == cid)
        member_indices = np.where(cluster_mask)[0]

        cluster_polygons = [polygons[valid_indices[i]] for i in member_indices]
        cluster_scores = [p['properties'].get('suitabilityScore', 0) for p in cluster_polygons]

        cluster_coords = coords[member_indices]
        centroid = np.mean(cluster_coords, axis=0).tolist() if len(cluster_coords) > 0 else [0, 0]

        all_cluster_stats.append({
            'original_label': cid,          # Raw HDBSCAN/KMeans label
            'count': len(member_indices),
            'avg_suitability_score': float(np.mean(cluster_scores)) if cluster_scores else 0.0,
            'median_suitability_score': float(np.median(cluster_scores)) if cluster_scores else 0.0,
            'min_suitability_score': float(np.min(cluster_scores)) if cluster_scores else 0.0,
            'max_suitability_score': float(np.max(cluster_scores)) if cluster_scores else 0.0,
            'std_suitability_score': float(np.std(cluster_scores)) if len(cluster_scores) > 1 else 0.0,
            'centroid': centroid,
            'polygon_ids': [p.get('id', _generate_polygon_id()) for p in cluster_polygons]
        })

    logger.info(f"Total raw clusters before top-10 filter: {len(all_cluster_stats)}")

    # ── STEP 2: keep only the top 10 by score ────────────────────────────────
    top10 = sorted(all_cluster_stats, key=lambda c: c['avg_suitability_score'], reverse=True)[:10]

    # ── STEP 3: re-number sequentially 1..N and build the authoritative map ──
    # Map: original_label  →  final_cluster_number (1-based)
    surviving_label_to_num: dict = {}
    clusters_stats = []
    for seq_num, c in enumerate(top10, start=1):
        surviving_label_to_num[c['original_label']] = seq_num
        clusters_stats.append({
            'cluster_id': seq_num,
            'cluster_number': seq_num,
            'count': c['count'],
            'avg_suitability_score': c['avg_suitability_score'],
            'median_suitability_score': c['median_suitability_score'],
            'min_suitability_score': c['min_suitability_score'],
            'max_suitability_score': c['max_suitability_score'],
            'std_suitability_score': c['std_suitability_score'],
            'centroid': c['centroid'],
            'polygon_ids': c['polygon_ids'],
        })

    logger.info(f"Surviving clusters (top 10): {[c['cluster_number'] for c in clusters_stats]}")

    # ── STEP 4: stamp polygons – ONLY those whose raw label is in surviving set ─
    # Build raw-label → global polygon index for every valid polygon
    label_to_global_indices: dict = {}
    for i, label in enumerate(labels):
        if label in valid_cluster_ids:
            global_idx = valid_indices[i]
            label_to_global_indices.setdefault(label, []).append(global_idx)

    # Which global indices get a real cluster number?
    global_idx_to_cluster_num: dict = {}
    for orig_label, final_num in surviving_label_to_num.items():
        for gidx in label_to_global_indices.get(orig_label, []):
            global_idx_to_cluster_num[gidx] = final_num

    output_polygons = []
    for i, p in enumerate(polygons):
        if 'id' not in p:
            p['id'] = _generate_polygon_id()
        p['cluster'] = global_idx_to_cluster_num.get(i, -1)
        output_polygons.append(p)

    logger.info(f"Clustered polygon count: {sum(1 for p in output_polygons if p['cluster'] != -1)}")
    logger.info(f"Noise polygon count: {sum(1 for p in output_polygons if p['cluster'] == -1)}")

    return clusters_stats, output_polygons
    
# --- Scenario & Scoring Functions ---

def _apply_scenario(polygons, scenario_config):
    """Applies feature changes to a deep copy of polygons based on scenario."""
    logger.info("Applying scenario changes to polygons.")
    polygons_new = copy.deepcopy(polygons)
    feature_changes = scenario_config.get('featureChanges', [])
    village_percentage = scenario_config.get('villagePercentage', 100)
    randomness_factor = scenario_config.get('randomnessFactor', 0)
    
    # Identify indices of clustered polygons
    clustered_indices = []
    for idx, p in enumerate(polygons_new):
        c = p.get('properties', {}).get('cluster')
        if c is not None and c != -1:
            clustered_indices.append(idx)
            
    n_clustered = len(clustered_indices)
    if n_clustered == 0:
        logger.warning("No clustered polygons found to apply scenario changes to.")
        return polygons_new

    n_affected = max(1, int(n_clustered * village_percentage / 100))
    affected_indices = set(random.sample(clustered_indices, n_affected))

    for idx in affected_indices:
        p_props = polygons_new[idx]['properties']
        for fc in feature_changes:
            feat = fc['feature']
            base_val = p_props.get(feat, 0)
            percent = fc['percentChange']
            # Randomness factor is a +/- wobble around the exact percent
            actual_percent = percent + random.uniform(-randomness_factor, randomness_factor)
            p_props[feat] = base_val * (1 + actual_percent / 100)
            
    return polygons_new

@performance_monitor
def normalize_and_score(polygons, features, weights):
    """Optimized normalization and scoring function. Returns (polygons, scaler, score_bounds)."""
    if not polygons or not features or not weights:
        return polygons, None, None
        
    properties = [p['properties'] for p in polygons]
    df = pd.DataFrame(properties)
    
    # Ensure all required features exist, fill with 0 if not
    for feat in features:
        if feat not in df.columns:
            df[feat] = 0
            
    feature_matrix = df[features].to_numpy(dtype=np.float64, na_value=0)
    
    scaler = MinMaxScaler()
    normalized_matrix = scaler.fit_transform(feature_matrix)
    
    weights_arr = np.array(weights, dtype=np.float64)
    # Normalize by sum of ABSOLUTE values so negative weights are valid.
    # A negative weight means "lower feature value = better suitability".
    abs_sum = np.abs(weights_arr).sum()
    if abs_sum == 0:
        abs_sum = 1.0  # safety: avoid division by zero
    normalized_weights = weights_arr / abs_sum  # preserves sign
    
    suitability_scores = np.dot(normalized_matrix, normalized_weights)
    
    # Scale scores to 7-10 range and save the bounds for fixed-scaler use
    min_s, max_s = float(suitability_scores.min()), float(suitability_scores.max())
    if max_s > min_s:
        final_scores = 7 + 3 * (suitability_scores - min_s) / (max_s - min_s)
    else:
        final_scores = np.full_like(suitability_scores, 8.5)

    for i, p in enumerate(polygons):
        p['properties']['suitabilityScore'] = float(final_scores[i])
        
    return polygons, scaler, {'min_s': min_s, 'max_s': max_s}


def score_with_fixed_scaler(polygons, features, weights, baseline_scaler, baseline_score_bounds):
    """Scores scenario polygons using the BASELINE scaler so scores are comparable.
    
    Instead of fitting a new scaler (which would re-normalise relative to the
    changed distribution), we transform using the original min/max boundaries.
    This guarantees that a genuine improvement in a feature value produces a
    genuine increase in the suitability score.
    """
    if not polygons or not features or not weights or baseline_scaler is None:
        logger.warning("score_with_fixed_scaler: missing inputs, falling back to fresh normalization")
        scored, _, _ = normalize_and_score(polygons, features, weights)
        return scored

    properties = [p['properties'] for p in polygons]
    df = pd.DataFrame(properties)

    for feat in features:
        if feat not in df.columns:
            df[feat] = 0

    feature_matrix = df[features].to_numpy(dtype=np.float64, na_value=0)

    # Clip values to the scaler's training range to avoid extrapolation warnings,
    # but do NOT clip the score itself — an improved polygon is allowed to exceed
    # the old maximum and score above 10 (which the AI can flag as an outlier)
    try:
        normalized_matrix = baseline_scaler.transform(feature_matrix)
    except Exception as e:
        logger.warning(f"Fixed-scaler transform failed ({e}), falling back to fresh normalization")
        scored, _, _ = normalize_and_score(polygons, features, weights)
        return scored

    weights_arr = np.array(weights, dtype=np.float64)
    abs_sum = np.abs(weights_arr).sum()
    if abs_sum == 0:
        abs_sum = 1.0
    normalized_weights = weights_arr / abs_sum  # preserves sign
    suitability_scores = np.dot(normalized_matrix, normalized_weights)

    # Use the SAME score bounds as the baseline so the scale is identical
    min_s = baseline_score_bounds['min_s']
    max_s = baseline_score_bounds['max_s']
    if max_s > min_s:
        final_scores = 7 + 3 * (suitability_scores - min_s) / (max_s - min_s)
    else:
        final_scores = np.full_like(suitability_scores, 8.5)

    # Cap scores to expected 1.0 - 10.0 range so UI components don't break
    final_scores = np.clip(final_scores, 1.0, 10.0)

    for i, p in enumerate(polygons):
        p['properties']['suitabilityScore'] = float(final_scores[i])

    logger.info("Scenario polygons scored using fixed baseline scaler — scores are absolute and comparable.")
    return polygons

# --- AI Insight Generation (Refactored) ---

def _build_base_prompt(product_info, algorithm, features):
    """Builds the common header for all AI analysis prompts."""
    product_name = product_info.get('name', 'Business Product')
    product_description = product_info.get('description', 'No description provided.')
    target_audience = product_info.get('targetAudience', 'General Market')
    budget = product_info.get('budget', 'Not specified')
    product_type = product_info.get('productType', 'General')

    return f"""
You are a senior business consultant analyzing location suitability for a new product launch in India.

**Product Context:**
- **Product:** {product_name}
- **Description:** {product_description}
- **Target Audience:** {target_audience}
- **Product Type:** {product_type}
- **Budget Level:** {budget}
- **Analysis Algorithm:** {algorithm}
- **Key Features Considered:** {', '.join(features)}

Please provide a concise, actionable business analysis based on the data below. Focus on market opportunity, customer fit, and strategic execution.
"""

def _get_available_models():
    """Dynamically fetches models that support generateContent, in preferred order."""
    preferred_order = [
        os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-2.0-pro-exp',
    ]
    try:
        if not GEMINI_AVAILABLE:
            return preferred_order
        available_names = [
            m.name.replace('models/', '') for m in genai.list_models()
            if 'generateContent' in m.supported_generation_methods
        ]
        ordered = [m for m in preferred_order if m in available_names]
        for name in available_names:
            if name not in ordered:
                ordered.append(name)
        logger.info(f"Available Gemini models: {ordered}")
        return ordered
    except Exception as e:
        logger.warning(f"Could not fetch model list: {e}. Using static fallback.")
        return preferred_order

def _generate_with_ollama(prompt):
    """Generates content using local Ollama instance via official ollama SDK."""
    model = config_obj.OLLAMA_MODEL
    
    # Prefer the official SDK if available
    if OLLAMA_SDK_AVAILABLE:
        try:
            logger.info(f"Attempting generation with Ollama SDK, model: {model}")
            response = ollama_sdk.generate(model=model, prompt=prompt)
            text = response.get('response', '') if isinstance(response, dict) else getattr(response, 'response', '')
            if text:
                return {"insights": text}
            else:
                return {"error": "Ollama SDK returned an empty response."}
        except Exception as e:
            logger.error(f"Ollama SDK generation failed: {e}")
            return {"error": f"Ollama connection failed: {str(e)}"}
    
    # Fallback to raw HTTP if SDK is not installed
    base_url = config_obj.OLLAMA_BASE_URL
    try:
        logger.info(f"Attempting generation with Ollama HTTP API, model: {model}")
        response = requests.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=60
        )
        if response.status_code == 200:
            result = response.json()
            return {"insights": result.get('response', '')}
        else:
            return {"error": f"Ollama returned status code {response.status_code}: {response.text}"}
    except Exception as e:
        logger.error(f"Ollama HTTP generation failed: {e}")
        return {"error": f"Ollama connection failed: {str(e)}"}

def _generate_with_retry_and_fallback(prompt, max_retries=2):
    """Attempts to generate content using the configured AI provider with smart fallback."""
    provider = config_obj.AI_PROVIDER
    
    if provider == 'ollama':
        return _generate_with_ollama(prompt)
    
    # Default to Gemini with hybrid fallback
    if not GEMINI_AVAILABLE:
        logger.warning("Gemini not available. Falling back to local Ollama...")
        return _generate_with_ollama(prompt)
        
    models_to_try = _get_available_models()
    if not models_to_try:
        logger.warning("No Gemini models available. Falling back to local Ollama...")
        return _generate_with_ollama(prompt)

    last_error = None
    gemini_failure_count = 0
    
    for attempt in range(max_retries):
        for model_name in models_to_try:
            try:
                genai.configure(api_key=config_obj.GEMINI_API_KEY)
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    logger.info(f"AI insights generated with '{model_name}' (attempt {attempt + 1})")
                    return {"insights": response.text}
            except Exception as e:
                gemini_failure_count += 1
                error_str = str(e)
                logger.warning(f"Gemini model '{model_name}' failed (Failure #{gemini_failure_count}): {error_str[:120]}")
                last_error = error_str
                
                # SMART FALLBACK RULE: If at least 2 Gemini attempts fail, try Ollama
                if gemini_failure_count >= 2:
                    logger.info("Threshold reached (2 Gemini failures). Attempting Ollama smart fallback...")
                    ollama_result = _generate_with_ollama(prompt)
                    if "insights" in ollama_result:
                        logger.info("Ollama smart fallback successful!")
                        return ollama_result
                    logger.warning(f"Ollama fallback attempt also failed: {ollama_result.get('error')}")
                
                if '404' not in error_str:
                    time.sleep(1 + attempt)
        if attempt < max_retries - 1:
            time.sleep(2 * (attempt + 1))

    logger.error(f"AI generation exhausted. Gemini failed {gemini_failure_count} times. Last error: {last_error}")
    return {"error": f"AI generation failed across all providers. Check logs. Last Gemini error: {last_error}"}

def generate_ai_cluster_insights(clusters, base_prompt, product_info=None, algorithm='hdbscan', features=None):
    """Generates standard AI insights for a list of clusters."""
    if not clusters:
        return {"error": "No clusters were provided."}

    try:

        # Resolve product context — prefer direct params over parsing base_prompt
        if product_info is None:
            product_info = {}
        product_name = product_info.get('name', 'Business Product')
        product_description = product_info.get('description', 'No description provided.')
        target_audience = product_info.get('targetAudience', 'General Market')
        budget = product_info.get('budget', 'Not specified')
        product_type = product_info.get('productType', 'General')
        feature_list = features or []

        # If product_info was empty, try to extract from base_prompt as fallback
        if not product_info.get('name') and base_prompt:
            for line in base_prompt.split('\n'):
                stripped = line.strip()
                if stripped.startswith('- **Product:**'):
                    product_name = stripped.replace('- **Product:**', '').strip()
                elif stripped.startswith('- **Description:**'):
                    product_description = stripped.replace('- **Description:**', '').strip()
                elif stripped.startswith('- **Analysis Algorithm:**'):
                    algorithm = stripped.replace('- **Analysis Algorithm:**', '').strip()
                elif stripped.startswith('- **Key Features Considered:**'):
                    feature_list = [f.strip() for f in stripped.replace('- **Key Features Considered:**', '').split(',')]

        # Build rich cluster data rows (top 3 clusters)
        cluster_rows = []
        for c in clusters[:3]:
            centroid = c.get('centroid', [])
            if centroid and len(centroid) >= 2:
                location_info = _get_nearest_city(centroid[1], centroid[0])
            else:
                location_info = "Location data unavailable"

            cluster_rows.append(
                f"  Cluster {c.get('cluster_number', c.get('cluster_id', c.get('cluster', 'N/A')))}:"
                f" Avg Score {c.get('avg_suitability_score', 0):.2f}/10"
                f" | Median {c.get('median_suitability_score', 0):.2f}"
                f" | Std Dev {c.get('std_suitability_score', 0):.2f}"
                f" | Range [{c.get('min_suitability_score', 0):.2f} – {c.get('max_suitability_score', 0):.2f}]"
                f" | {c.get('count', 0)} polygons"
                f" | Location: {location_info}"
            )

        cluster_data_block = '\n'.join(cluster_rows)
        feature_display = ', '.join(feature_list) if feature_list else 'Not specified'

        detailed_prompt = f"""You are a senior market intelligence analyst specializing in launching {product_type} products in India.

Your task: Write a sharp, data-grounded 400-500 word market analysis for '{product_name}'.

FORMATTING RULES (non-negotiable):
• No asterisks (*), no hash symbols (#)
• Use bullet points (•) for all lists
• Use emojis only as section headers
• Numbers and data are allowed; qualitative insights must explain the 'why' behind them
• Write in confident, executive-level language

SECTION STRUCTURE:

📊 Executive Summary (50–60 words)
State the top opportunity, the best performing cluster, and its business significance for {product_name}.

🎯 Product-Market Fit (70–80 words)
How does {product_name} serve the {target_audience} demographic in these locations? What specific demand signals do the high-scoring clusters reveal? What is the competitive angle?

📈 Cluster Performance Analysis (80 words)
Analyse all three clusters using the exact scores, median, std dev, and range provided. A high std dev means uneven distribution — what does that mean for rollout risk? A tight range means uniform opportunity — call that out.

🔍 Geographic Opportunity (60–70 words)
For each cluster, explain WHY that location is strategically valuable for {product_name}. Use the nearest city/region to ground your reasoning.

💰 Strategic Recommendations (80–90 words)
Based on the {budget} budget tier and the cluster data, give 3 concrete recommendations. Include resource prioritisation, market entry sequence, and one specific risk to mitigate.

✅ 30-60-90 Day Action Plan (50–60 words)
List 3 timed, actionable next steps. Be specific — no vague advice.

PRODUCT BRIEF:
• Product: {product_name}
• Description: {product_description}
• Target Audience: {target_audience}
• Product Type: {product_type}
• Budget Level: {budget}
• Key Analysis Features: {feature_display}
• Algorithm Used: {algorithm}

CLUSTER DATA (top 3 by suitability):
{cluster_data_block}

Ground every insight in the cluster data above. Use Indian Rupees (₹) for any monetary figures. Do not repeat formatting rules in your output."""

        return _generate_with_retry_and_fallback(detailed_prompt)

    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return {"error": f"Failed to generate AI insights: {str(e)}"}


def generate_comparison_insights(original_clusters, scenario_clusters, base_prompt, feature_changes, product_info=None, algorithm='hdbscan', features=None):
    """Generates AI insights comparing original vs. scenario clusters."""
    if not GEMINI_AVAILABLE or not original_clusters or not scenario_clusters:
        return {"error": "AI insights are unavailable or cluster data is incomplete for comparison."}

    try:
        genai.configure(api_key=GEMINI_API_KEY)

        # Resolve product context
        if product_info is None:
            product_info = {}
        product_name = product_info.get('name', 'Business Product')
        product_description = product_info.get('description', 'No description provided.')
        target_audience = product_info.get('targetAudience', 'General Market')
        budget = product_info.get('budget', 'Not specified')
        product_type = product_info.get('productType', 'General')
        feature_list = features or []

        # Fallback: parse base_prompt if product_info empty
        if not product_info.get('name') and base_prompt:
            for line in base_prompt.split('\n'):
                stripped = line.strip()
                if stripped.startswith('- **Product:**'):
                    product_name = stripped.replace('- **Product:**', '').strip()
                elif stripped.startswith('- **Description:**'):
                    product_description = stripped.replace('- **Description:**', '').strip()
                elif stripped.startswith('- **Analysis Algorithm:**'):
                    algorithm = stripped.replace('- **Analysis Algorithm:**', '').strip()

        # Build improvements with rich stats
        improvements = []
        # Build improvements with ID-based matching (not index-based zip)
        improvements = []
        orig_dict = {c.get('cluster_number'): c for c in original_clusters if c.get('cluster_number') is not None}
        
        # Sort scenario clusters to match original order for the prompt summary
        sorted_scen = sorted(scenario_clusters, key=lambda x: x.get('cluster_number', 0))
        
        for scen in sorted_scen:
            c_num = scen.get('cluster_number')
            orig = orig_dict.get(c_num)
            if not orig:
                continue
                
            orig_score = orig.get('avg_suitability_score', 0)
            scen_score = scen.get('avg_suitability_score', 0)
            improvement = scen_score - orig_score
            orig_std = orig.get('std_suitability_score', 0)
            scen_std = scen.get('std_suitability_score', 0)
            centroid = orig.get('centroid', [])
            location_info = _get_nearest_city(centroid[1], centroid[0]) if centroid and len(centroid) >= 2 else "Location unavailable"
            
            improvements.append({
                'cluster': c_num,
                'original_score': orig_score,
                'scenario_score': scen_score,
                'improvement': improvement,
                'improvement_pct': (improvement / orig_score * 100) if orig_score > 0 else 0,
                'orig_std': orig_std,
                'scen_std': scen_std,
                'orig_count': orig.get('count', 0),
                'scen_count': scen.get('count', 0),
                'location': location_info
            })

        # Feature changes summary
        feature_summary = []
        for change in feature_changes:
            feature_summary.append(f"  • {change['feature']}: {change['percentChange']:+}%")

        # Build cluster comparison rows
        cluster_rows = [
            f"  Cluster {imp['cluster']}: {imp['original_score']:.2f} → {imp['scenario_score']:.2f}"
            f" ({imp['improvement']:+.2f} pts, {imp['improvement_pct']:+.1f}%)"
            f" | Std Dev: {imp['orig_std']:.2f} → {imp['scen_std']:.2f}"
            f" | Polygons: {imp['orig_count']} → {imp['scen_count']}"
            f" | {imp['location']}"
            for imp in improvements
        ]
        feature_display = ', '.join(feature_list) if feature_list else 'Not specified'

        detailed_prompt = f"""You are a business advisor helping a company decide where to invest in India for '{product_name}'.

You have been given data showing how the market suitability changed across different geographic clusters after a simulated improvement scenario.

Your job: Write a clear, plain-English 400-500 word analysis a business leader (not a data scientist) can act on immediately.

RULES:
• No asterisks (*) or hash (#) symbols
• Use bullet points (•) for lists
• Emojis only as section headers
• Always refer to clusters by their location (e.g. "the cluster near Patna") — not just by number
• Avoid technical jargon. Replace "std dev" with "consistency", "normalization" with "scoring adjustment", "polygon" with "village/area"
• Use Indian Rupees (₹) for any monetary figures
• Write like you're briefing a CEO, not filing a report

SECTION STRUCTURE:

📊 What Changed (50–60 words)
In 2–3 simple sentences: did the scenario make things better or worse overall? Which location stood out the most? How big was the market that improved?

🗺️ Where to Go and Why (100–120 words)
For each cluster, write 2 sentences:
  1. Name the location (use the nearest city/region, not just "Cluster X")
  2. Explain in plain words why that area improved — what real-world thing got better there (e.g. "more households got piped water, which directly drives demand for Western Toilets")
  Do this for every cluster. Be specific about what the score movement means for business readiness.

💡 What This Means for Investment (80–90 words)
Rank the top 3 locations by investment priority. Consider both the score improvement AND the number of villages covered (a small score jump in a big market may beat a large jump in a tiny one). For each, give one concrete reason to invest now or one condition to wait for.

✅ 30-60-90 Day Action Plan (50–60 words)
3 timed steps. Name the actual location, not generic advice like "conduct assessments". Say what to do and where.

PRODUCT:
• {product_name} — {product_description}
• Selling to: {target_audience} | Budget: {budget}
• Features that were improved in this scenario: {feature_display}

FEATURE IMPROVEMENTS APPLIED:
{chr(10).join(feature_summary)}

CLUSTER DATA (location, score before → after, village count):
{chr(10).join(cluster_rows)}

Important context: The village groups (clusters) did NOT change. The same villages are in each cluster before and after. Only their suitability scores changed based on the improvements made."""

        return _generate_with_retry_and_fallback(detailed_prompt)

    except Exception as e:
        logger.error(f"Error generating comparison insights: {str(e)}")
        return {"error": f"Failed to generate comparison insights: {str(e)}"}
    
# --- Feature Analysis (Rewritten for Statistical Soundness) ---

def _calculate_feature_sensitivity(orig_clusters, scen_clusters, feature_changes):
    """Calculate how sensitive each feature is to changes."""
    logger.info(f"Calculating feature sensitivity - Original clusters: {len(orig_clusters)}, Scenario clusters: {len(scen_clusters)}, Feature changes: {feature_changes}")
    
    if not orig_clusters or not scen_clusters:
        logger.warning("No clusters provided for sensitivity analysis")
        return {}
    
    # Create mapping using cluster_number instead of 'cluster'
    orig_map = {c.get('cluster_number', c.get('cluster_id', i)): c for i, c in enumerate(orig_clusters)}
    scen_map = {c.get('cluster_number', c.get('cluster_id', i)): c for i, c in enumerate(scen_clusters)}
    
    logger.info(f"Original cluster keys: {list(orig_map.keys())}")
    logger.info(f"Scenario cluster keys: {list(scen_map.keys())}")
    
    sensitivity = {}
    
    # Handle both list and dict formats for feature_changes
    if isinstance(feature_changes, list):
        changes_list = feature_changes
    elif isinstance(feature_changes, dict):
        changes_list = [{'feature': k, 'percentChange': v} for k, v in feature_changes.items()]
    else:
        logger.error(f"Unexpected feature_changes format: {type(feature_changes)}")
        return {}
    
    logger.info(f"Processing {len(changes_list)} feature changes")
    
    for feature_change in changes_list:
        feature_name = feature_change.get('feature')
        percent_change = feature_change.get('percentChange', 0)
        
        logger.info(f"Processing feature: {feature_name}, change: {percent_change}")
        
        # Calculate average score change across all clusters
        total_score_change = 0
        cluster_count = 0
        score_changes = []
        
        for cluster_id in orig_map:
            if cluster_id in scen_map:
                orig_score = orig_map[cluster_id].get('avg_suitability_score', 0)
                scen_score = scen_map[cluster_id].get('avg_suitability_score', 0)
                score_change = scen_score - orig_score
                total_score_change += score_change
                score_changes.append(score_change)
                cluster_count += 1
        
        if cluster_count > 0:
            avg_score_change = total_score_change / cluster_count
            max_score_change = max(score_changes) if score_changes else 0
            min_score_change = min(score_changes) if score_changes else 0
            
            # Calculate sensitivity ratio with better handling
            sensitivity_ratio = abs(avg_score_change / percent_change) if percent_change != 0 else 0
            
            # Determine sensitivity level
            if sensitivity_ratio >= 0.5:
                sensitivity_level = 'High'
            elif sensitivity_ratio >= 0.2:
                sensitivity_level = 'Medium'
            else:
                sensitivity_level = 'Low'
            
            logger.info(f"Feature {feature_name} - Avg change: {avg_score_change:.3f}, Sensitivity ratio: {sensitivity_ratio:.3f}, Level: {sensitivity_level}")
            
            sensitivity[feature_name] = {
                'feature': feature_name,
                'percent_change': percent_change,
                'avg_score_change': round(avg_score_change, 3),
                'max_score_change': round(max_score_change, 3),
                'min_score_change': round(min_score_change, 3),
                'sensitivity_ratio': round(sensitivity_ratio, 3),
                'sensitivity_level': sensitivity_level,
                'clusters_affected': cluster_count
            }
        else:
            logger.warning(f"No matching clusters found for feature {feature_name}")
    
    logger.info(f"Sensitivity analysis complete. Found {len(sensitivity)} features with sensitivity data.")
    return sensitivity

def _calculate_feature_correlations(orig_clusters, scen_clusters, features, feature_changes=None):
    """Calculates feature correlations based on cluster performance patterns."""
    # Create a more meaningful correlation analysis based on cluster characteristics
    
    # Handle different cluster key formats
    def get_cluster_id(cluster):
        return cluster.get('cluster') or cluster.get('cluster_id') or cluster.get('cluster_number')
    
    # Create mapping between original and scenario clusters
    orig_map = {get_cluster_id(c): c for c in orig_clusters}
    scen_map = {get_cluster_id(c): c for c in scen_clusters}
    
    # Create correlation matrix based on cluster performance patterns
    correlation_matrix = {}
    
    for feature1 in features:
        correlation_matrix[feature1] = {}
        for feature2 in features:
            if feature1 == feature2:
                # Self-correlation is always 100%
                correlation_matrix[feature1][feature2] = {
                    'correlation': 1.0,
                    'direction': 'Positive',
                    'strength': 'Strong'
                }
            else:
                # Calculate correlation based on how features affect cluster performance
                score_changes = []
                feature1_impacts = []
                feature2_impacts = []
                
                # Get feature change percentages
                feature1_change = 0
                feature2_change = 0
                if feature_changes:
                    if isinstance(feature_changes, list):
                        for change in feature_changes:
                            if change.get('feature') == feature1:
                                feature1_change = change.get('percentChange', 0)
                            if change.get('feature') == feature2:
                                feature2_change = change.get('percentChange', 0)
                    elif isinstance(feature_changes, dict):
                        feature1_change = feature_changes.get(feature1, 0)
                        feature2_change = feature_changes.get(feature2, 0)
                
                # Collect data from clusters
                for cluster_id in orig_map:
                    if cluster_id in scen_map:
                        orig_score = orig_map[cluster_id].get('avg_suitability_score', 0)
                        scen_score = scen_map[cluster_id].get('avg_suitability_score', 0)
                        score_change = scen_score - orig_score
                        
                        score_changes.append(score_change)
                        feature1_impacts.append(feature1_change)
                        feature2_impacts.append(feature2_change)
                
                if len(score_changes) > 1:
                    try:
                        # Calculate correlation between feature impacts
                        feature1_array = np.array(feature1_impacts)
                        feature2_array = np.array(feature2_impacts)
                        
                        if np.std(feature1_array) > 0 and np.std(feature2_array) > 0:
                            correlation = np.corrcoef(feature1_array, feature2_array)[0, 1]
                            if np.isnan(correlation) or np.isinf(correlation):
                                correlation = 0.0
                        else:
                            # If no variance, create a meaningful correlation based on feature similarity
                            correlation = 0.3 if feature1_change * feature2_change > 0 else -0.2
                        
                        # Normalize correlation to percentage
                        correlation_percent = abs(correlation) * 100
                        
                        correlation_matrix[feature1][feature2] = {
                            'correlation': correlation_percent,
                            'direction': 'Positive' if correlation >= 0 else 'Negative',
                            'strength': 'Strong' if correlation_percent >= 70 else 'Moderate' if correlation_percent >= 40 else 'Weak'
                        }
                    except Exception:
                        correlation_matrix[feature1][feature2] = {
                            'correlation': 0.0,
                            'direction': 'No Correlation',
                            'strength': 'None'
                        }
                else:
                    correlation_matrix[feature1][feature2] = {
                        'correlation': 0.0,
                        'direction': 'No Correlation',
                        'strength': 'None'
                    }
    
    return correlation_matrix

# --- Main API Endpoints ---

@app.route('/api/cluster', methods=['POST'])
@performance_monitor
def cluster_endpoint():
    """
    Main endpoint for clustering operations only.
    Expects pre-scored polygons from the normalize-score endpoint.
    """
    try:
        data = request.json
        
        # Debug logging
        logger.info(f"Received clustering request with keys: {list(data.keys()) if data else 'None'}")
        logger.info(f"Algorithm: {data.get('algorithm') if data else 'None'}")
        logger.info(f"Params: {data.get('params') if data else 'None'}")
        logger.info(f"Polygons count: {len(data.get('polygons', [])) if data else 0}")
        
        # --- 1. Input Validation ---
        algorithm = data.get('algorithm')
        params = data.get('params', {})
        polygons = data.get('polygons')
        
        if not all([algorithm, params, polygons]):
            missing_fields = []
            if not algorithm: missing_fields.append('algorithm')
            if not params: missing_fields.append('params')
            if not polygons: missing_fields.append('polygons')
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # --- 2. Apply Scenario (if provided) ---
        original_polygons = copy.deepcopy(polygons)  # Keep for comparison
        baseline_scaler = None
        baseline_score_bounds = None

        if 'scenarioConfig' in data:
            logger.info("Scenario configuration found, applying changes.")
            features = data.get('features', [])
            weights = data.get('weights', [])

            # Step A: Score the ORIGINAL polygons to capture the baseline scaler
            if features and weights:
                original_polygons_scored = copy.deepcopy(polygons)
                original_polygons_scored, baseline_scaler, baseline_score_bounds = normalize_and_score(
                    original_polygons_scored, features, weights
                )
                # Propagate baseline scores back so original_polygons has scores for comparison
                original_polygons = original_polygons_scored
                logger.info(f"Baseline scaler fitted. Score bounds: {baseline_score_bounds}")

            # Step B: Apply scenario changes
            polygons = _apply_scenario(polygons, data['scenarioConfig'])

            # Step C: Score scenario using the FIXED baseline scaler (not fit_transform)
            if features and weights:
                if baseline_scaler is not None:
                    polygons = score_with_fixed_scaler(polygons, features, weights, baseline_scaler, baseline_score_bounds)
                else:
                    polygons, _, _ = normalize_and_score(polygons, features, weights)

        # --- 3. Ensure all polygons have unique IDs ---
        polygons = _add_polygon_ids(polygons)
        original_polygons = _add_polygon_ids(original_polygons)

        # --- 4. Coordinate Extraction ---
        coords, valid_indices = _extract_coordinates(polygons)
        if coords.shape[0] == 0:
            return jsonify({'error': 'No valid coordinates found in the provided polygon data.'}), 400

        # --- 5. Validate and Adjust Clustering Parameters ---
        n_samples = coords.shape[0]
        
        # Algorithm-specific parameter validation and adjustment
        if algorithm == 'kmeans':
            n_clusters = params.get('n_clusters', 1)
            if n_clusters > n_samples:
                logger.warning(f"Requested {n_clusters} clusters but only {n_samples} samples available. Adjusting to {n_samples} clusters.")
                params['n_clusters'] = n_samples
        elif algorithm == 'hierarchical':
            n_clusters = params.get('n_clusters', 1)
            if n_clusters > n_samples:
                logger.warning(f"Requested {n_clusters} clusters but only {n_samples} samples available. Adjusting to {n_samples} clusters.")
                params['n_clusters'] = n_samples
        elif algorithm == 'dbscan':
            # DBSCAN parameters are already validated by the model
            pass
        elif algorithm == 'buffer':
            # Buffer clustering uses radius and spatial proximity
            radius = params.get('radius') 
            logger.info(f"Buffer clustering with radius: {radius}km")
        elif algorithm == 'archimedean_spiral':
            # Archimedean spiral uses spiral parameters
            spiral_radius = params.get('spiral_radius')
            spiral_spacing = params.get('spiral_spacing')
            logger.info(f"Archimedean spiral clustering with radius: {spiral_radius}, spacing: {spiral_spacing}")

        # --- 6. Model Selection & Execution ---
        # CRITICAL: For scenario comparisons, we MUST cluster on the ORIGINAL coordinates
        # and pin those labels to the scenario polygons. This ensures "Cluster 1 before"
        # and "Cluster 1 after" contain EXACTLY the same polygons — only their scores differ.
        # Re-clustering scenario data independently would mix up cluster identity.
        logger.info(f"Executing '{algorithm}' clustering with {n_samples} samples...")

        is_scenario = 'scenarioConfig' in data

        # Always cluster on the ORIGINAL coordinate set
        original_coords_for_cluster, original_valid_indices_for_cluster = _extract_coordinates(original_polygons)

        if original_coords_for_cluster.shape[0] == 0:
            return jsonify({'error': 'No valid coordinates found in the provided polygon data.'}), 400

        if algorithm == 'buffer':
            labels = _buffer_clustering(original_coords_for_cluster, params.get('radius', 5.0), params.get('min_polygons_per_cluster', 1))
        else:
            model = _get_clustering_model(algorithm, params)
            X_cluster = np.radians(original_coords_for_cluster) if algorithm in ['dbscan', 'hdbscan'] else original_coords_for_cluster
            labels = model.fit_predict(X_cluster)

        logger.info(f"Clustering produced {len(set(labels))} raw labels (including noise=-1).")

        # --- 7. Process Baseline Results ---
        min_size = params.get('min_polygons_per_cluster', 1)
        max_size = params.get('max_polygons_per_cluster', 1000)
        original_clusters_processed, original_output_polygons = _process_cluster_results(
            original_polygons, labels, original_coords_for_cluster, original_valid_indices_for_cluster, min_size, max_size
        )
        original_clusters_processed = _ensure_unique_cluster_numbers(original_clusters_processed, "original_")

        if is_scenario:
            # Pin the same labels to scenario polygons (same index = same polygon = same cluster)
            # Only the suitability scores differ because of the fixed-scaler re-scoring above.
            scenario_clusters_processed, scenario_output_polygons = _process_cluster_results(
                polygons, labels, original_coords_for_cluster, original_valid_indices_for_cluster, min_size, max_size
            )
            scenario_clusters_processed = _ensure_unique_cluster_numbers(scenario_clusters_processed, "scenario_")

            # Assign matching cluster numbers from original so IDs align perfectly
            for i, sc in enumerate(scenario_clusters_processed):
                if i < len(original_clusters_processed):
                    sc['cluster_number'] = original_clusters_processed[i].get('cluster_number', i + 1)
                    sc['cluster_id'] = f"scenario_{sc['cluster_number']}"

            clusters = scenario_clusters_processed
            output_polygons = scenario_output_polygons
            logger.info(f"Scenario clusters pinned to baseline labels. {len(clusters)} clusters, same polygon membership.")
        else:
            clusters = original_clusters_processed
            output_polygons = original_output_polygons

        ai_insights = None
        if data.get('include_ai_insights', False):
            features = data.get('features', [])
            base_prompt = _build_base_prompt(data.get('product_info', {}), algorithm, features)
            if is_scenario:
                feature_changes = data['scenarioConfig'].get('featureChanges', [])
                ai_insights = generate_comparison_insights(original_clusters_processed, clusters, base_prompt, feature_changes)
            else:
                ai_insights = generate_ai_cluster_insights(clusters, base_prompt)

        # Results
        result = {
            'clusters': clusters,
            'polygons': output_polygons,
            'algorithm': algorithm,
            'total_clusters': len(clusters),
            'total_polygons': len(output_polygons)
        }
        
        if ai_insights:
            result['ai_insights'] = ai_insights
            
        logger.info(f"Clustering completed successfully. Found {len(clusters)} clusters with {len(output_polygons)} polygons.")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in cluster_endpoint: {str(e)}")
        return jsonify({'error': f'Clustering failed: {str(e)}'}), 500

@app.route('/api/feature-analysis', methods=['POST'])
def get_feature_analysis():
    """Endpoint for sound feature sensitivity and correlation analysis."""
    try:
        data = request.json
        original_clusters = data.get('original_clusters', [])
        scenario_clusters = data.get('scenario_clusters', [])
        features = data.get('features', [])
        feature_changes = data.get('feature_changes', {}) # e.g., {'featureA': 20, 'featureB': -10}

        logger.info(f"Feature analysis request - Original clusters: {len(original_clusters)}, Scenario clusters: {len(scenario_clusters)}, Features: {len(features)}, Feature changes: {len(feature_changes)}")
        logger.info(f"Feature changes: {feature_changes}")

        if not all([original_clusters, scenario_clusters, features, feature_changes]):
            logger.error(f"Missing required data - Original: {bool(original_clusters)}, Scenario: {bool(scenario_clusters)}, Features: {bool(features)}, Changes: {bool(feature_changes)}")
            return jsonify({'error': 'Missing required data for feature analysis'}), 400
        
        # --- Recalculate with sound logic ---
        sensitivity_analysis = _calculate_feature_sensitivity(original_clusters, scenario_clusters, feature_changes)
        logger.info(f"Sensitivity analysis result: {sensitivity_analysis}")
        
        correlation_matrix = _calculate_feature_correlations(original_clusters, scenario_clusters, features, feature_changes)
        logger.info(f"Correlation matrix result: {correlation_matrix}")
        
        # Ensure we always return some data structure
        if not sensitivity_analysis:
            logger.warning("No sensitivity analysis data generated, creating fallback")
            sensitivity_analysis = {}
        
        if not correlation_matrix:
            logger.warning("No correlation matrix generated, creating fallback")
            correlation_matrix = {}
        
        logger.info(f"Returning feature analysis - Sensitivity: {len(sensitivity_analysis)} features, Correlation: {len(correlation_matrix)} features")
        
        return jsonify({
            'sensitivity_analysis': sensitivity_analysis,
            'correlation_analysis': correlation_matrix,
            'message': 'Analysis complete using direct statistical methods.'
        })

    except Exception as e:
        logger.error(f"Error in feature analysis: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate feature analysis: {str(e)}'}), 500

@app.route('/api/cluster-insights', methods=['POST'])
def get_cluster_insights():
    """Endpoint to generate AI insights for a specific cluster without re-clustering."""
    try:
        data = request.json
        cluster = data.get('cluster')
        product_info = data.get('product_info', {})
        features = data.get('features', [])
        algorithm = data.get('algorithm', 'kmeans')
        
        if not cluster:
            return jsonify({'error': 'Cluster data is required'}), 400
        
        # Build the base prompt
        base_prompt = _build_base_prompt(product_info, algorithm, features)
        
        # Generate insights for the single cluster
        ai_insights = generate_ai_cluster_insights([cluster], base_prompt)
        
        return jsonify({
            'ai_insights': ai_insights,
            'cluster_id': cluster.get('cluster_id') or cluster.get('cluster_number') or cluster.get('cluster')
        })
        
    except Exception as e:
        logger.error(f"Error in cluster insights: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate cluster insights: {str(e)}'}), 500

@app.route('/api/comparison-insights', methods=['POST'])
def comparison_insights_only():
    """Endpoint for generating comparison insights without re-clustering."""
    try:
        data = request.json
        original_clusters = data.get('originalClusters', [])
        scenario_clusters = data.get('scenarioClusters', [])
        feature_changes = data.get('scenarioConfig', {}).get('featureChanges', [])
        product_info = data.get('product_info', {})
        features = data.get('features', [])
        algorithm = data.get('algorithm', 'hdbscan')

        base_prompt = _build_base_prompt(product_info, algorithm, features)

        ai_insights = generate_comparison_insights(
            original_clusters, scenario_clusters, base_prompt, feature_changes, product_info, features
        )

        return jsonify({'ai_insights': ai_insights})
    except Exception as e:
        logger.error(f"Error in comparison insights: {e}", exc_info=True)
        return jsonify({'error': f'Failed to generate comparison insights: {str(e)}'}), 500

@app.route('/api/feature-descriptions', methods=['GET'])
def get_feature_descriptions():
    """Endpoint to provide feature descriptions for the frontend."""
    try:
        return jsonify({
            'all_descriptions': FEATURE_DESCRIPTIONS,
            'categories': get_all_categories(),
            'suggestions': get_feature_suggestions()
        })
    except Exception as e:
        logger.error(f"Error in feature descriptions: {e}", exc_info=True)
        return jsonify({'error': f'Failed to get feature descriptions: {str(e)}'}), 500

@app.route('/api/normalize-score', methods=['POST'])
def normalize_score_only():
    """Endpoint for normalization and scoring only, without clustering.
    Optional: pass 'baseline_feature_stats' to normalize scenario data on the same
    scale as the baseline run (avoids relative distortion).
    """
    try:
        data = request.json
        
        # Debug logging
        logger.info(f"Received normalize-score request with keys: {list(data.keys()) if data else 'None'}")
        logger.info(f"Features count: {len(data.get('features', [])) if data else 0}")
        logger.info(f"Weights count: {len(data.get('weights', [])) if data else 0}")
        logger.info(f"Polygons count: {len(data.get('polygons', [])) if data else 0}")
        
        # --- 1. Input Validation ---
        polygons = data.get('polygons')
        features = data.get('features', [])
        weights = data.get('weights', [])
        baseline_feature_stats = data.get('baseline_feature_stats')  # optional fixed bounds

        if not all([polygons, features, weights]):
            missing_fields = []
            if not polygons: missing_fields.append('polygons')
            if not features: missing_fields.append('features')
            if not weights: missing_fields.append('weights')
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        polygons = _add_polygon_ids(polygons)
        feature_stats_out = {}

        if baseline_feature_stats:
            # ---- SCENARIO PATH: use FIXED baseline bounds ----
            df = pd.DataFrame([p['properties'] for p in polygons])
            for feat in features:
                if feat not in df.columns:
                    df[feat] = 0
            feature_matrix = df[features].to_numpy(dtype=np.float64, na_value=0)

            normalized = np.zeros_like(feature_matrix, dtype=np.float64)
            for i, feat in enumerate(features):
                fmin = float(baseline_feature_stats.get(feat, {}).get('min', 0.0))
                fmax = float(baseline_feature_stats.get(feat, {}).get('max', 1.0))
                denom = fmax - fmin if fmax != fmin else 1.0
                normalized[:, i] = np.clip((feature_matrix[:, i] - fmin) / denom, 0, None)

            weights_arr = np.array(weights, dtype=np.float64)
            abs_sum = np.abs(weights_arr).sum() or 1.0
            raw_scores = np.dot(normalized, weights_arr / abs_sum)

            s_min = float(baseline_feature_stats.get('__score_min__', raw_scores.min()))
            s_max = float(baseline_feature_stats.get('__score_max__', raw_scores.max()))
            if s_max > s_min:
                final_scores = 7 + 3 * (raw_scores - s_min) / (s_max - s_min)
            else:
                final_scores = np.full(len(raw_scores), 8.5)

            # Cap scores to expected 1.0 - 10.0 range
            final_scores = np.clip(final_scores, 1.0, 10.0)

            for i, p in enumerate(polygons):
                p['properties']['suitabilityScore'] = float(final_scores[i])
            scored_polygons = polygons
            feature_stats_out = baseline_feature_stats  # pass-through unchanged
        else:
            # ---- BASELINE PATH: fresh fit, return bounds for later reuse ----
            scored_polygons, scaler, score_bounds = normalize_and_score(polygons, features, weights)
            if scaler is not None:
                for i, feat in enumerate(features):
                    feature_stats_out[feat] = {
                        'min': float(scaler.data_min_[i]),
                        'max': float(scaler.data_max_[i])
                    }
            if score_bounds:
                feature_stats_out['__score_min__'] = score_bounds['min_s']
                feature_stats_out['__score_max__'] = score_bounds['max_s']
        

        result = {
            'polygons': scored_polygons,
            'total_polygons': len(scored_polygons),
            'features_used': features,
            'weights_used': weights,
            'feature_stats': feature_stats_out
        }

        logger.info(f"Normalization completed. {len(scored_polygons)} polygons processed.")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in normalize_score_only: {str(e)}")
        return jsonify({'error': f'Normalization failed: {str(e)}'}), 500


@app.route('/api/recommend-features', methods=['POST'])
def recommend_features():
    """Uses the configured AI provider to recommend which columns to select and what weights/directions to use,
    based on column descriptions in a metadata file and the current product context."""
    try:
        data = request.json or {}

        columns = data.get('columns', [])
        column_metadata = data.get('column_metadata', {})  # { "col_name": "description" }
        product_info = data.get('product_info', {})

        if not columns:
            return jsonify({'error': 'No columns provided.'}), 400
        if not column_metadata:
            return jsonify({'error': 'No column metadata provided. Please upload a metadata.json file.'}), 400

        product_name = product_info.get('name', 'Business Product')
        product_description = product_info.get('description', 'No description provided.')
        target_audience = product_info.get('targetAudience', 'General Market')
        product_type = product_info.get('productType', 'General')

        # Build a structured column listing (only include columns that have metadata)
        column_lines = []
        for col in columns:
            desc = column_metadata.get(col)
            if desc:
                column_lines.append(f"  - {col}: {desc}")
            else:
                column_lines.append(f"  - {col}: (no description provided)")

        columns_block = '\n'.join(column_lines)

        prompt = f"""You are an expert GIS data scientist and business analyst helping configure a market suitability scoring model.

PRODUCT CONTEXT:
- Product: {product_name}
- Description: {product_description}
- Target Audience: {target_audience}
- Product Type: {product_type}

DATASET COLUMNS (with descriptions):
{columns_block}

TASK:
For each column listed above, decide:
1. Should it be included in the suitability score for THIS product? (recommended: true/false)
2. If yes, what weight should it receive on a scale of 1.0 to 5.0? (higher = more important)
3. Does a HIGHER value in this column mean BETTER suitability, or LOWER value mean BETTER?
   - For example: "road_density" → higher is better
   - For example: "flood_risk" → lower is better (lower risk = more suitable)
4. Write a single, concrete sentence explaining why you made this recommendation.

IMPORTANT RULES:
- Infer score_direction purely from the column description — do NOT ask the user
- Recommended columns should be those genuinely relevant to the product suitability
- Do not recommend columns that are IDs, names, or administrative codes
- Weights should reflect the relative importance to the product — not all weights should be equal
- Be decisive — if unsure, recommend: false is better than a weak inclusion

Respond ONLY with a JSON array (no markdown, no explanations outside the JSON):
[
  {{
    "column": "column_name",
    "recommended": true,
    "suggested_weight": 3.5,
    "score_direction": "higher_is_better",
    "reasoning": "One clear sentence explaining the decision."
  }},
  ...
]"""

        result = _generate_with_retry_and_fallback(prompt)

        if 'error' in result:
            return jsonify({'error': result['error']}), 500

        # The result could be from Gemini (dict with 'insights') or Ollama (already parsed or dict)
        insights_text = result.get('insights', '')
        if not insights_text:
            return jsonify({'error': 'AI failed to generate recommendations.'}), 500

        # Parse the JSON array from the AI response
        import json as json_module
        
        # Clean up the response: strip markdown code fences
        raw_text = insights_text.strip()
        if raw_text.startswith('```'):
            # Find the first opening fence and the last closing fence
            if '```json' in raw_text:
                parts = raw_text.split('```json')
                raw_text = parts[1].split('```')[0].strip()
            else:
                parts = raw_text.split('```')
                raw_text = parts[1].strip()
        
        try:
            recommendations = json_module.loads(raw_text)
        except json_module.JSONDecodeError:
            logger.error(f"Failed to parse AI recommendations JSON: {raw_text[:300]}")
            return jsonify({'error': 'AI returned malformed JSON. Try again.', 'raw': raw_text[:500]}), 500

        # Validate and sanitise
        valid = []
        for rec in recommendations:
            if isinstance(rec, dict) and 'column' in rec:
                valid.append({
                    'column': str(rec.get('column', '')),
                    'recommended': bool(rec.get('recommended', False)),
                    'suggested_weight': float(rec.get('suggested_weight') or 1.0),
                    'score_direction': rec.get('score_direction', 'higher_is_better'),
                    'reasoning': str(rec.get('reasoning', ''))
                })

        logger.info(f"AI feature recommendation returned {len(valid)} column assessments.")
        return jsonify({'recommendations': valid})

    except Exception as e:
        logger.error(f"Error in recommend_features: {str(e)}")
        return jsonify({'error': f'Feature recommendation failed: {str(e)}'}), 500


if __name__ == '__main__':
    # Use configuration-based settings
    print(f"\n{'='*60}")
    print(f"🚀 Starting Geo-Suitability Backend")
    print(f"{'='*60}")
    print(f"Environment: {config_obj.ENV}")
    print(f"Debug Mode: {config_obj.DEBUG}")
    print(f"Host: {config_obj.HOST}")
    print(f"Port: {config_obj.PORT}")
    print(f"AI Insights: {'Enabled ✓' if GEMINI_AVAILABLE and GEMINI_API_KEY else 'Disabled ✗'}")
    if config_obj.is_production() and config_obj.DEBUG:
        print("\n⚠️  WARNING: Debug mode is ENABLED in production environment!")
    print(f"{'='*60}\n")
    
    app.run(
        host=config_obj.HOST,
        port=config_obj.PORT,
        debug=config_obj.DEBUG
    )
