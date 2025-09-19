# Overview

Secret Missions is a multiplayer deception game where players receive secret missions and must complete them without being discovered while trying to identify other players' missions. The application supports both local (shared device) and online multiplayer modes with real-time WebSocket communication. Built as a full-stack web application using React, Express, and PostgreSQL.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **Routing**: Wouter for client-side routing with dedicated pages for home, setup, lobby, gameplay, and results
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Real-time Communication**: WebSocket hooks for live game updates and player interactions

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **API Design**: RESTful endpoints for room/player management with WebSocket server for real-time features
- **Storage Layer**: Abstracted storage interface supporting both in-memory (development) and PostgreSQL (production) backends
- **Session Management**: WebSocket-based player sessions with room-based message broadcasting

## Data Architecture
- **Schema Definition**: Shared TypeScript schemas using Drizzle ORM with Zod validation
- **Database**: PostgreSQL with Drizzle migrations for schema management
- **Data Models**: Rooms, Players, Missions, Accusations, and GameState entities with proper relationships

## Real-time Features
- **WebSocket Integration**: Dedicated WebSocket server for live game events (player joins, accusations, timer updates)
- **Game State Synchronization**: Centralized game state management with real-time updates to all connected clients
- **Reconnection Logic**: Automatic WebSocket reconnection with exponential backoff for reliability

## Development Environment
- **Build System**: Vite for frontend bundling with ESBuild for server compilation
- **Development Tools**: Replit-specific plugins for debugging and development banner
- **Type Safety**: Full TypeScript coverage with shared types between client and server
- **Hot Reload**: Vite HMR for frontend and tsx for backend development

# External Dependencies

## Core Frameworks
- **React**: Frontend UI library with hooks and functional components
- **Express.js**: Backend web server framework for REST API and static file serving
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect support

## Database & Storage
- **PostgreSQL**: Primary database via Neon serverless for production
- **In-memory Storage**: Fallback storage implementation for development/testing

## UI & Styling
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Icon library for consistent UI elements

## Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time game features
- **TanStack Query**: Server state management with caching and synchronization

## Development Tools
- **Vite**: Frontend build tool with development server and HMR
- **TypeScript**: Static type checking across the entire codebase
- **Replit Plugins**: Development environment enhancements for debugging and runtime error handling