# JBrowse 2 Application

A full-stack genomic data visualization application built with React, TypeScript, Vite, Express, and JBrowse 2.

## Features

- 🔐 **Authentication**: Secure login and registration system with JWT
- 📊 **Dashboard**: Overview of genome assemblies and data analysis
- 🧬 **JBrowse 2**: Interactive genome browser with GRCh38 human genome
- 📁 **Data Management**: Browse genome datasets with pagination
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- 🔍 **React Query**: Efficient data fetching and caching
- 🗄️ **Prisma ORM**: Type-safe database access with SQLite

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- TanStack Query (React Query) for data fetching
- Axios for HTTP requests
- Tailwind CSS for styling
- shadcn/ui for UI components
- JBrowse 2 React Linear Genome View

### Backend
- Express.js with TypeScript
- Prisma ORM with SQLite
- JWT authentication
- bcryptjs for password hashing

## Project Structure

```
senior/
├── prisma/
│   └── schema.prisma          # Database schema
├── server/
│   ├── index.ts               # Express server entry
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   └── routes/
│       ├── auth.ts            # Auth routes (login, register)
│       └── genome.ts          # Genome data routes
├── src/
│   ├── api/                   # API client functions
│   │   ├── auth.ts
│   │   └── genome.ts
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   │   ├── Pagination.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/            # Layout components
│   │   │   └── Layout.tsx
│   │   └── ui/                # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── axios.ts           # Axios configuration
│   │   └── utils.ts           # Utility functions
│   ├── pages/
│   │   ├── DashboardPage.tsx  # Dashboard view
│   │   ├── DataPage.tsx       # Data management page
│   │   ├── JBrowsePage.tsx    # JBrowse genome browser
│   │   └── LoginPage.tsx      # Login/Register page
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Main App component
│   ├── index.css              # Global styles
│   └── main.tsx               # Application entry point
├── .env                       # Environment variables
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```powershell
   npm install
   ```

2. **Set up the database**:
   ```powershell
   npm run prisma:generate
   npm run prisma:migrate
   ```

3. **Configure environment variables**:
   
   The `.env` file is already created with defaults:
   ```
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=3000
   ```

### Running the Application

1. **Start both frontend and backend** (recommended):
   ```powershell
   npm run dev
   ```

   This will start:
   - Frontend dev server at `http://localhost:5173`
   - Backend API server at `http://localhost:3000`

2. **Or run separately**:
   
   Frontend only:
   ```powershell
   npm run dev:client
   ```
   
   Backend only:
   ```powershell
   npm run dev:server
   ```

### Building for Production

```powershell
npm run build
```

## Usage

1. **Register a new account** or **Login** at `http://localhost:5173/login`

2. **Explore the Dashboard** to see overview statistics

3. **Browse JBrowse** at `/jbrowse` to view the interactive genome browser with:
   - Human genome GRCh38/hg38
   - NCBI RefSeq gene annotations
   - Navigate to any genomic region

4. **View Data** at `/data` to browse genome datasets with pagination

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Genome Data
- `GET /api/genome?page=1&limit=10` - Get paginated genome data
- `GET /api/genome/:id` - Get specific genome data
- `POST /api/genome` - Create new genome data

## Database Schema

### User Model
- id: Int (Primary Key)
- email: String (Unique)
- password: String (Hashed)
- name: String (Optional)
- createdAt: DateTime
- updatedAt: DateTime

### GenomeData Model
- id: Int (Primary Key)
- name: String
- assembly: String
- description: String (Optional)
- userId: Int
- createdAt: DateTime
- updatedAt: DateTime

## Component Architecture

This project follows React component-based best practices:

- **Separation of Concerns**: Components are organized by function (pages, layout, common, ui)
- **Type Safety**: Full TypeScript coverage with explicit interfaces
- **Reusability**: Shared UI components in `components/ui/`
- **Custom Hooks**: Auth logic encapsulated in `useAuth` hook
- **API Layer**: Separate API client functions for clean data fetching
- **Protected Routes**: Route guards for authenticated pages
- **Context API**: Global auth state management
- **React Query**: Server state management with caching

## Development Scripts

- `npm run dev` - Run both frontend and backend
- `npm run dev:client` - Run Vite dev server
- `npm run dev:server` - Run Express server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Technologies & Libraries

- **@jbrowse/react-linear-genome-view** - JBrowse 2 genome browser component
- **@tanstack/react-query** - Data fetching and state management
- **react-router-dom** - Client-side routing
- **axios** - HTTP client
- **tailwindcss** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **lucide-react** - Icon library
- **prisma** - Next-generation ORM
- **express** - Web framework for Node.js
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing

## License

MIT

## Author

Built with best practices for React component-based TypeScript development.
