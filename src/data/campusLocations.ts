export interface CampusVerifiedLocation {
  id: string;
  title: string;
  category: 'carpool' | 'pg' | 'roommate' | 'transit' | 'landmark';
  address: string;
  distanceFromCampus: string;
  description: string;
  tags: string[];
  mapsQuery: string;
  mapsUrl: string;
  typicalRent?: string;
  coordinates?: { lat: number; lng: number };
}

export interface CollegeLocationsRegistry {
  collegeName: string;
  shortName: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  centerCoordinates: { lat: number; lng: number };
  locations: CampusVerifiedLocation[];
}

export const CAMPUS_LOCATIONS_DATABASE: Record<string, CollegeLocationsRegistry> = {
  iitd: {
    collegeName: 'IIT Delhi',
    shortName: 'IITD',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    currency: '₹',
    centerCoordinates: { lat: 28.545, lng: 77.1926 },
    locations: [
      {
        id: 'iitd_loc_1',
        title: 'IIT Delhi Main Gate & Hauz Khas Transit Hub',
        category: 'carpool',
        address: 'Outer Ring Road, Hauz Khas, New Delhi 110016',
        distanceFromCampus: 'Main Entrance (0 min walk)',
        description: 'Designated campus entrance with dedicated rideshare pickup bay, auto-rickshaw stand, and 24/7 security booth.',
        tags: ['Carpool', 'Rideshare Bay', 'Safe Meetup', '24/7 Gate'],
        mapsQuery: 'IIT Delhi Main Gate Hauz Khas New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=IIT+Delhi+Main+Gate+Hauz+Khas+New+Delhi',
        coordinates: { lat: 28.5463, lng: 77.1932 }
      },
      {
        id: 'iitd_loc_2',
        title: 'IIT Delhi Metro Station (Magenta Line Gate 1 & 2)',
        category: 'transit',
        address: 'Gamal Abdel Nasser Marg, Hauz Khas, New Delhi',
        distanceFromCampus: 'Directly at Campus Gate 1 (1 min walk)',
        description: 'Direct air-conditioned metro rail connection linking Noida, Gurugram, Janakpuri, and South Delhi. Ideal meeting point for cross-city carpoolers.',
        tags: ['Metro Station', 'Transit Hub', 'Magenta Line', 'Covered Walkway'],
        mapsQuery: 'IIT Metro Station Magenta Line New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=IIT+Metro+Station+Magenta+Line+New+Delhi',
        coordinates: { lat: 28.5439, lng: 77.1945 }
      },
      {
        id: 'iitd_loc_3',
        title: 'Jia Sarai Student Accommodation Hub',
        category: 'pg',
        address: 'Jia Sarai, Hauz Khas, New Delhi 110016',
        distanceFromCampus: '200m from IIT Delhi West Gate (3 min walk)',
        description: 'The highest-density student PG and shared flat colony right beside IIT Delhi. Furnished 1RK, 1BHK, and double sharing rooms with Wi-Fi and mess.',
        typicalRent: '₹7,500 – ₹13,000 / month',
        tags: ['Student PGs', 'Zero Commute', 'Budget Flats', 'Student Mess'],
        mapsQuery: 'Jia Sarai Hauz Khas New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jia+Sarai+Hauz+Khas+New+Delhi',
        coordinates: { lat: 28.5468, lng: 77.1865 }
      },
      {
        id: 'iitd_loc_4',
        title: 'Ber Sarai Student Flats & Book Market',
        category: 'pg',
        address: 'Ber Sarai, Opposite JNU Old Campus, New Delhi 110016',
        distanceFromCampus: '600m from IIT Delhi North Gate (7 min walk)',
        description: 'Peaceful student neighborhood with independent 2BHK/3BHK flats, engineering bookstores, photocopy shops, and affordable tiffin centers.',
        typicalRent: '₹6,500 – ₹11,000 / month',
        tags: ['Shared Flats', 'Affordable Rent', 'Book Market', 'Walkable'],
        mapsQuery: 'Ber Sarai New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ber+Sarai+New+Delhi',
        coordinates: { lat: 28.5502, lng: 77.1878 }
      },
      {
        id: 'iitd_loc_5',
        title: 'Katwaria Sarai & Munirka Enclave',
        category: 'pg',
        address: 'Katwaria Sarai, Near Qutub Institutional Area, New Delhi',
        distanceFromCampus: '1.2 km from IIT Delhi (12 min walk / 4 min e-rickshaw)',
        description: 'Modern private student PG buildings with air-conditioning, attached bathrooms, elevator access, and rooftop study lounges.',
        typicalRent: '₹8,000 – ₹14,500 / month',
        tags: ['AC PGs', 'Private Rooms', 'E-Rickshaw Route', 'Institutional Area'],
        mapsQuery: 'Katwaria Sarai New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Katwaria+Sarai+New+Delhi',
        coordinates: { lat: 28.5401, lng: 77.1852 }
      },
      {
        id: 'iitd_loc_6',
        title: 'SDA Market (Safdarjung Development Area)',
        category: 'roommate',
        address: 'Opposite IIT Main Gate, Sri Aurobindo Marg, New Delhi 110016',
        distanceFromCampus: 'Across Main Gate (2 min walk via pedestrian signal)',
        description: 'Legendary student culinary & social strip. Top meeting place for roommate interviews, peer discussions, cafes, and stationery hubs.',
        tags: ['Roommate Meetup', 'Cafes & Dining', 'Across Main Gate', 'Student Hangout'],
        mapsQuery: 'SDA Market Opposite IIT Delhi New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=SDA+Market+Opposite+IIT+Delhi+New+Delhi',
        coordinates: { lat: 28.5478, lng: 77.1952 }
      },
      {
        id: 'iitd_loc_7',
        title: 'Student Activity Center (SAC) & Nilgiri Circle',
        category: 'carpool',
        address: 'Internal Campus Road, IIT Delhi Campus, New Delhi 110016',
        distanceFromCampus: 'Center of Campus',
        description: 'Safe internal campus pickup loop with ample space for student carpooling, campus electric golf-cart shuttles, and inter-hostel rides.',
        tags: ['Internal Campus', 'SAC Circle', 'Hostel Pickup', 'Lit Walkway'],
        mapsQuery: 'Student Activity Center IIT Delhi New Delhi',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Student+Activity+Center+IIT+Delhi+New+Delhi',
        coordinates: { lat: 28.5445, lng: 77.1912 }
      }
    ]
  },

  stanford: {
    collegeName: 'Stanford University',
    shortName: 'Stanford',
    city: 'Stanford',
    state: 'CA',
    country: 'USA',
    currency: '$',
    centerCoordinates: { lat: 37.4275, lng: -122.1697 },
    locations: [
      {
        id: 'stan_loc_1',
        title: 'Stanford Oval & Serra Mall Transit Loop',
        category: 'carpool',
        address: '450 Serra Mall, Stanford, CA 94305',
        distanceFromCampus: 'Main Quad Entrance (0 min walk)',
        description: 'Primary Marguerite free shuttle turnaround with dedicated passenger loading bays and well-lit carpool meeting islands.',
        tags: ['Marguerite Shuttle', 'Rideshare Loading', 'Central Oval', 'CCTV Protected'],
        mapsQuery: 'Stanford Oval Serra Mall Stanford CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Stanford+Oval+Serra+Mall+Stanford+CA',
        coordinates: { lat: 37.4292, lng: -122.1697 }
      },
      {
        id: 'stan_loc_2',
        title: 'Palo Alto Caltrain & University Ave Transit Center',
        category: 'transit',
        address: '95 University Ave, Palo Alto, CA 94301',
        distanceFromCampus: '1.4 miles from Oval (Direct Marguerite Line P connection)',
        description: 'Key commuter rail station connecting San Francisco, San Jose, and the Peninsula. Ideal meeting hub for regional carpoolers.',
        tags: ['Caltrain Rail', 'Express Bus', 'Bike Lockers', 'Downtown Connector'],
        mapsQuery: 'Palo Alto Caltrain Station University Ave',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Palo+Alto+Caltrain+Station+University+Ave',
        coordinates: { lat: 37.4431, lng: -122.1648 }
      },
      {
        id: 'stan_loc_3',
        title: 'College Terrace Student Residential District',
        category: 'pg',
        address: 'College Terrace, Palo Alto, CA 94306',
        distanceFromCampus: '0.8 miles south (6 min bike ride)',
        description: 'Historic tree-lined neighborhood directly adjacent to campus. Popular with undergraduate and graduate students for shared cottages and rooms.',
        typicalRent: '$1,300 – $1,950 / month',
        tags: ['Student Houses', 'Bike Boulevard', 'Quiet Study Area', 'Stanford Border'],
        mapsQuery: 'College Terrace Palo Alto CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=College+Terrace+Palo+Alto+CA',
        coordinates: { lat: 37.4208, lng: -122.1485 }
      },
      {
        id: 'stan_loc_4',
        title: 'Downtown Palo Alto Student Apartments & Flats',
        category: 'pg',
        address: 'University Ave & Lytton Ave, Palo Alto, CA 94301',
        distanceFromCampus: '1.2 miles (8 min bike ride / Free Shuttle)',
        description: 'Vibrant urban apartments with direct access to supermarkets (Whole Foods, Trader Joe\'s), coffee shops, and late-night campus shuttles.',
        typicalRent: '$1,650 – $2,400 / month',
        tags: ['Downtown Flats', 'Near Caltrain', 'Supermarkets', 'Cafes Nearby'],
        mapsQuery: 'University Ave Palo Alto CA Apartments',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=University+Ave+Palo+Alto+CA+Apartments',
        coordinates: { lat: 37.4442, lng: -122.1601 }
      },
      {
        id: 'stan_loc_5',
        title: 'Tresidder Memorial Union & White Plaza',
        category: 'roommate',
        address: '459 Lagunita Dr, Stanford, CA 94305',
        distanceFromCampus: 'Central Campus Hub',
        description: 'Student activities center featuring CoHo (Coffee House), housing message boards, student credit union, and outdoor roommate meetup patio.',
        tags: ['Roommate Meetup', 'CoHo Coffee House', 'Housing Board', 'Central Campus'],
        mapsQuery: 'Tresidder Memorial Union Stanford CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tresidder+Memorial+Union+Stanford+CA',
        coordinates: { lat: 37.4239, lng: -122.1712 }
      },
      {
        id: 'stan_loc_6',
        title: 'California Avenue Student Corridor',
        category: 'roommate',
        address: 'California Ave, Palo Alto, CA 94306',
        distanceFromCampus: '1.5 miles south (Marguerite Line C direct)',
        description: 'Pedestrian-friendly avenue with bookstores, affordable taquerias, Sunday farmers market, and second Caltrain stop.',
        tags: ['Farmers Market', 'Student Dining', 'Caltrain South', 'Roommate Hangout'],
        mapsQuery: 'California Ave Palo Alto CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=California+Ave+Palo+Alto+CA',
        coordinates: { lat: 37.4278, lng: -122.1425 }
      }
    ]
  },

  berkeley: {
    collegeName: 'UC Berkeley',
    shortName: 'Cal',
    city: 'Berkeley',
    state: 'CA',
    country: 'USA',
    currency: '$',
    centerCoordinates: { lat: 37.8719, lng: -122.2585 },
    locations: [
      {
        id: 'cal_loc_1',
        title: 'Downtown Berkeley BART Station & Shattuck Plaza',
        category: 'transit',
        address: '2160 Shattuck Ave, Berkeley, CA 94704',
        distanceFromCampus: '1 block west of campus entrance (2 min walk)',
        description: 'Central regional subway hub connecting San Francisco, Oakland, and East Bay. Designated passenger loading island for rideshares.',
        tags: ['BART Station', 'Regional Rail', 'Carpool Hub', 'AC Transit'],
        mapsQuery: 'Downtown Berkeley BART Station Berkeley CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Downtown+Berkeley+BART+Station+Berkeley+CA',
        coordinates: { lat: 37.8701, lng: -122.2681 }
      },
      {
        id: 'cal_loc_2',
        title: 'Sproul Plaza & Bancroft Way Bus Corridor',
        category: 'carpool',
        address: 'Bancroft Way at Telegraph Ave, Berkeley, CA 94720',
        distanceFromCampus: 'South Campus Gate (0 min walk)',
        description: 'Primary student carpool and Bear Transit bus pickup zone with continuous pedestrian traffic and secure street lighting.',
        tags: ['Bear Transit', 'AC Transit 51B', 'South Gate', 'High Traffic'],
        mapsQuery: 'Sproul Plaza Bancroft Way Berkeley CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sproul+Plaza+Bancroft+Way+Berkeley+CA',
        coordinates: { lat: 37.8696, lng: -122.2588 }
      },
      {
        id: 'cal_loc_3',
        title: 'Southside & Telegraph Avenue District',
        category: 'pg',
        address: 'Telegraph Ave, Channing Way & Haste St, Berkeley, CA',
        distanceFromCampus: '1–4 blocks south of campus (3–8 min walk)',
        description: 'The heartbeat of student life at Cal. Highest concentration of student flats, student housing co-ops, and shared apartments.',
        typicalRent: '$1,150 – $1,800 / month',
        tags: ['Student Co-ops', 'Telegraph Strip', 'Bustling Area', 'Walk to Class'],
        mapsQuery: 'Telegraph Ave Berkeley CA Student Housing',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Telegraph+Ave+Berkeley+CA+Student+Housing',
        coordinates: { lat: 37.8655, lng: -122.2589 }
      },
      {
        id: 'cal_loc_4',
        title: 'Northside & Hearst Avenue Corridor',
        category: 'pg',
        address: 'Hearst Ave & Euclid Ave, Berkeley, CA 94709',
        distanceFromCampus: 'North Campus boundary (2 min walk to Engineering)',
        description: 'Quiet, academic residential sector situated directly opposite the College of Engineering and Chemistry quads. Highly sought after by STEM students.',
        typicalRent: '$1,350 – $2,000 / month',
        tags: ['Quiet Area', 'Near Engineering', 'Safe Streets', 'Euclid Cafes'],
        mapsQuery: 'Hearst Ave Euclid Ave Berkeley CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Hearst+Ave+Euclid+Ave+Berkeley+CA',
        coordinates: { lat: 37.8752, lng: -122.2605 }
      },
      {
        id: 'cal_loc_5',
        title: 'MLK Jr. Student Union & Pauley Ballroom',
        category: 'roommate',
        address: '2495 Bancroft Way, Berkeley, CA 94720',
        distanceFromCampus: 'Central Student Hub',
        description: 'Campus student union with community lounge spaces, study booths, housing bulletin boards, and Caffe Strada nearby.',
        tags: ['Student Union', 'Roommate Chat', 'Campus Bulletin', 'Sproul Steps'],
        mapsQuery: 'Martin Luther King Jr Student Union Berkeley CA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Martin+Luther+King+Jr+Student+Union+Berkeley+CA',
        coordinates: { lat: 37.8692, lng: -122.2597 }
      }
    ]
  },

  mit: {
    collegeName: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
    currency: '$',
    centerCoordinates: { lat: 42.3601, lng: -71.0942 },
    locations: [
      {
        id: 'mit_loc_1',
        title: 'Kendall/MIT MBTA Red Line Subway Station',
        category: 'transit',
        address: 'Main St at 300 Main St, Cambridge, MA 02142',
        distanceFromCampus: 'East Campus Boundary (2 min walk)',
        description: 'Major transit hub with direct subway service to Harvard, Boston Common, South Station, and airport bus lines. Dedicated carpool bays.',
        tags: ['Red Line MBTA', 'Subway Hub', 'Kendall Square', 'Express Shuttles'],
        mapsQuery: 'Kendall MIT Subway Station Cambridge MA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kendall+MIT+Subway+Station+Cambridge+MA',
        coordinates: { lat: 42.3624, lng: -71.0861 }
      },
      {
        id: 'mit_loc_2',
        title: 'Stratton Student Center & 84 Mass Ave Loop',
        category: 'carpool',
        address: '84 Massachusetts Ave, Cambridge, MA 02139',
        distanceFromCampus: 'Central West Campus',
        description: 'Primary campus shuttle stop (Tech Shuttle, Saferide) and rideshare passenger pick-up zone with 24/7 lobby security.',
        tags: ['Tech Shuttle', '84 Mass Ave', 'Rideshare Stop', '24/7 Security'],
        mapsQuery: 'Stratton Student Center MIT Cambridge MA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Stratton+Student+Center+MIT+Cambridge+MA',
        coordinates: { lat: 42.3592, lng: -71.0949 }
      },
      {
        id: 'mit_loc_3',
        title: 'Central Square & Mass Ave Student District',
        category: 'pg',
        address: 'Central Square, Massachusetts Ave, Cambridge, MA 02139',
        distanceFromCampus: '0.7 miles northwest (9 min walk)',
        description: 'Vibrant cultural and student apartment district offering multi-bedroom brownstone flats, grocery stores (Target, H Mart), and direct Red Line access.',
        typicalRent: '$1,200 – $1,850 / month',
        tags: ['Central Square', 'Target & H Mart', 'Red Line Access', 'Walkable'],
        mapsQuery: 'Central Square Cambridge MA Student Apartments',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Central+Square+Cambridge+MA+Student+Apartments',
        coordinates: { lat: 42.3653, lng: -71.1037 }
      },
      {
        id: 'mit_loc_4',
        title: 'Inman Square & Prospect Street Flats',
        category: 'pg',
        address: 'Inman Square, Cambridge, MA 02139',
        distanceFromCampus: '1.1 miles north (7 min bike ride)',
        description: 'Cozy residential square famous for student-friendly shared apartments, craft bakeries, and quiet study environments.',
        typicalRent: '$1,100 – $1,650 / month',
        tags: ['Inman Square', 'Shared Flats', 'Bike Friendly', 'Quiet Neighborhood'],
        mapsQuery: 'Inman Square Cambridge MA Apartments',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Inman+Square+Cambridge+MA+Apartments',
        coordinates: { lat: 42.3735, lng: -71.1005 }
      },
      {
        id: 'mit_loc_5',
        title: 'Stratton Student Lounge & Coffee Bar',
        category: 'roommate',
        address: '84 Massachusetts Ave, 1st Floor, Cambridge, MA 02139',
        distanceFromCampus: 'Main Campus Center',
        description: 'Top campus meeting place for prospective roommates to discuss leases, review MIT Off-Campus Housing listings, and study.',
        tags: ['Roommate Meeting', 'LaVerdes Deli', 'Study Lounge', 'Housing Boards'],
        mapsQuery: 'Stratton Student Center 84 Massachusetts Ave Cambridge MA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Stratton+Student+Center+84+Massachusetts+Ave+Cambridge+MA',
        coordinates: { lat: 42.3592, lng: -71.0949 }
      }
    ]
  },

  cmu: {
    collegeName: 'Carnegie Mellon University',
    shortName: 'CMU',
    city: 'Pittsburgh',
    state: 'PA',
    country: 'USA',
    currency: '$',
    centerCoordinates: { lat: 40.4432, lng: -79.9428 },
    locations: [
      {
        id: 'cmu_loc_1',
        title: 'Cohon University Center & Forbes Ave Transit Turnaround',
        category: 'carpool',
        address: '5032 Forbes Ave, Pittsburgh, PA 15213',
        distanceFromCampus: 'Main Campus Loop (0 min walk)',
        description: 'Main campus bus stop for Pittsburgh Regional Transit (Routes 61A, 61B, 61C, 61D) and CMU Escort shuttle staging circle.',
        tags: ['PRT 61 Routes', 'Forbes Bus Stop', 'CMU Shuttle', 'Safe Pickup'],
        mapsQuery: 'Cohon University Center Forbes Ave Pittsburgh PA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Cohon+University+Center+Forbes+Ave+Pittsburgh+PA',
        coordinates: { lat: 40.4435, lng: -79.9419 }
      },
      {
        id: 'cmu_loc_2',
        title: 'Squirrel Hill (Forbes & Murray Avenues)',
        category: 'pg',
        address: 'Forbes Ave & Murray Ave, Squirrel Hill, Pittsburgh, PA 15217',
        distanceFromCampus: '1.2 miles east (Direct 61 bus / 6 min ride)',
        description: 'The premier student neighborhood for CMU scholars. Safe residential streets, Asian eateries, kosher bakeries, movie theater, and direct buses.',
        typicalRent: '$750 – $1,250 / month',
        tags: ['Squirrel Hill', 'Safe Streets', 'Asian Eateries', 'Direct 61 Bus'],
        mapsQuery: 'Forbes Ave Murray Ave Squirrel Hill Pittsburgh PA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Forbes+Ave+Murray+Ave+Squirrel+Hill+Pittsburgh+PA',
        coordinates: { lat: 40.4382, lng: -79.9234 }
      },
      {
        id: 'cmu_loc_3',
        title: 'Shadyside Residential District (Walnut & Ellsworth)',
        category: 'pg',
        address: 'Walnut St & Ellsworth Ave, Shadyside, Pittsburgh, PA 15232',
        distanceFromCampus: '1.0 mile north (12 min walk / CMU Shuttle)',
        description: 'Charming historic tree-lined street featuring renovated brick student apartments, grocery stores (Giant Eagle, Trader Joe\'s), and boutique cafes.',
        typicalRent: '$850 – $1,400 / month',
        tags: ['Shadyside', 'Trader Joes', 'CMU Shuttle', 'Historic Flats'],
        mapsQuery: 'Walnut St Ellsworth Ave Shadyside Pittsburgh PA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Walnut+St+Ellsworth+Ave+Shadyside+Pittsburgh+PA',
        coordinates: { lat: 40.4515, lng: -79.9332 }
      },
      {
        id: 'cmu_loc_4',
        title: 'South Craig Street Student Corridor',
        category: 'roommate',
        address: 'S Craig St at Forbes Ave, Pittsburgh, PA 15213',
        distanceFromCampus: 'Adjacent to west campus border (4 min walk)',
        description: 'Classic collegiate cafe street connecting CMU and Pitt. Perfect neutral hub for meeting prospective flatmates and studying.',
        tags: ['Coffee Shops', 'Craig Street', 'Roommate Chat', 'Campus Border'],
        mapsQuery: 'South Craig St Pittsburgh PA',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=South+Craig+St+Pittsburgh+PA',
        coordinates: { lat: 40.4449, lng: -79.9485 }
      }
    ]
  }
};

/**
 * Normalizes user college string or campus ID to find corresponding verified campus locations.
 */
export function getCollegeLocations(
  collegeName?: string,
  campusId?: string
): CollegeLocationsRegistry {
  const normCollege = (collegeName || '').toLowerCase().trim();
  const normCampus = (campusId || '').toLowerCase().replace('campus_', '').trim();

  // Match key directly
  if (CAMPUS_LOCATIONS_DATABASE[normCampus]) {
    return CAMPUS_LOCATIONS_DATABASE[normCampus];
  }

  // Check by college name keywords
  if (normCollege.includes('delhi') || normCollege.includes('iitd') || normCampus.includes('iitd')) {
    return CAMPUS_LOCATIONS_DATABASE.iitd;
  }
  if (normCollege.includes('stanford') || normCampus.includes('stanford')) {
    return CAMPUS_LOCATIONS_DATABASE.stanford;
  }
  if (normCollege.includes('berkeley') || normCollege.includes('cal') || normCampus.includes('berkeley')) {
    return CAMPUS_LOCATIONS_DATABASE.berkeley;
  }
  if (normCollege.includes('mit') || normCollege.includes('massachusetts') || normCampus.includes('mit')) {
    return CAMPUS_LOCATIONS_DATABASE.mit;
  }
  if (normCollege.includes('cmu') || normCollege.includes('carnegie') || normCollege.includes('mellon') || normCampus.includes('cmu')) {
    return CAMPUS_LOCATIONS_DATABASE.cmu;
  }

  // Dynamic Generator for any other custom college name provided by user
  const effectiveName = collegeName?.trim() || 'University Campus';
  return {
    collegeName: effectiveName,
    shortName: effectiveName.split(' ')[0] || 'Campus',
    city: 'Campus City',
    state: '',
    country: '',
    currency: '₹',
    centerCoordinates: { lat: 28.545, lng: 77.1926 },
    locations: [
      {
        id: `custom_loc_1`,
        title: `${effectiveName} Main Gate & Transit Turnaround`,
        category: 'carpool',
        address: `Main Entrance Boulevard, ${effectiveName}`,
        distanceFromCampus: 'Campus Perimeter (0 min walk)',
        description: `Official campus vehicle entrance, passenger loading zone, and prime rideshare meetup location for ${effectiveName} students.`,
        tags: ['Carpool Hub', 'Main Gate', 'Passenger Pickup', 'Safe Meetup'],
        mapsQuery: `${effectiveName} Main Gate Transit`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${effectiveName} Main Gate Transit Hub`)}`
      },
      {
        id: `custom_loc_2`,
        title: `Student PG Accommodations & Flats near ${effectiveName}`,
        category: 'pg',
        address: `Student Housing Corridor within 1 mile of ${effectiveName}`,
        distanceFromCampus: '0.5 – 1.2 miles from Campus (5–12 min walk)',
        description: `Verified student PG lodgings, shared 2BHK/3BHK apartments, and private hostel beds with study amenities near ${effectiveName}.`,
        typicalRent: '₹6,500 – ₹12,000 / month',
        tags: ['Student PGs', 'Walk to Campus', 'Shared Flats', 'Furnished Rooms'],
        mapsQuery: `Student PG Housing near ${effectiveName}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Student PG Housing near ${effectiveName}`)}`
      },
      {
        id: `custom_loc_3`,
        title: `${effectiveName} Student Center & Housing Bulletin`,
        category: 'roommate',
        address: `Central Campus Plaza, ${effectiveName}`,
        distanceFromCampus: 'Center of Campus',
        description: `Central hub for meeting potential flatmates, checking local lease bulletin boards, and coordinating shared commutes.`,
        tags: ['Roommate Meeting', 'Student Union', 'Campus Bulletin', 'Central Plaza'],
        mapsQuery: `${effectiveName} Student Union Center`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${effectiveName} Student Center`)}`
      },
      {
        id: `custom_loc_4`,
        title: `Popular Student Cafes & Study Corridor near ${effectiveName}`,
        category: 'roommate',
        address: `University Commercial Road, adjacent to ${effectiveName}`,
        distanceFromCampus: '3–5 min walk from campus gates',
        description: `Bustling street with study-friendly cafes, bakeries, and fast-casual dining for meeting roommates before signing agreements.`,
        tags: ['Student Cafes', 'Study Spots', 'Roommate Chat', 'Wi-Fi Hub'],
        mapsQuery: `Student Cafes near ${effectiveName}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Student Cafes near ${effectiveName}`)}`
      }
    ]
  };
}
