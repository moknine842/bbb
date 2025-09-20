# Overview

Secret Missions is a multiplayer deception game where players receive secret missions and must complete them without being discovered while trying to identify other players' missions. The application supports both local (shared device) and online multiplayer gameplay with real-time communication, mission management, and accusation systems. Players can create or join rooms, submit missions for other players, and engage in strategic gameplay involving deduction and stealth.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **Routing**: Wouter for client-side routing with dedicated pages for home, setup, lobby, gameplay, and results
- **State Management**: TanStack Query for server state management and caching with optimistic updates
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Real-time Communication**: Custom WebSocket hooks for live game updates, player interactions, and room synchronization

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **API Design**: RESTful endpoints for room/player management with WebSocket server for real-time features
- **Storage Layer**: Abstracted storage interface supporting both in-memory (development) and PostgreSQL (production) backends
- **Session Management**: WebSocket-based player sessions with room-based message broadcasting
- **Game Logic**: Centralized game state management with mission assignment, accusation handling, and elimination mechanics

## Data Architecture
- **Schema Definition**: Shared TypeScript schemas using Drizzle ORM with Zod validation for type safety
- **Database**: PostgreSQL with Drizzle migrations for schema management and Neon serverless integration
- **Data Models**: Rooms, Players, Missions, Accusations, and GameState entities with proper relationships and constraints
- **Storage Abstraction**: Interface-based storage layer allowing seamless switching between in-memory and database backends

## Real-time Features
- **WebSocket Integration**: Dedicated WebSocket server for live game events (player joins, accusations, timer updates, game state changes)
- **Game State Synchronization**: Centralized game state management with real-time updates to all connected clients
- **Reconnection Logic**: Automatic WebSocket reconnection with exponential backoff for reliability
- **Message Broadcasting**: Room-based message distribution for game events and player interactions

## Development Environment
- **Build System**: Vite for frontend bundling with ESBuild for server compilation and hot module replacement
- **Development Tools**: Replit-specific plugins for debugging, development banner, and cartographer integration
- **Type Safety**: Full TypeScript coverage with shared types between client and server, path aliases for clean imports
- **Hot Reload**: Vite HMR for frontend development and tsx for backend development with automatic restart

# External Dependencies

## Core Frameworks
- **React**: Frontend UI library with hooks, functional components, and modern React patterns
- **Express.js**: Backend web server framework for REST API and static file serving
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL dialect support and migration management

## Database & Storage
- **PostgreSQL**: Primary database via Neon serverless (@neondatabase/serverless) for production
- **In-memory Storage**: Fallback storage implementation for development and testing environments

## UI Components & Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and responsive design
- **Shadcn/ui**: Pre-built component library combining Radix UI and Tailwind CSS with consistent styling

## Real-time & Networking
- **WebSocket (ws)**: Native WebSocket implementation for real-time bidirectional communication
- **TanStack Query**: Server state management, caching, and synchronization with automatic refetching

## Development & Build Tools
- **Vite**: Fast build tool and development server with hot module replacement
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production server builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins