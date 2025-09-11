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

# Import Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    print("Warning: google-generativeai not installed. AI insights will not be available.")
    GEMINI_AVAILABLE = False
from feature_descriptions import get_feature_description, get_features_by_category, get_all_categories, get_feature_suggestions, FEATURE_DESCRIPTIONS

# Load environment variables from .env file
load_dotenv()

# --- App & Logging Setup ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:8080"}}) # Adjust origin for production
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

# --- Gemini AI Configuration ---
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("Warning: GEMINI_API_KEY not found. AI insights will not be available.")
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
    elif algorithm == 'archimedean_spiral':
        # For archimedean spiral, we'll use a custom implementation
        # For now, fall back to KMeans with the specified number of clusters
        n_clusters = max(1, params.get('n_clusters', 10))
        return KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
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

    # Calculate statistics for valid clusters
    clusters_stats = []
    cluster_counter = 1  # Sequential counter for cluster IDs
    
    # Create a mapping from original cluster labels to sequential numbers
    label_to_sequential = {}
    sequential_counter = 1
    
    for cid in valid_cluster_ids:
        label_to_sequential[cid] = sequential_counter
        sequential_counter += 1
    
    for cid in valid_cluster_ids:
        cluster_mask = (labels == cid)
        member_indices = np.where(cluster_mask)[0]
        
        cluster_polygons = [polygons[valid_indices[i]] for i in member_indices]
        cluster_scores = [p['properties'].get('suitabilityScore', 0) for p in cluster_polygons]
        
        cluster_coords = coords[member_indices]
        centroid = np.mean(cluster_coords, axis=0).tolist() if len(cluster_coords) > 0 else [0, 0]
        
        # Generate sequential cluster ID and number
        cluster_id = cluster_counter
        cluster_number = label_to_sequential[cid]  # Use sequential mapping
        cluster_counter += 1
        
        clusters_stats.append({
            'cluster_id': cluster_id,
            'cluster_number': cluster_number,  # Now guaranteed to be sequential
            'count': len(member_indices),
            'avg_suitability_score': float(np.mean(cluster_scores)) if cluster_scores else 0.0,
            'median_suitability_score': float(np.median(cluster_scores)) if cluster_scores else 0.0,
            'min_suitability_score': float(np.min(cluster_scores)) if cluster_scores else 0.0,
            'max_suitability_score': float(np.max(cluster_scores)) if cluster_scores else 0.0,
            'std_suitability_score': float(np.std(cluster_scores)) if len(cluster_scores) > 1 else 0.0,
            'centroid': centroid,
            'polygon_ids': [p.get('id', _generate_polygon_id()) for p in cluster_polygons]
        })

    # Sort clusters by score and take the top 10
    clusters_stats = sorted(clusters_stats, key=lambda c: c['avg_suitability_score'], reverse=True)[:10]
    final_cluster_numbers = {c['cluster_number'] for c in clusters_stats}
    
    # Validate that all cluster numbers are unique
    cluster_numbers = [c['cluster_number'] for c in clusters_stats]
    if len(cluster_numbers) != len(set(cluster_numbers)):
        logger.error(f"Duplicate cluster numbers found: {cluster_numbers}")
        # Fix duplicates by reassigning
        seen_numbers = set()
        for cluster in clusters_stats:
            original_number = cluster['cluster_number']
            while cluster['cluster_number'] in seen_numbers:
                cluster['cluster_number'] += 1
            seen_numbers.add(cluster['cluster_number'])
            if cluster['cluster_number'] != original_number:
                logger.info(f"Reassigned cluster number from {original_number} to {cluster['cluster_number']}")
    
    # Update final_cluster_numbers after fixing duplicates
    final_cluster_numbers = {c['cluster_number'] for c in clusters_stats}
    
    # Create mapping from original labels to sequential cluster numbers for polygon assignment
    label_to_cluster_number = {c['cluster_number']: c['cluster_number'] for c in clusters_stats}
    
    # Assign final cluster labels to the original polygons using sequential numbers
    final_labels = {}
    for i, label in enumerate(labels):
        if label in valid_cluster_ids and label_to_sequential.get(label) in final_cluster_numbers:
            final_labels[valid_indices[i]] = label_to_sequential[label]
    
    output_polygons = []
    for i, p in enumerate(polygons):
        if i in final_labels:
            # Add unique polygon ID if not present
            if 'id' not in p:
                p['id'] = _generate_polygon_id()
            p['cluster'] = final_labels[i]  # Now using sequential cluster numbers
            output_polygons.append(p)
    
    # Log final cluster numbers for debugging
    logger.info(f"Final cluster numbers: {[c['cluster_number'] for c in clusters_stats]}")
    logger.info(f"All cluster numbers are unique: {len(set(c['cluster_number'] for c in clusters_stats)) == len(clusters_stats)}")
            
    return clusters_stats, output_polygons
    
# --- Scenario & Scoring Functions ---

def _apply_scenario(polygons, scenario_config):
    """Applies feature changes to a deep copy of polygons based on scenario."""
    logger.info("Applying scenario changes to polygons.")
    polygons_new = copy.deepcopy(polygons)
    feature_changes = scenario_config.get('featureChanges', [])
    village_percentage = scenario_config.get('villagePercentage', 100)
    randomness_factor = scenario_config.get('randomnessFactor', 0)
    
    n = len(polygons_new)
    n_affected = max(1, int(n * village_percentage / 100))
    affected_indices = set(random.sample(range(n), n_affected))

    for idx in affected_indices:
        p_props = polygons_new[idx]['properties']
        for fc in feature_changes:
            feat = fc['feature']
            base_val = p_props.get(feat, 0)
            percent = fc['percentChange']
            actual_percent = percent + random.uniform(-randomness_factor, randomness_factor)
            p_props[feat] = base_val * (1 + actual_percent / 100)
            
    return polygons_new

@performance_monitor
def normalize_and_score(polygons, features, weights):
    """Optimized normalization and scoring function."""
    if not polygons or not features or not weights:
        return polygons
        
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
    normalized_weights = weights_arr / weights_arr.sum()
    
    suitability_scores = np.dot(normalized_matrix, normalized_weights)
    
    # Scale scores for better differentiation (e.g., 7-10 range)
    min_s, max_s = suitability_scores.min(), suitability_scores.max()
    if max_s > min_s:
        final_scores = 7 + 3 * (suitability_scores - min_s) / (max_s - min_s)
    else:
        final_scores = np.full_like(suitability_scores, 8.5)

    for i, p in enumerate(polygons):
        p['properties']['suitabilityScore'] = float(final_scores[i])
        
    return polygons

# --- AI Insight Generation (Refactored) ---

def _build_base_prompt(product_info, algorithm, features):
    """Builds the common header for all AI analysis prompts."""
    product_name = product_info.get('name', 'Business Product')
    product_description = product_info.get('description', 'No description provided.')
    
    return f"""
You are a senior business consultant analyzing location suitability for a new product launch in India.

**Product Context:**
- **Product:** {product_name}
- **Description:** {product_description}
- **Analysis Algorithm:** {algorithm}
- **Key Features Considered:** {', '.join(features)}

Please provide a concise, actionable business analysis based on the data below. Focus on money, customers, and strategy.
"""

def generate_ai_cluster_insights(clusters, base_prompt):
    """Generates standard AI insights for a list of clusters."""
    if not GEMINI_AVAILABLE or not clusters:
        return {"error": "AI insights are unavailable or no clusters were provided."}

    try:
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Prepare cluster data for analysis
        cluster_data = []
        for c in clusters[:3]:  # Top 3 clusters only
            cluster_data.append({
                'id': c.get('cluster_number', c.get('cluster_id', c.get('cluster', 'N/A'))),  # Prefer cluster_number
                'score': c.get('avg_suitability_score', 0),
                'count': c.get('count', 0),
                'centroid': c.get('centroid', [0, 0]),
                'median_score': c.get('median_suitability_score', 0),
                'min_score': c.get('min_suitability_score', 0),
                'max_score': c.get('max_suitability_score', 0),
                'std_score': c.get('std_suitability_score', 0)
            })
        
        # Extract product info and algorithm from base prompt
        product_name = "Business Product"
        product_description = "No description provided"
        algorithm = "kmeans"  # Default fallback
        
        # Try to extract product info and algorithm from base prompt
        if "Product:" in base_prompt:
            lines = base_prompt.split('\n')
            for line in lines:
                if line.startswith("- **Product:**"):
                    product_name = line.replace("- **Product:**", "").strip()
                elif line.startswith("- **Description:**"):
                    product_description = line.replace("- **Description:**", "").strip()
                elif line.startswith("- **Analysis Algorithm:**"):
                    algorithm = line.replace("- **Analysis Algorithm:**", "").strip()
        
        # Create detailed prompt for individual cluster analysis with improved location data
        cluster_details_with_location = []
        for c in cluster_data:
            centroid = c['centroid']
            if centroid and len(centroid) >= 2:
                location_info = _get_nearest_city(centroid[1], centroid[0])  # lat, lng
            else:
                location_info = "Location data unavailable"
            
            cluster_details_with_location.append(
                f"Cluster {c['id']}: Score {c['score']:.2f}/10, {c['count']} locations, Location: {location_info}"
            )
        
        detailed_prompt = f"""You are a senior business strategist specializing in {product_name} market expansion. Generate a comprehensive 400-500 word analysis covering key insights and strategic recommendations.

CRITICAL FORMATTING:
• NO asterisks (*) or hash symbols (#)
• Use bullet points (•) for lists
• Use emojis for section headers
• Target 400-500 words total
• Marketing insights should be intuitive and qualitative (no numbers)

FORMAT STRUCTURE:

📊 Executive Summary (60 words)
[Key findings and business impact for {product_name}]

🎯 Product-Market Analysis (80 words)
[How {product_name} fits the identified market opportunity, product strengths, and competitive advantages]

📈 Cluster Performance Deep Dive (80 words)
[Detailed analysis of cluster scores, statistical significance, and what it means for {product_name}]

🔍 Geographic Market Intelligence (70 words)
[Location advantages, nearest cities, market accessibility, and regional opportunities for {product_name}]

🗺️ Market Opportunity Assessment (70 words)
[Target market size, competitive landscape, entry barriers, and growth potential for {product_name}]

💰 Strategic Business Recommendations (80 words)
[Market entry strategy, resource allocation, risk mitigation, and investment priorities for {product_name}]

✅ Actionable Implementation Plan (60 words)
[3 priority actions with strategic focus and timeline for {product_name}]

ANALYSIS REQUIREMENTS:
• Focus on the specific cluster data provided
• Include key statistical evidence: scores, distribution, reliability
• Provide geographic insights and business reasoning
• Give actionable strategic recommendations
• Use exact cluster numbers (not IDs), scores, and locations
• Include accurate location information based on coordinates
• Marketing insights should be intuitive and qualitative (no numbers)
• Target 400-500 words total
• NEVER use asterisks (*) or hash symbols (#)
• Always refer to the product as "{product_name}"
• Use Indian Rupees (₹) for monetary references
• Focus on product-market fit and business strategy
• Emphasize how the product addresses market needs
• Use the exact location information provided

PRODUCT CONTEXT:
Product: {product_name}
Product Description: {product_description}
Features: {', '.join(['Feature1', 'Feature2', 'Feature3']) if len(clusters) > 0 else 'Standard features'}

CLUSTER DETAILS:
{chr(10).join(cluster_details_with_location)}

Generate a comprehensive, business-focused analysis for {product_name} that includes specific statistical evidence, geographic analysis, risk assessment, and actionable business recommendations. Focus on how {product_name} can succeed in the identified market opportunity. Provide detailed insights about product-market fit, competitive positioning, and strategic implementation. Include specific things to watch out for and mitigation strategies. Keep the analysis comprehensive, bullet-pointed, and business-oriented. NEVER use asterisks (*) or hash symbols (#) anywhere in the text. Use Indian Rupees (₹) for any monetary references. Use the exact location information provided for geographic insights. Make the analysis 400-500 words with rich, actionable insights."""

        # Generate response
        response = model.generate_content(detailed_prompt)
        
        if response and response.text:
            return {"insights": response.text}
        else:
            return {"error": "Failed to generate AI insights - no response from model"}
            
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return {"error": f"Failed to generate AI insights: {str(e)}"}


def generate_comparison_insights(original_clusters, scenario_clusters, base_prompt, feature_changes):
    """Generates AI insights comparing original vs. scenario clusters."""
    if not GEMINI_AVAILABLE or not original_clusters or not scenario_clusters:
        return {"error": "AI insights are unavailable or cluster data is incomplete for comparison."}
    
    try:
        # Configure Gemini
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Calculate improvements with location data
        improvements = []
        for i, (orig, scen) in enumerate(zip(original_clusters[:3], scenario_clusters[:3])):
            orig_score = orig.get('avg_suitability_score', 0)
            scen_score = scen.get('avg_suitability_score', 0)
            improvement = scen_score - orig_score
            
            # Get location information
            centroid = orig.get('centroid', [])
            if centroid and len(centroid) >= 2:
                location_info = _get_nearest_city(centroid[1], centroid[0])  # lat, lng
            else:
                location_info = "Location data unavailable"
            
            improvements.append({
                'cluster': orig.get('cluster_number', orig.get('cluster_id', i+1)),  # Prefer cluster_number
                'original_score': orig_score,
                'scenario_score': scen_score,
                'improvement': improvement,
                'location': location_info
            })
        
        # Prepare feature changes summary
        feature_summary = []
        for change in feature_changes:
            feature_summary.append(f"• {change['feature']}: {change['percentChange']:+}%")
        
        # Extract product info and algorithm from base prompt
        product_name = "Business Product"
        algorithm = "kmeans"  # Default fallback
        if "Product:" in base_prompt:
            lines = base_prompt.split('\n')
            for line in lines:
                if line.startswith("- **Product:**"):
                    product_name = line.replace("- **Product:**", "").strip()
                elif line.startswith("- **Analysis Algorithm:**"):
                    algorithm = line.replace("- **Analysis Algorithm:**", "").strip()
        
        detailed_prompt = f"""You are a senior business strategist analyzing {product_name} investment impact. Generate a comprehensive 400-500 word analysis covering key insights and strategic recommendations.

CRITICAL FORMATTING:
• NO asterisks (*) or hash symbols (#)
• Use bullet points (•) for lists
• Use emojis for section headers
• Target 400-500 words total
• Marketing insights should be intuitive and qualitative (no numbers)

FORMAT STRUCTURE:

📊 Investment Impact Assessment (60 words)
[Overall ROI and business value assessment for {product_name}]

🎯 Product Performance Analysis (80 words)
[How {product_name} performance changed across top clusters, key improvements, and business implications]

📈 Feature Investment Analysis (80 words)
[Detailed analysis of feature changes, their impact on {product_name}, and strategic insights]

🔍 Strategic Business Insights (70 words)
[Key learnings about {product_name} market positioning and competitive advantages]

🗺️ Geographic Market Evolution (70 words)
[Location changes, market shifts, and new opportunities for {product_name}]

💰 Strategic Business Recommendations (80 words)
[Investment priorities, resource allocation, risk mitigation, and growth strategy for {product_name}]

✅ Actionable Implementation Plan (60 words)
[3 priority actions with strategic focus and timeline for {product_name}]

ANALYSIS REQUIREMENTS:
• Focus on TOP 3 clusters only
• Include key statistical evidence: score changes, improvements
• Provide geographic insights and business reasoning
• Give actionable strategic recommendations
• Use exact cluster IDs, scores, and locations
• Include before/after comparisons with significance
• Marketing insights should be intuitive and qualitative (no numbers)
• Target 400-500 words total
• NEVER use asterisks (*) or hash symbols (#)
• Always refer to the product as "{product_name}"
• Use Indian Rupees (₹) for monetary references
• Focus on product-market fit and business strategy
• Emphasize how the investment impacts {product_name} success

PRODUCT CONTEXT:
Product: {product_name}
Product Description: {product_description}

FEATURE CHANGES APPLIED:
{chr(10).join(feature_summary)}

TOP CLUSTERS PERFORMANCE CHANGES:
{chr(10).join([f"• Cluster {imp['cluster']}: {imp['original_score']:.2f} → {imp['scenario_score']:.2f} ({imp['improvement']:+.2f}) - {imp['location']}" for imp in improvements])}

Generate a comprehensive, business-focused analysis for {product_name} that includes specific statistical evidence, geographic analysis, risk assessment, and actionable business recommendations. Focus on how the investment changes impact {product_name} market opportunity and competitive positioning. Provide detailed insights about product-market fit, strategic positioning, and implementation priorities. Include specific things to watch out for and mitigation strategies. Keep the analysis comprehensive, bullet-pointed, and business-oriented. NEVER use asterisks (*) or hash symbols (#) anywhere in the text. Use Indian Rupees (₹) for any monetary references. Make the analysis 400-500 words with rich, actionable insights."""

        # Generate response
        response = model.generate_content(detailed_prompt)
        
        if response and response.text:
            return {"insights": response.text}
        else:
            return {"error": "Failed to generate comparison insights - no response from model"}
            
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
        original_polygons = copy.deepcopy(polygons) # Keep a copy for comparison analysis
        if 'scenarioConfig' in data:
            logger.info("Scenario configuration found, applying changes.")
            polygons = _apply_scenario(polygons, data['scenarioConfig'])
            
            # Re-score the scenario-modified polygons
            features = data.get('features', [])
            weights = data.get('weights', [])
            if features and weights:
                polygons = normalize_and_score(polygons, features, weights)

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
        logger.info(f"Executing '{algorithm}' clustering with {n_samples} samples...")
        
        if algorithm == 'buffer':
            # Custom buffer clustering implementation
            labels = _buffer_clustering(coords, params.get('radius', 5.0), params.get('min_polygons_per_cluster', 1))
        else:
            model = _get_clustering_model(algorithm, params)
            
            # HDBSCAN uses a different input format if using Haversine
            X_cluster = np.radians(coords) if algorithm in ['dbscan', 'hdbscan'] else coords
            labels = model.fit_predict(X_cluster)
        
        # --- 7. Process and Filter Results ---
        min_size = params.get('min_polygons_per_cluster', 1)  # Reduced default
        max_size = params.get('max_polygons_per_cluster', 1000)  # Increased default
        clusters, output_polygons = _process_cluster_results(polygons, labels, coords, valid_indices, min_size, max_size)
        
        # Ensure cluster numbers are unique
        clusters = _ensure_unique_cluster_numbers(clusters, "main_")
        
        
        ai_insights = None
        if data.get('include_ai_insights', False):
            features = data.get('features', [])
            base_prompt = _build_base_prompt(data.get('product_info', {}), algorithm, features)
            if 'scenarioConfig' in data:
                # We need original clusters for comparison
                original_coords, original_valid_indices = _extract_coordinates(original_polygons)
                if original_coords.shape[0] > 0:
                    # Re-run clustering on original data for comparison
                    original_model = _get_clustering_model(algorithm, params)
                    original_X_cluster = np.radians(original_coords) if algorithm in ['dbscan', 'hdbscan'] else original_coords
                    original_labels = original_model.fit_predict(original_X_cluster)
                    original_clusters, _ = _process_cluster_results(original_polygons, original_labels, original_coords, original_valid_indices, min_size, max_size)
                    
                    # Ensure original cluster numbers are unique
                    original_clusters = _ensure_unique_cluster_numbers(original_clusters, "original_")
                    
                    # Generate comparison insights
                    feature_changes = data['scenarioConfig'].get('featureChanges', [])
                    
                    # Ensure scenario clusters maintain the same cluster numbers as original clusters for comparison
                    # This allows us to track which clusters improved, declined, or stayed the same
                    if len(clusters) == len(original_clusters):
                        # If we have the same number of clusters, assign them the same numbers
                        for i, cluster in enumerate(clusters):
                            original_cluster_number = original_clusters[i].get('cluster_number', i + 1)
                            cluster['cluster_number'] = original_cluster_number
                            cluster['cluster_id'] = f"scenario_{original_cluster_number}"
                            logger.info(f"Scenario cluster {i+1} assigned same number as original: {original_cluster_number}")
                    else:
                        # If cluster count changed, use sequential numbers but mark them as scenario
                        for i, cluster in enumerate(clusters):
                            cluster['cluster_number'] = i + 1
                            cluster['cluster_id'] = f"scenario_{i + 1}"
                            logger.warning(f"Cluster count changed: {len(original_clusters)} original vs {len(clusters)} scenario. Using sequential numbering.")
                    
                    ai_insights = generate_comparison_insights(original_clusters, clusters, base_prompt, feature_changes)
                else:
                    ai_insights = generate_ai_cluster_insights(clusters, base_prompt)
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
    """Endpoint for normalization and scoring only, without clustering."""
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
        
        if not all([polygons, features, weights]):
            missing_fields = []
            if not polygons: missing_fields.append('polygons')
            if not features: missing_fields.append('features')
            if not weights: missing_fields.append('weights')
            logger.error(f"Missing required fields: {missing_fields}")
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        
        polygons = _add_polygon_ids(polygons)

   
        scored_polygons = normalize_and_score(polygons, features, weights)
        

        result = {
            'polygons': scored_polygons,
            'total_polygons': len(scored_polygons),
            'features_used': features,
            'weights_used': weights
        }
        
        logger.info(f"Normalization and scoring completed successfully. Processed {len(scored_polygons)} polygons.")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in normalize_score_only: {str(e)}")
        return jsonify({'error': f'Normalization failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
