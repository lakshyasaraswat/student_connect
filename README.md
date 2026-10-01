# StudentConnect

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

A verified multi-campus student intranet — carpooling, study notes, lab equipment rental, peer tutoring, study groups, roommate matching, PG/hostel listings, and assignment help — unified under one trusted platform with an in-app wallet and escrow system.

Built end-to-end in **TypeScript** on the **MERN** stack.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)`
- [Escrow System](#escrow-system)
- [Authentication](#authentication)

---

## Overview

Students today juggle a dozen fragmented tools — WhatsApp groups for rides, Google Drive for notes, random classifieds for housing, and cash for payments. There is no single trusted place where **verified peers** can transact.

**StudentConnect solves this** by requiring college identity verification (email domain + student ID + admin approval) and routing every paid transaction through an escrow ledger. Every user is a real, accountable student. Every rupee is tracked.

---

## Features

| Module | What it does |
|---|---|
| 🚗 **Carpooling** | Post rides, request seats, driver accepts/rejects passengers |
| 📚 **Study Notes** | Buy/sell lecture notes with escrow-backed purchases |
| 🔧 **Equipment Rental** | Rent calculators, cameras, lab kits with deposit escrow |
| 🎓 **Peer Tutoring** | Book 1-on-1 or group sessions with escrow-held payments |
| 👥 **Study Groups** | Public or private squads with permission-based joining |
| 🏠 **Roommate Matching** | Compatibility-scored roommate discovery |
| 🏡 **PG / Hostel Listings** | Verified rental listings with map coordinates |
| 📝 **Assignment Help** | Post bounties for assignment help, solvers submit solutions |
| 💰 **Wallet + Escrow** | In-app balance with held/released/refunded fund flow |
| 🔔 **Notifications** | Real-time in-app alerts for every interaction |
| 💬 **Chat** | Per-feature real-time messaging via Socket.io |
| 🛡️ **Admin Portal** | User verification, listing approval, escrow dispute resolution |
| 🗺️ **AI Maps Advisor** | Google Gemini-powered campus-grounded location queries |

---

## Tech Stack

### Frontend
- **React 19** — Component model with hooks
- **TypeScript** — Full type safety end-to-end
- **Vite 8** — Instant HMR, ESM-native build tool
- **Tailwind CSS 4** — Utility-first styling
- **Socket.io Client** — Real-time chat and notifications
- **Leaflet** — Interactive maps for listings and locations
- **Lucide React** — Icon library

### Backend
- **Node.js** — Runtime (via `tsx` in dev, bundled in prod)
- **Express 4** — HTTP framework
- **TypeScript (ESM)** — Types flow from models to HTTP responses
- **Socket.io Server** — Room-based real-time broadcasts
- **JWT (HS256)** — Custom token signing, no external auth lib
- **Google Gemini** (`@google/genai`) — AI Maps Advisor

### Database
- **MongoDB 7** — Document database
- **Mongoose 9** — ODM with schema validation, subdocuments, indexes

### Tooling
- **nodemon + tsx** — Dev server with hot reload
- **esbuild** — Production server bundler
- **MongoDB Compass** — Visual DB inspection

---

## Architecture

StudentConnect is a **layered monolith**. HTTP and WebSocket traffic share the same Express server and the same Mongoose models.





---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **MongoDB** 7 (local install or MongoDB Atlas)
- **npm** or **pnpm**

### Installation

```bash
# Clone the repo
git clone https://github.com/lakshyasaraswat/student_connect.git
cd student_connect

# Install dependencies
npm install

# Copy the environment template
cp .env.example .env
# Then edit .env with your MongoDB URI and JWT secret

Escrow System
Every paid transaction — tutoring sessions, equipment rentals, note purchases, assignment bounties — flows through a MongoDB-backed escrow ledger.

State Machine
   ┌────────┐  holdFunds()  ┌──────┐  releaseFunds()  ┌──────────┐
   │ Wallet │ ────────────► │ Held │ ───────────────► │ Released │
   └────────┘               └──┬───┘                  └──────────┘
                               │
                               │ refundFunds()
                               ▼
                          ┌──────────┐
                          │ Refunded │
                          └──────────┘

Authentication
JWT (HS256) signed with JWT_SECRET.

Token stored in sessionStorage — survives refresh, cleared on tab close.

Client-side 401 handling: any 401 response clears the token and dispatches a global auth:session-expired event. AuthContext listens for it and redirects to login.

Registration flow: college email → OTP → verify + upload ID → admin approval.



Real-Time Layer
Socket.io runs on the same HTTP server as Express and shares the same Mongoose models.

Rooms for chat: group_<groupId>, roommate_<postId>, listing_<listingId>, assignment_<assignmentId>

User channels for notifications: user_<userId>

Auto-reconnect with 5 attempts and 10s timeout

Deduplication by message id on the client to prevent double-renders