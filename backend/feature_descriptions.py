"""
Feature Descriptions for Mission Antyodaya Village Facilities (2020)
Comprehensive descriptions for all features used in suitability analysis
"""

FEATURE_DESCRIPTIONS = {
    # Basic Demographics
    "total_population": {
        "name": "Total Rural Population (2020)",
        "description": "Total population residing in the village as of 2020",
        "category": "Demographics",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Higher population indicates larger community and potential for economies of scale"
    },
    "male_population": {
        "name": "Total Rural Male Population (2020)",
        "description": "Total male population in the village",
        "category": "Demographics",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Male population contributes to workforce and economic activity"
    },
    "female_population": {
        "name": "Total Rural Female Population (2020)",
        "description": "Total female population in the village",
        "category": "Demographics",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Female population indicates gender balance and social development"
    },
    "total_hhd": {
        "name": "Total Household Count (2020)",
        "description": "Total number of households in the village",
        "category": "Demographics",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "More households indicate larger community and market potential"
    },

    # Agricultural Infrastructure
    "total_no_of_farmers": {
        "name": "Number of Farmers",
        "description": "Total number of farmers engaged in agricultural activities",
        "category": "Agriculture",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "More farmers indicate strong agricultural base and food security"
    },
    "net_sown_area_in_hac": {
        "name": "Net Sown Area (ha)",
        "description": "Total area under cultivation in hectares",
        "category": "Agriculture",
        "unit": "Hectares",
        "positive_impact": True,
        "explanation": "Larger cultivated area indicates agricultural productivity potential"
    },
    "total_cultivable_area_in_hac": {
        "name": "Total Cultivable Area (ha)",
        "description": "Total area available for cultivation in hectares",
        "category": "Agriculture",
        "unit": "Hectares",
        "positive_impact": True,
        "explanation": "More cultivable land provides opportunities for agricultural expansion"
    },
    "area_irrigated_in_hac": {
        "name": "Total Irrigated Area (ha)",
        "description": "Area under irrigation in hectares",
        "category": "Agriculture",
        "unit": "Hectares",
        "positive_impact": True,
        "explanation": "Irrigated area ensures consistent crop production and reduces dependency on rainfall"
    },

    # Financial Infrastructure
    "is_bank_available": {
        "name": "Bank Availability",
        "description": "Presence of a bank branch in the village",
        "category": "Financial",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Bank presence enables financial inclusion and access to credit"
    },
    "is_atm_available": {
        "name": "ATM Availability",
        "description": "Presence of ATM facility in the village",
        "category": "Financial",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "ATM provides convenient access to banking services"
    },
    "total_hhd_availing_pmuy_benefits": {
        "name": "PMUY Beneficiary Households",
        "description": "Number of households availing Pradhan Mantri Ujjwala Yojana benefits",
        "category": "Financial",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "PMUY benefits indicate access to clean cooking fuel and financial inclusion"
    },

    # Infrastructure & Connectivity
    "is_village_connected_to_all_weat": {
        "name": "All-Weather Road Connectivity",
        "description": "Village connected by all-weather road",
        "category": "Infrastructure",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "All-weather roads ensure year-round connectivity and access to markets"
    },
    "internal_pucca_road": {
        "name": "Internal Pucca Road Coverage",
        "description": "Village fully covered by internal pucca roads",
        "category": "Infrastructure",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Internal pucca roads improve local connectivity and reduce travel time"
    },
    "public_transport": {
        "name": "Public Transportation",
        "description": "Availability of public transportation services",
        "category": "Infrastructure",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Public transport improves mobility and access to employment opportunities"
    },

    # Health & Sanitation
    "total_hhd_not_having_sanitary_la": {
        "name": "Households Without Sanitary Latrines",
        "description": "Number of households without sanitary latrine facilities",
        "category": "Health & Sanitation",
        "unit": "Count",
        "positive_impact": False,
        "explanation": "Lower numbers indicate better sanitation and public health"
    },
    "total_hhd_having_piped_water_con": {
        "name": "Households with Piped Water",
        "description": "Number of households with piped water connection",
        "category": "Health & Sanitation",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Piped water ensures safe drinking water and reduces water-borne diseases"
    },
    "phc": {
        "name": "Primary Health Centre",
        "description": "Presence of Primary Health Centre in the village",
        "category": "Health & Sanitation",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "PHC provides essential healthcare services to the community"
    },
    "sub_centre": {
        "name": "Health Sub-Centre",
        "description": "Presence of health sub-centre in the village",
        "category": "Health & Sanitation",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Sub-centres provide basic healthcare and maternal-child services"
    },

    # Education
    "availability_of_primary_school": {
        "name": "Primary School Availability",
        "description": "Presence of primary school in the village",
        "category": "Education",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Primary schools ensure basic education access for children"
    },
    "availability_of_middle_school": {
        "name": "Middle School Availability",
        "description": "Presence of middle school in the village",
        "category": "Education",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Middle schools provide continued education opportunities"
    },
    "availability_of_high_school": {
        "name": "High School Availability",
        "description": "Presence of high school in the village",
        "category": "Education",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "High schools enable higher secondary education completion"
    },
    "availability_of_ssc_school": {
        "name": "Senior Secondary School",
        "description": "Presence of higher/senior secondary school",
        "category": "Education",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Senior secondary schools provide complete school education"
    },

    # Economic Activities
    "mandi": {
        "name": "Agricultural Market (Mandi)",
        "description": "Presence of agricultural market in the village",
        "category": "Economic",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Mandi provides direct market access for agricultural produce"
    },
    "regular_market": {
        "name": "Regular Market",
        "description": "Presence of regular market in the village",
        "category": "Economic",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Regular markets support local commerce and trade"
    },
    "weekly_haat": {
        "name": "Weekly Haat",
        "description": "Availability of weekly haat (market)",
        "category": "Economic",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Weekly haats provide periodic market access for goods and services"
    },

    # Technology & Communication
    "is_broadband_available": {
        "name": "Broadband/Internet Facility",
        "description": "Availability of internet/broadband facility",
        "category": "Technology",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Internet connectivity enables digital access and e-governance"
    },
    "telephone_services": {
        "name": "Telephone Services",
        "description": "Availability of telephone services",
        "category": "Technology",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Telephone services improve communication and connectivity"
    },
    "csc": {
        "name": "Common Service Centre (CSC)",
        "description": "Presence of Common Service Centre for digital services",
        "category": "Technology",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "CSC provides access to government services and digital literacy"
    },

    # Social Development
    "total_shg": {
        "name": "Self Help Groups (SHGs)",
        "description": "Number of Self Help Groups in the village",
        "category": "Social Development",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "SHGs promote women empowerment and financial inclusion"
    },
    "total_hhd_mobilized_into_shg": {
        "name": "Households in SHGs",
        "description": "Number of households mobilized into SHGs",
        "category": "Social Development",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Higher participation indicates community mobilization and empowerment"
    },
    "availability_of_panchayat_bhawan": {
        "name": "Panchayat Bhawan",
        "description": "Presence of panchayat bhawans",
        "category": "Social Development",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Panchayat bhawans provide local governance infrastructure"
    },

    # Energy & Utilities
    "no_electricity": {
        "name": "No Electricity",
        "description": "Village has no electricity supply",
        "category": "Energy",
        "unit": "Binary (Yes/No)",
        "positive_impact": False,
        "explanation": "Lower values indicate better electrification and development"
    },
    "total_hhd_with_clean_energy": {
        "name": "Households Using Clean Energy",
        "description": "Number of households using clean energy (LPG/biogas)",
        "category": "Energy",
        "unit": "Count",
        "positive_impact": True,
        "explanation": "Clean energy reduces indoor air pollution and improves health"
    },
    "availability_of_solor_wind_energ": {
        "name": "Solar/Wind Energy",
        "description": "Availability of solar/wind electricity",
        "category": "Energy",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Renewable energy sources provide sustainable power solutions"
    },

    # Water & Irrigation
    "piped_water_fully_covered": {
        "name": "Fully Covered Piped Water",
        "description": "Piped tap water available in every habitation",
        "category": "Water",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Universal piped water coverage ensures safe drinking water for all"
    },
    "canal": {
        "name": "Canal Irrigation",
        "description": "Use of canal irrigation",
        "category": "Water",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Canal irrigation provides reliable water supply for agriculture"
    },
    "ground_water": {
        "name": "Ground Water Irrigation",
        "description": "Use of ground water irrigation",
        "category": "Water",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Ground water irrigation supports agricultural activities"
    },

    # Specialized Services
    "is_fertilizer_shop_available": {
        "name": "Fertilizer Shop",
        "description": "Presence of fertilizer shop in the village",
        "category": "Agriculture Services",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Fertilizer shops provide easy access to agricultural inputs"
    },
    "is_soil_testing_centre_available": {
        "name": "Soil Testing Centre",
        "description": "Presence of soil testing centre",
        "category": "Agriculture Services",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Soil testing helps farmers optimize fertilizer use and improve productivity"
    },
    "is_veterinary_hospital_available": {
        "name": "Veterinary Hospital",
        "description": "Presence of veterinary clinic or hospital",
        "category": "Animal Health",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Veterinary services support livestock health and dairy farming"
    },
    "is_post_office_available": {
        "name": "Post Office",
        "description": "Presence of post office/sub-post office",
        "category": "Communication",
        "unit": "Binary (Yes/No)",
        "positive_impact": True,
        "explanation": "Post offices provide communication and financial services"
    }
}

# Feature categories for grouping
FEATURE_CATEGORIES = {
    "Demographics": ["total_population", "male_population", "female_population", "total_hhd"],
    "Agriculture": ["total_no_of_farmers", "net_sown_area_in_hac", "total_cultivable_area_in_hac", "area_irrigated_in_hac"],
    "Financial": ["is_bank_available", "is_atm_available", "total_hhd_availing_pmuy_benefits"],
    "Infrastructure": ["is_village_connected_to_all_weat", "internal_pucca_road", "public_transport"],
    "Health & Sanitation": ["total_hhd_not_having_sanitary_la", "total_hhd_having_piped_water_con", "phc", "sub_centre"],
    "Education": ["availability_of_primary_school", "availability_of_middle_school", "availability_of_high_school", "availability_of_ssc_school"],
    "Economic": ["mandi", "regular_market", "weekly_haat"],
    "Technology": ["is_broadband_available", "telephone_services", "csc"],
    "Social Development": ["total_shg", "total_hhd_mobilized_into_shg", "availability_of_panchayat_bhawan"],
    "Energy": ["no_electricity", "total_hhd_with_clean_energy", "availability_of_solor_wind_energ"],
    "Water": ["piped_water_fully_covered", "canal", "ground_water"],
    "Agriculture Services": ["is_fertilizer_shop_available", "is_soil_testing_centre_available"],
    "Animal Health": ["is_veterinary_hospital_available"],
    "Communication": ["is_post_office_available"]
}

def get_feature_description(feature_name):
    """Get description for a specific feature"""
    return FEATURE_DESCRIPTIONS.get(feature_name, {
        "name": feature_name,
        "description": "Feature description not available",
        "category": "Other",
        "unit": "Unknown",
        "positive_impact": True,
        "explanation": "Impact assessment not available"
    })

def get_features_by_category(category):
    """Get all features in a specific category"""
    return FEATURE_CATEGORIES.get(category, [])

def get_all_categories():
    """Get all available feature categories"""
    return list(FEATURE_CATEGORIES.keys())

def get_feature_suggestions():
    """Get suggested features for different analysis types"""
    return {
        "Basic Development": [
            "total_population", "total_hhd", "is_village_connected_to_all_weat",
            "total_hhd_having_piped_water_con", "availability_of_primary_school"
        ],
        "Agricultural Focus": [
            "total_no_of_farmers", "net_sown_area_in_hac", "area_irrigated_in_hac",
            "mandi", "is_fertilizer_shop_available"
        ],
        "Health & Sanitation": [
            "total_hhd_not_having_sanitary_la", "total_hhd_having_piped_water_con",
            "phc", "sub_centre"
        ],
        "Financial Inclusion": [
            "is_bank_available", "is_atm_available", "total_hhd_availing_pmuy_benefits",
            "total_shg", "csc"
        ],
        "Education & Skills": [
            "availability_of_primary_school", "availability_of_high_school",
            "availability_of_ssc_school", "csc"
        ]
    } 