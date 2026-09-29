# Product Requirement Document (PRD)
## Project Name: StudentConnect (Campus-Locked Student Intranet & Resource Network)
**Version:** 2.0  
**Status:** Approved / Production Build  
**Target Audience:** University Students, Campus Administrators, Academic Tutors, Student Commuters  

---

## 1. Executive Summary & Vision

**StudentConnect** is a unified, campus-locked peer-to-peer web application designed to solve fragmented student logistics, housing uncertainty, study collaboration, and transportation across universities. 

Unlike public marketplaces (Craigslist, Facebook Groups, generic classifieds) that suffer from spam, ghosting, unverified identities, and safety risks, StudentConnect mandates **institutional email domain verification** (e.g., `stanford.edu`, `berkeley.edu`, `iitd.ac.in`) alongside student ID card auditing. It creates a verified intranet where students safely share carpool rides, rent hardware, trade course notes, find compatible roommates, discover verified off-campus PG accommodations, book peer tutoring with escrow payments, and navigate campus resources using **Google Maps Data and Gemini AI Maps Grounding**.

---

## 2. Problem Statement & Solution

| Problem Faced by Students | StudentConnect Solution |
| :--- | :--- |
| **High Commute Costs & Fragmented Rides**: Daily commutes and airport runs cost $40–$100; disorganized WhatsApp groups lead to missed pickups and safety concerns. | **Verified Student Carpooling**: Fixed per-seat cost sharing, automated fuel split calculators, designated campus pickup hubs, and live Google Maps routes. |
| **Housing Scams & Lack of Roommate Alignment**: Predatory landlords, bait-and-switch PG rents, and lifestyle incompatibilities (sleep schedules, study habits, diet). | **Verified PG Listings & AI Roommate Matching**: Distance/rent sliders, verified landlord tags, Leaflet & Google Maps spatial visualization, and algorithmic roommate compatibility scoring. |
| **Academic Notes & Hardware Waste**: Specialized textbooks, lab equipment (Arduinos, cameras, graphing calculators) sit idle while other students pay exorbitant retail prices. | **P2P Equipment Rental & Notes Repository**: Built-in security deposits, escrow holding, and previewable peer-reviewed notes categorized by course and department. |
| **Unreliable Tutoring & Payment Disputes**: Freelance tutoring often suffers from late cancellations, payment defaults, or awkward renegotiation. | **Escrow-Backed Peer Tutoring & Video Rooms**: Funds held in milestone escrow, integrated video study rooms, and review-verified ratings. |
| **Identity Fraud & Anonymous Harassment**: Trolls and scammers on open platforms. | **Campus-Locked Intranet**: Mandatory university email domain checks, ID card uploads, admin review workflows, and campus role enforcement. |

---

## 3. User Personas

1. **The Daily Commuter (Alex)**: Commutes 15 miles daily to campus. Wants to offset fuel costs by offering 3 empty seats in his car, picking up verified classmates at safe campus transit loops.
2. **The New / Relocating Student (Priya)**: Moving to a new city for graduate studies. Needs a safe PG within 2 miles of campus under $1,200/mo and a female non-smoker flatmate with a compatible quiet study schedule.
3. **The Academic Achiever / Tutor (David)**: Senior CS student who excels in Algorithms. Wants to earn flexible income tutoring juniors while ensuring payment is guaranteed via escrow.
4. **The Project Builder (Elena)**: Electrical Engineering sophomore needing an oscilloscope and DSLR camera for a 48-hour hackathon project without purchasing expensive hardware.
5. **The Campus Administrator (Prof. Miller)**: Oversees safety, audits student ID submissions, and resolves reported disputes or flagged listings.

---

## 4. Complete Technology Stack

### 4.1 Frontend Architecture
* **Framework:** React 18 with TypeScript (`.tsx`)
* **Build System & Dev Server:** Vite with fast module bundling
* **Styling & UI:** Tailwind CSS with modern design tokens (high-contrast neutrals, subtle dividers, WCAG AA legibility)
* **Iconography:** `lucide-react`
* **Geospatial & Mapping:** 
  * Leaflet.js (`leaflet`, `react-leaflet`, OpenStreetMap tiles) for in-app interactive map views
  * Google Maps Platform (Directions API, Place Search, Geo Links)
* **Realtime Client:** `socket.io-client` for multi-room instant messaging and presence
* **Media & RTC:** Browser MediaStream & WebRTC API for peer tutoring video sessions
* **Animations & Transitions:** `motion` (Framer Motion)

### 4.2 Backend Architecture
* **Server Runtime:** Node.js (ESM execution via `tsx` in development, bundled with `esbuild` to `dist/server.cjs` for production)
* **HTTP Framework:** Express.js (v4/v5 routing, REST API controllers, structured middleware)
* **Realtime Engine:** `Socket.io` server attached to HTTP server instance (handling dual-event topologies: `joinRoom`/`join_room`, `sendMessage`/`send_message`, room broadcasting)
* **Authentication & Cryptography:** 
  * JSON Web Tokens (`jsonwebtoken`) with institutional domain validation
  * `bcryptjs` password hashing
  * Role-based Access Control (RBAC: `student`, `admin`)
* **Data Storage:** Structured In-Memory Relational Document Store with sample persistence across users, rides, notes, equipment, tutors, study groups, roommates, listings, and wallet transactions (schema-ready for Firestore or Cloud SQL).

### 4.3 Artificial Intelligence & Google Maps Grounding
* **SDK:** `@google/genai` (Google Gen AI TypeScript SDK)
* **Model:** `gemini-3.8-flash`
* **Capability:** Server-side Gemini API with **Google Maps Grounding tool** (`tools: [{ googleMaps: {} }]`)
* **Prompt Engineering:** Specialized system instructions acting as a localized Campus Logistics & Navigation Advisor. Extracts places, review snippets, street addresses, and verified Google Maps navigation links.

---

## 5. Detailed Feature Specifications

### 5.1 Module 1: Campus Identity & Verification Intranet
* **Institutional Domain Locking**: Matches user registration emails against supported university domains (`@stanford.edu`, `@berkeley.edu`, `@mit.edu`, `@iitd.ac.in`, `@cmu.edu`).
* **Student ID Audit Pipeline**: Students upload official student identity cards. Admins approve/reject cards via an Admin Console. Verified users receive a green "Verified Student" badge.
* **Cross-Campus Transparency**: Displays user's university badge on all listings, rides, and messages for transparent cross-campus collaboration.

### 5.2 Module 2: Smart Carpooling & Commute Hub
* **Ride Scheduling & Publishing**: Drivers post departure, destination, vehicle type (Car, Scooty, Bike), vehicle model, date/time, total seats, and price per seat.
* **Designated Campus Pickup Points**: Integrated Google Maps transit loop chips (e.g., Student Union Circle, North Gate Turnaround, Caltrain / Metro Interchange).
* **Automated Fuel Split Calculator**: In-app calculator estimating per-person savings vs. commercial rideshare services.
* **Seat Booking Workflow**: Passengers request seats; drivers accept or decline; seats automatically decrement upon confirmation.
* **Direct Google Maps Navigation**: Every ride card includes a 1-click Google Maps Directions route link pre-populated with origin and destination waypoints.

### 5.3 Module 3: Peer-to-Peer Academic Notes Repository
* **Course & Branch Tagging**: Filter notes by department (CS, EE, Mechanical, Bio, Business) and course codes.
* **Interactive Document Preview**: In-app previewer with page count, subject difficulty rating, and file type indicators.
* **Peer Reviews & Ratings**: 5-star rating system with student testimonials.
* **Direct Author Inquiry**: 1-click chat initiation with note uploaders for study discussions.

### 5.4 Module 4: Hardware & Equipment Rental with Escrow
* **Item Catalog**: Laptops, Lab Kits, DSLRs, Microcontrollers, Graphing Calculators, Projectors.
* **Security Deposit Protection**: Item listing defines daily rental price + mandatory security deposit held safely in campus escrow.
* **Condition Verification**: Condition ratings (Like New, Good, Fair) with photo inspection modals.

### 5.5 Module 5: 1-on-1 Peer Tutoring & Live Video Rooms
* **Verified Tutor Profiles**: Hourly rates, subjects mastered, verified GPA/grades, and accumulated tutoring hours.
* **Milestone Escrow Booking**: Students book sessions with funds deposited into escrow; funds are released to the tutor only after session completion.
* **Built-in Virtual Video Call Room**: Embedded WebRTC audio/video call interface with mic/camera toggles and live collaborative notepad.

### 5.6 Module 6: Collaborative Study Groups
* **Group Discovery**: Filter by subject, upcoming exam, or project team.
* **Meeting Schedules & Locations**: Physical campus library rooms or virtual room links with seat capacity tracking.
* **Instant Group Chat**: Dedicated group discussion rooms for all active members.

### 5.7 Module 7: AI Roommate Compatibility Matcher
* **Lifestyle Preference Matrix**: 
  * Sleep Schedule (Early Bird vs. Night Owl)
  * Cleanliness Rating (Extremely Clean, Moderate, Relaxed)
  * Dietary Preference (Vegetarian, Non-Vegetarian, Any)
  * Smoking Tolerance (Non-Smoker, Smoker, Flexible)
  * Study Habits (Quiet Study, Background Music, Group Study)
  * Budget range min/max
* **Algorithmic Compatibility Score (0–100%)**: Dynamic percentage score calculated across all mutual criteria with breakdown inspection modals.
* **Google Maps Neighborhood Hub**: Direct Google Maps neighborhood searches around campus (e.g., College Terrace, Medical Center, Downtown).
* **Direct Roommate Chat**: Instant in-app messaging between prospective flatmates.

### 5.8 Module 8: Verified PG Listings & Student Flats
* **Multi-View Exploration**: Toggle between Responsive Card Grid and Interactive Leaflet Campus Map with custom pins.
* **Granular Filtering**: Price range sliders ($500–$4,000/mo), distance to campus slider (0–10 km), property types (PG, Flat, Studio, Hostel), and gender preferences (Boys, Girls, Any).
* **Google Maps Street & Neighborhood Links**: 1-click link on every property to view exact coordinates, street view, and nearby amenities on Google Maps.
* **Landlord Direct Chat & Reviews**: Verified landlord contact details, verified student review submission with ratings.

### 5.9 Module 9: Real-time Multi-Room Chat System
* **WebSocket Integration**: Instant delivery via Socket.io with room isolation (`ride_{id}`, `listing_{id}`, `roommate_{id}`, `tutoring_{id}`).
* **Optimistic UI Updates**: Immediate message appearance with delivery status indicators.
* **Quick Response Pills**: Contextual pre-composed student replies ("Is this seat still open?", "Can we schedule a 15-min tour?", "What's your quiet hours policy?").
* **Presence & Unread Indicators**: Real-time message count badges and conversation history persistence.

### 5.10 Module 10: Gemini AI Campus Advisor (`gemini-3.8-flash`)
* **Multi-Turn Chat Thread**: Scrollable conversational dialog maintaining contextual memory across user queries.
* **Google Maps Grounding**: Grounded with live Google Maps API places, business addresses, operating hours, and verified URLs.
* **Specialized Domain Navigation**: Dedicated pills for Carpooling transit points, PG rent benchmarks, and roommate neighborhood insights.

### 5.11 Module 11: Campus Wallet & Escrow Payment Engine
* **Digital Campus Balance**: Available balance, locked escrow balance, and complete transaction ledger.
* **Escrow Lifecycle**: `Held in Escrow` -> `Verified & Released` or `Disputed & Refunded`.
* **Zero-Commission Student Transfers**: Instant wallet-to-wallet settlements for shared rides, rentals, and tutoring.

### 5.12 Module 12: Admin Moderation & Dispute Center
* **ID Verification Queue**: Review submitted student documents, approve verification badges, or decline with feedback.
* **Listing Moderation**: Flag, remove, or verify housing listings, equipment posts, and ride offers.
* **Escrow Dispute Arbitration**: Administrative override to release or refund contested escrow funds.

---

## 6. Architecture & Data Flow Diagram

```
+-------------------------------------------------------------------------+
|                              CLIENT (BROWSER)                           |
|  React 18 + TypeScript + Tailwind CSS + Lucide Icons + Leaflet Maps     |
|                                                                         |
|  [CarpoolView]   [PGListingsView]   [RoommateView]   [TutoringView]     |
|         |                |                 |                |           |
|  [ChatModal (Socket.io)]     [GeminiMapsAssistantModal (AI Advisor)]     |
+------------------------------------+------------------------------------+
                                     | (REST API / JSON & WebSockets)
                                     v
+-------------------------------------------------------------------------+
|                        EXPRESS APPLICATION SERVER                       |
|  (Node.js runtime / tsx dev / bundled dist/server.cjs in production)    |
|                                                                         |
|  [Auth Middleware & RBAC]        [Socket.io Realtime Server]            |
|  [Rides Controller]              [Chat Controller & Broadcaster]        |
|  [Housing Controller]            [Escrow & Wallet Controller]           |
|  [Roommates Controller]          [Gemini Controller (Maps Grounding)]   |
+--------------------+-------------------------------+--------------------+
                     |                               |
                     v                               v
    +---------------------------------+  +-------------------------------+
    |   IN-MEMORY / FIRESTORE DB      |  |  GOOGLE GEN AI SDK            |
    |  - Users, Badges, Balances      |  |  - gemini-3.8-flash           |
    |  - Rides & Passengers           |  |  - tools: [{ googleMaps: {} }]|
    |  - PG Listings & Reviews        |  |  - Live Maps Grounding Chunks |
    |  - Roommate Preference Matrices |  +-------------------------------+
    |  - Chat Messages History        |
    +---------------------------------+
```

---

## 7. Security, Privacy & Safety Standards

1. **Anti-Harassment & Shielding**: No personal phone numbers or external emails are exposed without user consent; all initial interactions occur within the verified in-app chat.
2. **Financial Safeguards**: Security deposits and tutoring fees are never transferred directly to counter-parties upfront; funds remain locked in escrow until verified.
3. **Session Security**: Authenticated sessions utilize stateless JSON Web Tokens stored with appropriate expiration and role validation.
4. **Environment Secrets**: API keys (`GEMINI_API_KEY`, etc.) remain strictly server-side and are never exposed to browser bundles.

---

## 8. Non-Functional Requirements (NFRs)

* **Performance**: Sub-100ms API response times for local queries; sub-1.5s multi-turn responses with Google Maps grounding.
* **Responsiveness**: Desktop-first precision with mobile-first adaptive UI (touch targets >= 44px, full container responsiveness).
* **Accessibility**: WCAG AA compliance with high-contrast text ratios (>= 4.5:1 for body text) and semantic HTML identifiers.
* **Reliability**: Dual-event socket architecture ensuring zero message drops during reconnects or room switches.

---

## 9. Future Roadmap

* **Phase 2.1**: Native mobile push notifications (PWA Service Workers / Firebase Cloud Messaging) for instant ride arrival alerts.
* **Phase 2.2**: Integration with official campus LMS (Canvas / Blackboard) for automatic grade-verified tutor credentials.
* **Phase 2.3**: Direct split-fare bank settlements via UPI / Stripe Connect.
* **Phase 2.4**: Autonomous Gemini Carpool Route Clustering (combining multiple single-passenger requests along common highway corridors).
