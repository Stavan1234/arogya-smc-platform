#!/usr/bin/env python3
"""
Generate seed SQL for the health database using the provided GeoJSON file and mock data.
Coordinates for ASHA reports are generated inside ward polygons using PostGIS ST_GeneratePoints.
Inventory stock levels are set to trigger low/critical alerts for the dashboard.
"""

import json
import random
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# -------------------- Configuration --------------------
DEFAULT_GEOJSON = "public/data/wards.geojson"
DEFAULT_OUTPUT = "seed_data.sql"
NUM_USERS = 26
NUM_DAYS_REPORTS = 31
NUM_ALERTS = 100
NUM_ADVISORIES = 50
# ------------------------------------------------------

random.seed(42)

def parse_geojson(geojson_path):
    """Read the GeoJSON file and return list of features."""
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['features']

def escape_sql_string(s):
    """Escape single quotes and other problematic characters for SQL."""
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

def format_geojson_geometry(geometry):
    """Convert GeoJSON geometry dict to a compact JSON string for ST_GeomFromGeoJSON."""
    return json.dumps(geometry, separators=(',', ':'))

def generate_ward_inserts(features):
    """Generate INSERT statements for wards table."""
    inserts = []
    for feat in features:
        props = feat['properties']
        ward_no = props['ward_no']
        code = f"W{ward_no.zfill(2)}"
        ward_name = props.get('ward_name') or props.get('landmark') or f"Ward {ward_no}"
        total_pop = int(props['tot_pop']) if props['tot_pop'] else 5000
        target = max(5, total_pop // 2000)
        geom = feat['geometry']
        geom_json = format_geojson_geometry(geom)
        boundary_json = json.dumps(feat)
        inserts.append(
            f"('{code}', {escape_sql_string(ward_name)}, {total_pop}, {target}, "
            f"ST_GeomFromGeoJSON({escape_sql_string(geom_json)}), "
            f"{escape_sql_string(boundary_json)}::jsonb)"
        )
    return inserts

def generate_users(wards):
    """Generate ASHA workers for each ward and an admin."""
    inserts = []
    # ASHA workers
    for i, ward in enumerate(wards, 1):
        code = ward['code']
        name = f"ASHA Worker {i}"
        pwd = f"$2a$10$dummyhashfor{code.lower()}"
        last_sync = datetime.now() - timedelta(days=random.randint(0, 3))
        reports_submitted = random.randint(20, 70)
        inserts.append(
            f"('asha_{code}', '{pwd}', 'ASHA', '{code}', {escape_sql_string(name)}, "
            f"'{last_sync.isoformat()}', {reports_submitted})"
        )
    # Admin
    inserts.append(
        "('admin', '$2a$10$dummyadminhash', 'ADMIN', NULL, 'Dr. Ashok Kulkarni', "
        f"'{datetime.now().isoformat()}', 0)"
    )
    return inserts

def generate_facilities(wards):
    """Generate one facility per ward with realistic doctor rosters using SQL JSON builders."""
    inserts = []
    types = ['GOVERNMENT', 'PRIVATE']
    facility_types = ['PHC', 'CHC', 'Urban Health Center', 'District Hospital']
    
    # Pre-defined doctor lists for different facility types
    doctor_rosters = {
        'PHC': [
            {'name': 'Dr. Sunil Patil', 'specialization': 'General Physician', 'timings': '09:00-17:00'},
            {'name': 'Dr. Meena Jadhav', 'specialization': 'Community Medicine', 'timings': '10:00-16:00'}
        ],
        'CHC': [
            {'name': 'Dr. Anand Deshmukh', 'specialization': 'General Medicine', 'timings': '09:00-17:00'},
            {'name': 'Dr. Priya Kulkarni', 'specialization': 'Pediatrics', 'timings': '10:00-18:00'},
            {'name': 'Dr. Rajesh Shinde', 'specialization': 'Emergency Medicine', 'timings': '24/7'}
        ],
        'Urban Health Center': [
            {'name': 'Dr. Sanjay More', 'specialization': 'General Physician', 'timings': '08:00-14:00'},
            {'name': 'Dr. Asha Pawar', 'specialization': 'Obstetrics', 'timings': '09:00-17:00'}
        ],
        'District Hospital': [
            {'name': 'Dr. Ashok Kulkarni', 'specialization': 'Chief Medical Officer', 'timings': '09:00-17:00'},
            {'name': 'Dr. Anjali Deshmukh', 'specialization': 'Senior Physician', 'timings': '10:00-18:00'},
            {'name': 'Dr. Vijay Patil', 'specialization': 'Surgeon', 'timings': '10:00-16:00'},
            {'name': 'Dr. Smita Joshi', 'specialization': 'Pediatrician', 'timings': '09:00-17:00'},
            {'name': 'Dr. Ramesh Kamble', 'specialization': 'Orthopedics', 'timings': '11:00-19:00'}
        ]
    }
    
    # Specialty options as SQL JSONB arrays
    specialty_options = {
        'PHC': "jsonb_build_array('General Medicine', 'Vaccination')",
        'CHC': "jsonb_build_array('General Medicine', 'Pediatrics', 'Emergency')",
        'Urban Health Center': "jsonb_build_array('General Medicine', 'Gynecology')",
        'District Hospital': "jsonb_build_array('General Medicine', 'Pediatrics', 'Surgery', 'Orthopedics', 'Cardiology')"
    }
    
    for i, ward in enumerate(wards, 1):
        code = ward['code']
        # Vary facility type by ward to make it realistic
        if i % 5 == 0:
            ftype = 'District Hospital'
        elif i % 3 == 0:
            ftype = 'CHC'
        elif i % 2 == 0:
            ftype = 'Urban Health Center'
        else:
            ftype = 'PHC'
        
        name = f"{ward['name']} {ftype}"
        lat = 17.6 + random.random() * 0.5
        lng = 75.8 + random.random() * 0.4
        contact = f"0217-{random.randint(100000, 999999)}"
        typ = random.choice(types)
        address = f"{ward['name']} Area, Solapur"
        
        # Get specialty SQL and doctors based on facility type
        specialty_sql = specialty_options.get(ftype, specialty_options['PHC'])
        doctors = doctor_rosters.get(ftype, doctor_rosters['PHC'])
        
        # Add some variation: sometimes add extra doctors
        if random.random() < 0.3 and ftype != 'PHC':
            extra_doctor = {
                'name': f'Dr. {random.choice(["Vikas", "Sonal", "Rohit", "Neha"])} {random.choice(["Patil", "Shinde", "Joshi", "Kulkarni"])}',
                'specialization': random.choice(['Dermatology', 'ENT', 'Ophthalmology', 'Psychiatry']),
                'timings': random.choice(['09:00-13:00', '14:00-18:00', 'By Appointment'])
            }
            doctors = doctors + [extra_doctor]
        
        # Build SQL for doctors JSONB array
        doctor_items = []
        for doc in doctors:
            doc_json = f"jsonb_build_object('name', '{escape_sql_string(doc['name'])}', 'specialization', '{escape_sql_string(doc['specialization'])}', 'timings', '{escape_sql_string(doc['timings'])}')"
            doctor_items.append(doc_json)
        doctors_sql = f"jsonb_build_array({', '.join(doctor_items)})"
        
        inserts.append(
            f"({escape_sql_string(name)}, '{code}', {lat:.6f}, {lng:.6f}, "
            f"{escape_sql_string(contact)}, '{typ}', 'STABLE', '{ftype}', "
            f"{escape_sql_string(address)}, {specialty_sql}, {doctors_sql})"
        )
    return inserts

def generate_capacity_reports(facilities_list, num_days=30):
    """Generate capacity reports for each facility for the last num_days days."""
    inserts = []
    start_date = datetime.now().date() - timedelta(days=num_days)
    for fac in facilities_list:
        fac_id = fac['id']
        for i in range(num_days):
            report_date = start_date + timedelta(days=i)
            beds_total = random.randint(50, 200)
            beds_available = random.randint(10, beds_total - 10)
            icu_total = random.randint(5, 30)
            icu_available = random.randint(1, icu_total)
            vent_total = random.randint(0, 15)
            vent_available = random.randint(0, vent_total)
            oxygen = random.choice([True, False])
            disease_counts = json.dumps({
                "fever": random.randint(0, 30),
                "cough": random.randint(0, 20),
                "diarrhea": random.randint(0, 15)
            })
            inserts.append(
                f"({fac_id}, '{report_date}', {beds_total}, {beds_available}, {icu_total}, "
                f"{icu_available}, {vent_total}, {vent_available}, {oxygen}, "
                f"'{disease_counts}'::jsonb, '{datetime.now().isoformat()}')"
            )
    return inserts

def generate_facility_inventory(facilities_list):
    """Generate inventory for each facility and each resource type, with some critical/low stocks."""
    resources = ['Antipyretic', 'Cough Syrup', 'ORS', 'RDT Kit']
    inserts = []
    for fac in facilities_list:
        fac_id = fac['id']
        # Force some facilities to have critical/low stock
        is_critical = fac_id % 3 == 1   # every 3rd facility
        is_low = fac_id % 3 == 2        # every 3rd facility (alternating)
        for res in resources:
            if is_critical:
                current = random.randint(0, 30)   # critical
                threshold = 100
            elif is_low:
                current = random.randint(40, 80)  # low
                threshold = 100
            else:
                current = random.randint(200, 600) # healthy
                threshold = 100
            last_updated = datetime.now() - timedelta(days=random.randint(0, 30))
            inserts.append(
                f"({fac_id}, '{res}', {current}, {threshold}, '{last_updated.isoformat()}')"
            )
    return inserts

def generate_asha_reports(users_list, wards, num_days=31):
    """Generate daily reports for each ASHA worker – coordinates are generated inside ward polygons."""
    inserts = []
    start_date = datetime.now().date() - timedelta(days=num_days-1)
    for user in users_list:
        ward_code = user['ward_code']
        # We'll use SQL to generate points inside the ward geometry
        # so we don't pre‑compute lat/lng here.
        for i in range(num_days):
            report_date = start_date + timedelta(days=i)
            # Outliers
            if random.random() < 0.05:
                fever = random.randint(50, 150)
                cough = random.randint(30, 100)
                diarrhea = random.randint(20, 80)
            else:
                fever = random.randint(0, 12)
                cough = random.randint(0, 10)
                diarrhea = random.randint(0, 8)
            jaundice = random.randint(0, 3)
            rash = random.randint(0, 2)
            maternal = None
            if random.random() > 0.7:
                maternal = json.dumps({"high_risk_pregnancies": random.randint(0, 3)})
            child = None
            if random.random() > 0.8:
                child = json.dumps({"malnourished": random.randint(0, 4)})
            env = None
            if random.random() > 0.9:
                env = json.dumps({"stagnant_water": random.choice([True, False])})
            disease = random.choices(['General Fever', 'Dengue', 'Malaria'], weights=[0.8, 0.1, 0.1])[0]
            form = random.choices(['S', 'P', 'L'], weights=[0.5, 0.3, 0.2])[0]
            inserts.append(
                f"({user['id']}, '{ward_code}', '{report_date}', {fever}, {cough}, {diarrhea}, "
                f"{jaundice}, {rash}, {maternal}::jsonb, {child}::jsonb, {env}::jsonb, "
                f"NULL, NULL, '{disease}', '{form}', '[]'::jsonb)"
            )
    return inserts

def generate_alerts(wards, num=100):
    """Generate random alerts."""
    inserts = []
    types = ['resource', 'outbreak', 'info']
    severities = ['low', 'medium', 'high', 'critical']
    statuses = ['active', 'acknowledged', 'resolved']
    for _ in range(num):
        typ = random.choice(types)
        sev = random.choice(severities)
        ward = None
        if random.random() < 0.7:
            ward = random.choice(wards)['code']
        title = f"Alert {random.randint(1, 1000)}"
        desc = "Automatically generated alert description"
        gen_at = datetime.now() - timedelta(days=random.randint(0, 30))
        ack_at = None
        if random.random() < 0.3:
            ack_at = gen_at + timedelta(days=random.randint(1, 10))
        res_at = None
        if random.random() < 0.2 and ack_at:
            res_at = ack_at + timedelta(days=random.randint(1, 5))
        status = random.choice(statuses)
        inserts.append(
            f"('{typ}', '{sev}', {escape_sql_string(ward)}, {escape_sql_string(title)}, "
            f"{escape_sql_string(desc)}, '{gen_at.isoformat()}', "
            f"{escape_sql_string(ack_at.isoformat()) if ack_at else 'NULL'}, "
            f"{escape_sql_string(res_at.isoformat()) if res_at else 'NULL'}, '{status}')"
        )
    return inserts

def generate_advisories(wards, num=50):
    """Generate random advisories."""
    inserts = []
    titles = [
        'Dengue Prevention', 'COVID-19 Booster', 'Heatwave Alert',
        'Monsoon Precautions', 'Vaccination Camp', 'Malaria Control',
        'Water Quality Alert', 'Chikungunya Awareness'
    ]
    severities = ['low', 'medium', 'high']
    publishers = ['MHO Solapur', 'SMC Health Dept', 'Epidemiologist', 'ICDS']
    for _ in range(num):
        title = f"Health Advisory: {random.choice(titles)}"
        desc = "Detailed advisory description goes here."
        sev = random.choice(severities)
        ward = None
        if random.random() < 0.5:
            ward = random.choice(wards)['code']
        pub_at = datetime.now() - timedelta(days=random.randint(0, 60))
        exp_at = None
        if random.random() < 0.7:
            exp_at = pub_at + timedelta(days=random.randint(7, 30))
        publisher = random.choice(publishers)
        inserts.append(
            f"({escape_sql_string(title)}, {escape_sql_string(desc)}, '{sev}', "
            f"{escape_sql_string(ward)}, '{pub_at.isoformat()}', "
            f"{escape_sql_string(exp_at.isoformat()) if exp_at else 'NULL'}, "
            f"{escape_sql_string(publisher)})"
        )
    return inserts

def generate_outbreak_events(wards):
    """Generate outbreak events for about half the wards."""
    inserts = []
    diseases = ['Dengue', 'Malaria', 'Typhoid', 'Cholera', 'COVID-19']
    statuses = ['investigative', 'active', 'resolved']
    for w in wards:
        if random.random() < 0.5:
            disease = random.choice(diseases)
            status = random.choice(statuses)
            declared = datetime.now().date() - timedelta(days=random.randint(1, 60))
            center_lat = 17.7 + (random.random() - 0.5) * 0.1
            center_lng = 75.9 + (random.random() - 0.5) * 0.1
            radius = random.randint(300, 1000)
            last_update = "Outbreak investigation in progress."
            is_closed = random.random() < 0.3
            inserts.append(
                f"('{w['code']}', '{disease}', '{status}', '{declared}', "
                f"{center_lat:.6f}, {center_lng:.6f}, {radius}, "
                f"{escape_sql_string(last_update)}, {is_closed})"
            )
    return inserts

def generate_household_data():
    """Generate sample household data."""
    inserts = {
        'beneficiaries': [],
        'family_members': [],
        'children': [],
        'growth_measurements': [],
        'vaccinations': [],
        'visits': []
    }
    # Beneficiaries
    ben_data = [
        ('Patil Family', 'Ramesh Patil', 'W01', '123 Main St, Kasbe Solapur', '9876543210', 5, 1, 2, False),
        ('Kamble Family', 'Suresh Kamble', 'W02', '456 MG Road, Dahitane', '9876543211', 4, 0, 1, True),
        ('Shinde Family', 'Anita Shinde', 'W03', '789 Jodbhavi Peth', '9876543212', 6, 2, 3, False),
    ]
    for i, (fn, hn, wc, addr, ph, tot, preg, child, high) in enumerate(ben_data, 1):
        inserts['beneficiaries'].append(
            f"({escape_sql_string(fn)}, {escape_sql_string(hn)}, '{wc}', {escape_sql_string(addr)}, "
            f"{escape_sql_string(ph)}, {tot}, {preg}, {child}, {high})"
        )
    
    # Family members
    members = [
        (1, 'Ramesh Patil', 45, 'Male', 'Good', None, '{"COVID": "2 doses"}'),
        (1, 'Sunita Patil', 40, 'Female', 'Good', 'Not Pregnant', '{"COVID": "2 doses"}'),
        (1, 'Raj Patil', 15, 'Male', 'Healthy', None, '{"COVID": "2 doses"}'),
        (1, 'Seema Patil', 12, 'Female', 'Healthy', None, '{"COVID": "1 dose"}'),
        (1, 'Aarav Patil', 5, 'Male', 'Good', None, '{"BCG": "given"}'),
        (2, 'Suresh Kamble', 50, 'Male', 'Diabetes', None, '{"COVID": "2 doses"}'),
        (2, 'Lata Kamble', 45, 'Female', 'Hypertension', 'Not Pregnant', '{"COVID": "2 doses"}'),
        (2, 'Nikhil Kamble', 20, 'Male', 'Healthy', None, '{"COVID": "2 doses"}'),
        (2, 'Kiran Kamble', 18, 'Female', 'Healthy', None, '{"COVID": "2 doses"}'),
        (3, 'Anita Shinde', 35, 'Female', 'Good', 'Pregnant (5 months)', '{"COVID": "2 doses"}'),
        (3, 'Vijay Shinde', 40, 'Male', 'Good', None, '{"COVID": "2 doses"}'),
        (3, 'Sanjay Shinde', 10, 'Male', 'Healthy', None, '{"COVID": "1 dose"}'),
        (3, 'Priya Shinde', 8, 'Female', 'Healthy', None, '{"COVID": "1 dose"}'),
        (3, 'Riya Shinde', 3, 'Female', 'Good', None, '{"BCG": "given"}'),
        (3, 'Aditya Shinde', 1, 'Male', 'Good', None, '{"BCG": "given"}'),
    ]
    for ben_id, name, age, gender, health, preg, vacc in members:
        inserts['family_members'].append(
            f"({ben_id}, {escape_sql_string(name)}, {age}, {escape_sql_string(gender)}, "
            f"{escape_sql_string(health)}, {escape_sql_string(preg)}, '{vacc}'::jsonb)"
        )
    
    # Children
    children = [
        (1, 5, 'Aarav Patil', '2021-03-15', 'Male', 'O+', 'normal'),
        (3, 15, 'Riya Shinde', '2023-05-10', 'Female', 'B+', 'normal'),
        (3, 16, 'Aditya Shinde', '2025-02-20', 'Male', 'AB+', 'normal'),
    ]
    for ben_id, fm_id, name, dob, gender, blood, nut in children:
        inserts['children'].append(
            f"({ben_id}, {fm_id}, {escape_sql_string(name)}, '{dob}', "
            f"{escape_sql_string(gender)}, {escape_sql_string(blood)}, '{nut}')"
        )
    
    # Growth measurements
    measurements = [
        (1, '2026-01-15', 12.5, 85, 24, 'normal'),
        (1, '2026-02-15', 12.8, 86, 25, 'normal'),
        (2, '2026-02-15', 8.2, 70, 10, 'normal'),
        (3, '2026-03-05', 5.5, 55, 1, 'normal'),
    ]
    for child_id, date, weight, height, age_mon, nut in measurements:
        inserts['growth_measurements'].append(
            f"({child_id}, '{date}', {weight}, {height}, {age_mon}, '{nut}')"
        )
    
    # Vaccinations
    vaccinations = [
        (1, 'DPT', 1, '2021-04-15', '2021-07-15'),
        (1, 'Polio', 1, '2021-04-15', '2021-07-15'),
        (2, 'BCG', 1, '2023-06-10', None),
        (3, 'Hepatitis B', 1, '2025-02-21', '2025-03-21'),
    ]
    for child_id, vaccine, dose, date_given, next_due in vaccinations:
        next_sql = f"'{next_due}'" if next_due else 'NULL'
        inserts['vaccinations'].append(
            f"({child_id}, {escape_sql_string(vaccine)}, {dose}, '{date_given}', {next_sql})"
        )
    
    # Visits
    visits = [
        (1, 5, '2026-03-10', 'Good', True, False, False, 'Mild fever, advised rest', False, 17.6805, 75.9005),
        (2, 8, '2026-03-15', 'Sick', True, True, False, 'Cough and fever, prescribed antibiotics', True, 17.6902, 75.9102),
        (3, 14, '2026-03-18', 'Good', False, False, False, 'Routine checkup', False, 17.6951, 75.9201),
    ]
    for ben_id, fm_id, date, status, fever, cough, diarrhea, notes, follow, lat, lng in visits:
        inserts['visits'].append(
            f"({ben_id}, {fm_id}, '{date}', {escape_sql_string(status)}, {fever}, {cough}, {diarrhea}, "
            f"{escape_sql_string(notes)}, {follow}, {lat:.6f}, {lng:.6f})"
        )
    return inserts

def main():
    parser = argparse.ArgumentParser(description='Generate seed SQL from GeoJSON')
    parser.add_argument('--geojson', '-g', 
                       default=DEFAULT_GEOJSON,
                       help=f'Path to GeoJSON file (default: {DEFAULT_GEOJSON})')
    parser.add_argument('--output', '-o', 
                       default=DEFAULT_OUTPUT,
                       help=f'Output SQL file (default: {DEFAULT_OUTPUT})')
    parser.add_argument('--days', '-d', 
                       type=int, 
                       default=NUM_DAYS_REPORTS,
                       help=f'Number of days of reports (default: {NUM_DAYS_REPORTS})')
    
    args = parser.parse_args()
    
    # Check if GeoJSON file exists
    if not Path(args.geojson).exists():
        print(f"Error: GeoJSON file not found at {args.geojson}")
        print(f"Current directory: {Path.cwd()}")
        sys.exit(1)
    
    print(f"Reading GeoJSON from: {args.geojson}")
    features = parse_geojson(args.geojson)
    print(f"Found {len(features)} wards")
    
    # Build wards list with codes and names
    wards = []
    for feat in features:
        props = feat['properties']
        code = f"W{props['ward_no'].zfill(2)}"
        wards.append({
            'code': code,
            'name': props.get('ward_name') or props.get('landmark') or f"Ward {props['ward_no']}",
            'population': int(props['tot_pop']) if props['tot_pop'] else 5000,
            'geom': feat['geometry'],
            'boundary': feat
        })
    
    print(f"Generating SQL to: {args.output}")
    
    # Generate SQL content
    sql_parts = []
    
    sql_parts.append("-- =================================================")
    sql_parts.append("-- Seed Data for Health Database")
    sql_parts.append("-- Generated by Python script")
    sql_parts.append("-- =================================================\n")
    
    # 1. Wards
    sql_parts.append("-- Wards")
    ward_inserts = generate_ward_inserts(features)
    sql_parts.append("INSERT INTO public.wards (code, name, total_population, target_daily_reports, geom, boundary_geojson) VALUES")
    sql_parts.append(",\n".join(ward_inserts) + ";")
    sql_parts.append("\n")
    
    # 2. Users (build list first)
    sql_parts.append("-- Users")
    user_inserts = generate_users(wards)
    sql_parts.append("INSERT INTO public.users (username, password_hash, role, ward_code, full_name, last_sync_time, reports_submitted_total) VALUES")
    sql_parts.append(",\n".join(user_inserts) + ";")
    sql_parts.append("\n")
    
    # Get users with IDs (we need to know their IDs for reports)
    sql_parts.append("-- Get the generated user IDs")
    sql_parts.append("DO $$")
    sql_parts.append("DECLARE")
    sql_parts.append("    user_rec RECORD;")
    sql_parts.append("BEGIN")
    sql_parts.append("    FOR user_rec IN SELECT username, id FROM public.users WHERE role = 'ASHA' LOOP")
    sql_parts.append("        EXECUTE format('CREATE TEMP TABLE IF NOT EXISTS user_id_map (username TEXT, user_id INTEGER);');")
    sql_parts.append("        EXECUTE format('INSERT INTO user_id_map VALUES (%L, %s);', user_rec.username, user_rec.id);")
    sql_parts.append("    END LOOP;")
    sql_parts.append("END $$;")
    sql_parts.append("\n")
    
    # 3. Disease Resource Mapping
    sql_parts.append("-- Disease Resource Mapping")
    sql_parts.append("INSERT INTO public.disease_resource_mapping (disease, resource_type) VALUES")
    sql_parts.append("('fever', 'Antipyretic'),\n('cough', 'Cough Syrup'),\n('diarrhea', 'ORS'),\n('dengue', 'ORS'),\n('malaria', 'RDT Kit');")
    sql_parts.append("\n")
    
    # 4. Facilities (build list with IDs)
    sql_parts.append("-- Facilities")
    fac_inserts = generate_facilities(wards)
    sql_parts.append("INSERT INTO public.facilities (name, ward_code, location_lat, location_lng, contact, type, oxygen_status, facility_type, address, specialties, doctors) VALUES")
    sql_parts.append(",\n".join(fac_inserts) + ";")
    sql_parts.append("\n")
    
    # Get facilities with IDs
    sql_parts.append("-- Get the generated facility IDs")
    sql_parts.append("CREATE TEMP TABLE facility_id_map (facility_id INTEGER, ward_code VARCHAR(10));")
    sql_parts.append("INSERT INTO facility_id_map (facility_id, ward_code)")
    sql_parts.append("SELECT id, ward_code FROM public.facilities ORDER BY id;")
    sql_parts.append("\n")
    
    # 5. Capacity Reports
    sql_parts.append("-- Capacity Reports")
    sql_parts.append("INSERT INTO public.capacity_reports (facility_id, report_date, beds_total, beds_available, icu_total, icu_available, ventilators_total, ventilators_available, oxygen_available, disease_counts, created_at)")
    sql_parts.append("SELECT")
    sql_parts.append("    f.facility_id,")
    sql_parts.append("    generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day'::interval)::date AS report_date,")
    sql_parts.append("    floor(random() * 150 + 50)::int AS beds_total,")
    sql_parts.append("    floor(random() * 40 + 10)::int AS beds_available,")
    sql_parts.append("    floor(random() * 20 + 10)::int AS icu_total,")
    sql_parts.append("    floor(random() * 8 + 2)::int AS icu_available,")
    sql_parts.append("    floor(random() * 10 + 5)::int AS ventilators_total,")
    sql_parts.append("    floor(random() * 3 + 1)::int AS ventilators_available,")
    sql_parts.append("    random() > 0.2 AS oxygen_available,")
    sql_parts.append("    jsonb_build_object('fever', floor(random() * 30)::int, 'cough', floor(random() * 20)::int, 'diarrhea', floor(random() * 15)::int) AS disease_counts,")
    sql_parts.append("    NOW() AS created_at")
    sql_parts.append("FROM facility_id_map f")
    sql_parts.append("CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day'::interval);")
    sql_parts.append("\n")
    
    # 6. Facility Inventory (with intentional low/critical stocks)
    sql_parts.append("-- Facility Inventory (with critical and low stock for some facilities)")
    sql_parts.append("INSERT INTO public.facility_inventory (facility_id, resource_type, current_stock, min_threshold, last_updated)")
    sql_parts.append("SELECT")
    sql_parts.append("    f.facility_id,")
    sql_parts.append("    unnest(ARRAY['Antipyretic', 'Cough Syrup', 'ORS', 'RDT Kit']) AS resource_type,")
    sql_parts.append("    CASE")
    sql_parts.append("        WHEN f.facility_id % 3 = 1 THEN floor(random() * 30)::int  -- critically low")
    sql_parts.append("        WHEN f.facility_id % 3 = 2 THEN floor(random() * 60 + 40)::int  -- low")
    sql_parts.append("        ELSE floor(random() * 500 + 200)::int  -- healthy")
    sql_parts.append("    END AS current_stock,")
    sql_parts.append("    100 AS min_threshold,")
    sql_parts.append("    NOW() - (random() * INTERVAL '30 days') AS last_updated")
    sql_parts.append("FROM facility_id_map f")
    sql_parts.append("CROSS JOIN generate_series(1, 4);")
    sql_parts.append("\n")
    
    # 7. ASHA Reports (using ST_GeneratePoints inside ward geometry)
    sql_parts.append("-- ASHA Reports (coordinates generated inside ward polygons)")
    sql_parts.append("INSERT INTO public.asha_reports (worker_id, ward_code, report_date, fever_count, cough_count, diarrhea_count, jaundice_count, rash_count, maternal_risk_flags, child_risk_flags, environmental_flags, location_lat, location_lng, disease_type, reporting_form, photo_paths)")
    sql_parts.append("SELECT")
    sql_parts.append("    u.id AS worker_id,")
    sql_parts.append("    u.ward_code,")
    sql_parts.append("    report_date,")
    sql_parts.append("    fever_count,")
    sql_parts.append("    cough_count,")
    sql_parts.append("    diarrhea_count,")
    sql_parts.append("    jaundice_count,")
    sql_parts.append("    rash_count,")
    sql_parts.append("    maternal_risk_flags,")
    sql_parts.append("    child_risk_flags,")
    sql_parts.append("    environmental_flags,")
    sql_parts.append("    ST_X(point) AS location_lat,")
    sql_parts.append("    ST_Y(point) AS location_lng,")
    sql_parts.append("    disease_type,")
    sql_parts.append("    reporting_form,")
    sql_parts.append("    '[]'::jsonb AS photo_paths")
    sql_parts.append("FROM (")
    sql_parts.append("    SELECT")
    sql_parts.append("        u.id,")
    sql_parts.append("        u.ward_code,")
    sql_parts.append("        generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day'::interval)::date AS report_date,")
    sql_parts.append("        CASE WHEN random() < 0.05 THEN floor(random() * 100 + 50)::int ELSE floor(random() * 12)::int END AS fever_count,")
    sql_parts.append("        CASE WHEN random() < 0.05 THEN floor(random() * 80 + 40)::int ELSE floor(random() * 10)::int END AS cough_count,")
    sql_parts.append("        CASE WHEN random() < 0.05 THEN floor(random() * 60 + 30)::int ELSE floor(random() * 8)::int END AS diarrhea_count,")
    sql_parts.append("        floor(random() * 3)::int AS jaundice_count,")
    sql_parts.append("        floor(random() * 2)::int AS rash_count,")
    sql_parts.append("        CASE WHEN random() > 0.7 THEN jsonb_build_object('high_risk_pregnancies', floor(random() * 2)::int) ELSE NULL END AS maternal_risk_flags,")
    sql_parts.append("        CASE WHEN random() > 0.8 THEN jsonb_build_object('malnourished', floor(random() * 3)::int) ELSE NULL END AS child_risk_flags,")
    sql_parts.append("        CASE WHEN random() > 0.9 THEN jsonb_build_object('stagnant_water', random() > 0.5) ELSE NULL END AS environmental_flags,")
    sql_parts.append("        CASE WHEN random() < 0.1 THEN 'Dengue' WHEN random() < 0.2 THEN 'Malaria' ELSE 'General Fever' END AS disease_type,")
    sql_parts.append("        CASE WHEN random() < 0.33 THEN 'S' WHEN random() < 0.66 THEN 'P' ELSE 'L' END AS reporting_form,")
    sql_parts.append("        ST_GeneratePoints(w.geom, 1) AS point")
    sql_parts.append("    FROM public.users u")
    sql_parts.append("    JOIN public.wards w ON u.ward_code = w.code")
    sql_parts.append("    WHERE u.role = 'ASHA'")
    sql_parts.append(") t;")
    sql_parts.append("\n")
    
    # 8. Alerts
    sql_parts.append("-- Alerts")
    sql_parts.append("INSERT INTO public.alerts (type, severity, ward_code, title, description, generated_at, acknowledged_at, resolved_at, status)")
    sql_parts.append("SELECT")
    sql_parts.append("    (ARRAY['resource', 'outbreak', 'info'])[floor(random() * 3 + 1)] AS type,")
    sql_parts.append("    (ARRAY['low', 'medium', 'high', 'critical'])[floor(random() * 4 + 1)] AS severity,")
    sql_parts.append("    CASE WHEN random() < 0.7 THEN (SELECT code FROM public.wards ORDER BY random() LIMIT 1) ELSE NULL END AS ward_code,")
    sql_parts.append("    'Alert ' || floor(random() * 1000)::int AS title,")
    sql_parts.append("    'Automatically generated alert description' AS description,")
    sql_parts.append("    NOW() - (random() * INTERVAL '30 days') AS generated_at,")
    sql_parts.append("    CASE WHEN random() < 0.3 THEN NOW() - (random() * INTERVAL '20 days') ELSE NULL END AS acknowledged_at,")
    sql_parts.append("    CASE WHEN random() < 0.2 THEN NOW() - (random() * INTERVAL '10 days') ELSE NULL END AS resolved_at,")
    sql_parts.append("    (ARRAY['active', 'acknowledged', 'resolved'])[floor(random() * 3 + 1)] AS status")
    sql_parts.append("FROM generate_series(1, 100);")
    sql_parts.append("\n")
    
    # 9. Advisories
    sql_parts.append("-- Advisories")
    sql_parts.append("INSERT INTO public.advisories (title, description, severity, ward_code, published_at, expires_at, published_by)")
    sql_parts.append("SELECT")
    sql_parts.append("    'Health Advisory: ' || (ARRAY['Dengue Prevention', 'COVID-19 Booster', 'Heatwave Alert', 'Monsoon Precautions', 'Vaccination Camp'])[floor(random() * 5 + 1)] AS title,")
    sql_parts.append("    'Detailed advisory description goes here.' AS description,")
    sql_parts.append("    (ARRAY['low', 'medium', 'high'])[floor(random() * 3 + 1)] AS severity,")
    sql_parts.append("    CASE WHEN random() < 0.5 THEN (SELECT code FROM public.wards ORDER BY random() LIMIT 1) ELSE NULL END AS ward_code,")
    sql_parts.append("    NOW() - (random() * INTERVAL '60 days') AS published_at,")
    sql_parts.append("    CASE WHEN random() < 0.7 THEN NOW() + (random() * INTERVAL '30 days') ELSE NULL END AS expires_at,")
    sql_parts.append("    (ARRAY['MHO Solapur', 'SMC Health Dept', 'Epidemiologist', 'ICDS'])[floor(random() * 4 + 1)] AS published_by")
    sql_parts.append("FROM generate_series(1, 50);")
    sql_parts.append("\n")
    
    # 10. Outbreak Events
    sql_parts.append("-- Outbreak Events")
    sql_parts.append("INSERT INTO public.outbreak_events (ward_code, disease_type, status, declared_date, center_lat, center_lng, containment_radius_meters, last_update, is_closed)")
    sql_parts.append("SELECT")
    sql_parts.append("    code,")
    sql_parts.append("    (ARRAY['Dengue', 'Malaria', 'Typhoid', 'Cholera', 'COVID-19'])[floor(random() * 5 + 1)] AS disease_type,")
    sql_parts.append("    (ARRAY['investigative', 'active', 'resolved'])[floor(random() * 3 + 1)] AS status,")
    sql_parts.append("    CURRENT_DATE - (random() * INTERVAL '60 days')::int AS declared_date,")
    sql_parts.append("    ST_X(ST_Centroid(geom)) + (random() - 0.5) * 0.005 AS center_lat,")
    sql_parts.append("    ST_Y(ST_Centroid(geom)) + (random() - 0.5) * 0.005 AS center_lng,")
    sql_parts.append("    floor(random() * 500 + 500)::int AS containment_radius_meters,")
    sql_parts.append("    'Outbreak investigation in progress.' AS last_update,")
    sql_parts.append("    random() < 0.3 AS is_closed")
    sql_parts.append("FROM public.wards")
    sql_parts.append("WHERE random() < 0.5;")
    sql_parts.append("\n")
    
    # 11. Household Data
    sql_parts.append("-- Household Data")
    household = generate_household_data()
    if household['beneficiaries']:
        sql_parts.append("INSERT INTO public.beneficiaries (family_name, head_name, ward_code, address, contact_number, total_members, pregnant_women_count, children_count, high_risk_flag) VALUES")
        sql_parts.append(",\n".join(household['beneficiaries']) + ";")
        sql_parts.append("\n")
    if household['family_members']:
        sql_parts.append("INSERT INTO public.family_members (beneficiary_id, name, age, gender, health_status, pregnancy_status, vaccination_status) VALUES")
        sql_parts.append(",\n".join(household['family_members']) + ";")
        sql_parts.append("\n")
    if household['children']:
        sql_parts.append("INSERT INTO public.children (beneficiary_id, family_member_id, name, date_of_birth, gender, blood_group, nutrition_status) VALUES")
        sql_parts.append(",\n".join(household['children']) + ";")
        sql_parts.append("\n")
    if household['growth_measurements']:
        sql_parts.append("INSERT INTO public.growth_measurements (child_id, measured_at, weight_kg, height_cm, age_months, nutrition_status) VALUES")
        sql_parts.append(",\n".join(household['growth_measurements']) + ";")
        sql_parts.append("\n")
    if household['vaccinations']:
        sql_parts.append("INSERT INTO public.vaccinations (child_id, vaccine_name, dose_number, date_given, next_due_date) VALUES")
        sql_parts.append(",\n".join(household['vaccinations']) + ";")
        sql_parts.append("\n")
    if household['visits']:
        sql_parts.append("INSERT INTO public.visits (beneficiary_id, family_member_id, visit_date, health_status, fever, cough, diarrhea, notes, follow_up_required, location_lat, location_lng) VALUES")
        sql_parts.append(",\n".join(household['visits']) + ";")
        sql_parts.append("\n")
    
    # 12. Inventory Distribution Logs
    sql_parts.append("-- Inventory Distribution Logs")
    sql_parts.append("INSERT INTO public.inventory_distribution_logs (ward_code, resource_type, quantity_distributed, beneficiary_type, report_date) VALUES")
    sql_parts.append("('W01', 'Antipyretic', 150, 'PHC', CURRENT_DATE - INTERVAL '5 days'),")
    sql_parts.append("('W02', 'ORS', 80, 'ASHA', CURRENT_DATE - INTERVAL '3 days'),")
    sql_parts.append("('W03', 'Cough Syrup', 120, 'Sub-Center', CURRENT_DATE - INTERVAL '2 days'),")
    sql_parts.append("('W05', 'RDT Kit', 50, 'ASHA', CURRENT_DATE - INTERVAL '1 day');")
    sql_parts.append("\n")
    
    # 13. Outbreak Predictions
    sql_parts.append("-- Outbreak Predictions")
    sql_parts.append("INSERT INTO public.outbreak_predictions (ward_code, prediction_date, predicted_cases, confidence_lower, confidence_upper, model_version)")
    sql_parts.append("SELECT")
    sql_parts.append("    code,")
    sql_parts.append("    generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day'::interval)::date AS prediction_date,")
    sql_parts.append("    floor(random() * 30 + 5)::int AS predicted_cases,")
    sql_parts.append("    floor(random() * 15)::int AS confidence_lower,")
    sql_parts.append("    floor(random() * 45 + 10)::int AS confidence_upper,")
    sql_parts.append("    'linear_v1' AS model_version")
    sql_parts.append("FROM public.wards;")
    sql_parts.append("\n")
    
    # 14. Resource Demand Forecast
    sql_parts.append("-- Resource Demand Forecast")
    sql_parts.append("INSERT INTO public.resource_demand_forecast (ward_code, resource_type, forecast_date, predicted_demand)")
    sql_parts.append("SELECT")
    sql_parts.append("    w.code,")
    sql_parts.append("    unnest(ARRAY['Antipyretic', 'Cough Syrup', 'ORS', 'RDT Kit']) AS resource_type,")
    sql_parts.append("    generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day'::interval)::date AS forecast_date,")
    sql_parts.append("    floor(random() * 50 + 10)::int AS predicted_demand")
    sql_parts.append("FROM public.wards w")
    sql_parts.append("CROSS JOIN generate_series(1, 4);")
    sql_parts.append("\n")
    
    # 15. System Audit Logs
    sql_parts.append("-- System Audit Logs")
    sql_parts.append("INSERT INTO public.system_audit_logs (user_id, action_type, description)")
    sql_parts.append("SELECT")
    sql_parts.append("    id,")
    sql_parts.append("    (ARRAY['LOGIN', 'REPORT_SUBMIT', 'DATA_SYNC', 'VIEW_DASHBOARD'])[floor(random() * 4 + 1)] AS action_type,")
    sql_parts.append("    'User performed action ' || (ARRAY['logged in', 'submitted report', 'synced data', 'viewed dashboard'])[floor(random() * 4 + 1)] AS description")
    sql_parts.append("FROM public.users")
    sql_parts.append("WHERE random() < 0.5")
    sql_parts.append("LIMIT 50;")
    sql_parts.append("\n")
    
    sql_parts.append("-- Clean up temporary tables")
    sql_parts.append("DROP TABLE IF EXISTS facility_id_map;")
    sql_parts.append("DROP TABLE IF EXISTS user_id_map;")
    
    # Write to file
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql_parts))
    
    print(f"✅ SQL seed file generated: {args.output}")
    print(f"📊 Generated data includes:")
    print(f"   - {len(features)} wards with proper geometries and population")
    print(f"   - {len(wards)} ASHA workers + admin")
    print(f"   - 30 days of capacity reports per facility")
    print(f"   - 31 days of ASHA reports per worker with coordinates inside ward polygons")
    print(f"   - 100 alerts, 50 advisories")
    print(f"   - Outbreak events, predictions, and resource forecasts")
    print(f"   - Sample household data with family members, children, etc.")
    print(f"   - Inventory with intentional critical/low stock levels to trigger dashboard alerts")

if __name__ == "__main__":
    main()