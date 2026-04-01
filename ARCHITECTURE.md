# Application Architecture

## 🏛️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│                   http://localhost:5173                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vite Dev Server                           │
│                    (Development Only)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Proxy /api/*
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express Backend Server                      │
│                   http://localhost:3000                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes                                               │  │
│  │  - /api/auth/*  (Login, Register, Logout, Me)       │  │
│  │  - /api/genome/* (CRUD + Pagination)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Middleware                                           │  │
│  │  - CORS                                              │  │
│  │  - JSON Parser                                       │  │
│  │  - Cookie Parser                                     │  │
│  │  - JWT Authentication                                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│            docker: postgres:16 (port 5432)                  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   User       │  │ GenomeData   │                        │
│  ├──────────────┤  ├──────────────┤                        │
│  │ id           │  │ id           │                        │
│  │ email        │  │ name         │                        │
│  │ password     │  │ assembly     │                        │
│  │ name         │  │ description  │                        │
│  │ createdAt    │  │ userId       │                        │
│  │ updatedAt    │  │ createdAt    │                        │
│  └──────────────┘  │ updatedAt    │                        │
│                    └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Frontend Architecture (React)

```
┌──────────────────────────────────────────────────────────────┐
│                         App.tsx                               │
│                   (Root Component)                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  QueryClientProvider (React Query)                     │  │
│  │  └── AuthProvider (Auth Context)                       │  │
│  │      └── BrowserRouter (React Router)                  │  │
│  │          └── Routes                                    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  Public      │ │  Protected   │ │  Protected   │
    │  Route       │ │  Route       │ │  Route       │
    ├──────────────┤ ├──────────────┤ ├──────────────┤
    │ /login       │ │ /dashboard   │ │ /jbrowse     │
    │              │ │              │ │              │
    │ LoginPage    │ │ Layout       │ │ Layout       │
    │              │ │ └─Dashboard  │ │ └─JBrowse    │
    └──────────────┘ └──────────────┘ └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Protected   │
                     │  Route       │
                     ├──────────────┤
                     │ /data        │
                     │              │
                     │ Layout       │
                     │ └─DataPage   │
                     └──────────────┘
```

## 🗂️ Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── BrowserRouter
│       └── Routes
│           ├── LoginPage
│           │   ├── Card
│           │   │   ├── CardHeader
│           │   │   │   ├── CardTitle
│           │   │   │   └── CardDescription
│           │   │   └── CardContent
│           │   │       ├── Input
│           │   │       ├── Label
│           │   │       └── Button
│           │
│           ├── ProtectedRoute
│           │   └── DashboardPage
│           │       └── Layout
│           │           ├── Header (Navigation)
│           │           └── Main
│           │               └── Cards (Stats)
│           │
│           ├── ProtectedRoute
│           │   └── JBrowsePage
│           │       └── Layout
│           │           └── JBrowseLinearGenomeView
│           │
│           └── ProtectedRoute
│               └── DataPage
│                   └── Layout
│                       ├── Cards (Data List)
│                       └── Pagination
```

## 🔄 Data Flow Architecture

### Authentication Flow
```
User Action (Login/Register)
    │
    ▼
LoginPage Component
    │
    ▼
useAuth Hook (AuthContext)
    │
    ▼
API Client (axios)
    │
    ▼
Express Route (/api/auth/login)
    │
    ├── Validate Credentials
    ├── Generate JWT Token
    └── Send Response
    │
    ▼
Store Token (localStorage + Cookie)
    │
    ▼
Update Auth Context State
    │
    ▼
Redirect to Dashboard
```

### Data Fetching Flow (React Query)
```
Component Mount
    │
    ▼
useQuery Hook
    │
    ├── Check Cache
    │   └── Return if fresh
    │
    ▼
API Client Function
    │
    ├── Add JWT Token (Interceptor)
    └── Make Request
    │
    ▼
Express Route (with auth middleware)
    │
    ▼
Prisma Query (Database)
    │
    ▼
Return Data
    │
    ▼
Cache in React Query
    │
    ▼
Update Component
```

## 📦 Module Organization

```
src/
│
├── api/                    # API Client Layer
│   ├── auth.ts            # Auth API functions
│   └── genome.ts          # Genome API functions
│
├── components/
│   ├── common/            # Shared Components
│   │   ├── Pagination     # Reusable pagination
│   │   └── ProtectedRoute # Auth guard
│   │
│   ├── layout/            # Layout Components
│   │   └── Layout         # Main app layout
│   │
│   └── ui/                # UI Components (shadcn)
│       ├── button
│       ├── card
│       ├── input
│       └── label
│
├── contexts/              # React Context
│   └── AuthContext        # Global auth state
│
├── hooks/                 # Custom Hooks
│   └── (future: useGenome, usePagination, etc.)
│
├── lib/                   # Utilities
│   ├── axios.ts          # Configured axios
│   └── utils.ts          # Helper functions
│
├── pages/                 # Page Components
│   ├── DashboardPage
│   ├── DataPage
│   ├── JBrowsePage
│   └── LoginPage
│
└── types/                 # TypeScript Types
    └── index.ts          # All interfaces
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────┐
│           Client Browser                     │
├─────────────────────────────────────────────┤
│  1. Login Form                              │
│  2. Submit email + password                 │
└─────────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────┐
│         Backend (Express)                    │
├─────────────────────────────────────────────┤
│  1. Receive credentials                     │
│  2. Hash password check (bcrypt)            │
│  3. Generate JWT token                      │
│  4. Set httpOnly cookie                     │
│  5. Return token + user data                │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           Client Storage                     │
├─────────────────────────────────────────────┤
│  • localStorage: token                      │
│  • Cookie: token (httpOnly)                 │
│  • AuthContext: user object                 │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      Subsequent Requests                     │
├─────────────────────────────────────────────┤
│  • Axios Interceptor adds token             │
│  • Header: Authorization: Bearer <token>    │
│  • Backend verifies JWT                     │
│  • Access granted/denied                    │
└─────────────────────────────────────────────┘
```

## 🎨 UI Component Architecture (shadcn)

```
Tailwind CSS (Utility Classes)
        │
        ▼
shadcn/ui Base Components
        │
        ├── Radix UI Primitives (Accessible)
        │   ├── Dialog
        │   ├── Label
        │   ├── Select
        │   └── Slot
        │
        ├── CVA (Variants)
        │   └── Button variants
        │       ├── default
        │       ├── outline
        │       ├── ghost
        │       └── destructive
        │
        └── Custom Styling
            └── Tailwind classes
                ├── Colors (CSS variables)
                ├── Spacing
                ├── Typography
                └── Animations
```

## 🗄️ State Management Strategy

```
┌──────────────────────────────────────────────┐
│        Global State (Context API)            │
│  • Auth State (user, login, logout)         │
│  • Available everywhere via useAuth()       │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│      Server State (React Query)              │
│  • Genome data                               │
│  • Automatic caching                         │
│  • Background refetching                     │
│  • Optimistic updates                        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│        Local State (useState)                │
│  • Form inputs                               │
│  • UI toggles                                │
│  • Page-specific data                        │
└──────────────────────────────────────────────┘
```

## 🌐 Routing Structure

```
/                        → Navigate to /dashboard
│
├── /login               → LoginPage (Public)
│
└── /dashboard           → DashboardPage (Protected)
    │                      └── Stats, Quick Actions
    │
    ├── /jbrowse         → JBrowsePage (Protected)
    │                      └── Interactive Genome Browser
    │
    └── /data            → DataPage (Protected)
                           └── Paginated Data List
```

## 🔌 API Endpoint Architecture

```
/api
├── /auth
│   ├── POST   /register      → Create user
│   ├── POST   /login         → Authenticate
│   ├── POST   /logout        → Clear session
│   └── GET    /me            → Get current user
│
└── /genome
    ├── GET    /              → List (paginated)
    ├── GET    /:id           → Get by ID
    └── POST   /              → Create (auth required)
```

## 🧩 Technology Stack Layers

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                 │
│  React + TypeScript + Tailwind CSS          │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│         State Management Layer               │
│  Context API + React Query                  │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│          Data Access Layer                   │
│  Axios (HTTP Client) + API Functions        │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│          API/Backend Layer                   │
│  Express + JWT + Routes                     │
└─────────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────────┐
│          Database Layer                      │
│  Prisma ORM + PostgreSQL                    │
└─────────────────────────────────────────────┘
```

---

This architecture follows React component-based best practices with:
- Clear separation of concerns
- Type safety throughout
- Reusable components
- Scalable folder structure
- Security best practices
