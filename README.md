# Hetzner Cloud Angular Dashboard

A modern, responsive web dashboard for managing Hetzner Cloud servers built with Angular 17+ and Tailwind CSS. This demo application showcases best practices for Angular development with a clean, professional UI inspired by Hetzner's design language.

![Dashboard Preview](https://img.shields.io/badge/Angular-17+-red?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🖥️ **Server Management**
- **Server List View**: Comprehensive server overview with card-based layout
- **Server Details**: Detailed view with hardware specifications and actions
- **Real-time Search**: Global search functionality in the top navigation
- **Status Filtering**: Filter servers by running, stopped, or all statuses
- **Country Flags**: Automatic country detection with emoji flags for server locations

### 🎨 **Modern UI/UX**
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Loading States**: Skeleton loading animations for better UX
- **Hover Effects**: Smooth transitions and interactive feedback
- **Professional Layout**: Clean sidebar navigation with collapsible menu

### 🔧 **Technical Features**
- **Modern Angular**: Built with Angular 17+ using standalone components
- **Signal-based State**: Reactive state management with Angular signals
- **TypeScript**: Strict typing throughout the application
- **Lazy Loading**: Route-based code splitting for optimal performance
- **Mock API**: Development-ready with mock data and fallback handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Angular CLI 17+

### Installation

```bash
# Clone the repository
git clone https://github.com/preston-jones/hcloud-angular-dashboard.git
cd hcloud-angular-dashboard

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200/`

### Development Commands

```bash
# Development server with hot reload
npm start

# Build for production
npm run build

# Run unit tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 📱 Application Structure

### **Core Architecture**
```
src/
├── app/
│   ├── core/                    # Core services and utilities
│   │   ├── hetzner-api.service  # API service with mock data support
│   │   ├── theme.service        # Dark/light theme management
│   │   └── auth.interceptor     # HTTP authentication
│   ├── features/                # Feature modules
│   │   └── servers/             # Server management feature
│   │       ├── servers-page/    # Server list view
│   │       └── server-detail-page/ # Individual server details
│   ├── shared/                  # Shared components and utilities
│   │   └── ui/layout/           # Layout components
│   │       ├── shell/           # Main application shell
│   │       ├── topbar/          # Global navigation header
│   │       └── sidebar/         # Navigation sidebar
│   └── assets/                  # Static assets and mock data
```

### **Key Components**

#### **🏠 Shell Layout**
- **Topbar**: Global header with search, theme toggle, and user avatar
- **Sidebar**: Navigation menu with collapsible functionality
- **Main Content**: Router outlet for feature components

#### **🖥️ Server Features**
- **Server List**: Grid/card view with hardware specs, status, and pricing
- **Server Detail**: Comprehensive server information and action buttons
- **Search & Filter**: Real-time filtering by name, type, location, and status

#### **⚙️ Services**
- **HetznerApiService**: Mock API with structured data transformation
- **ThemeService**: System-aware theme management with persistence

## 🎨 Design System

### **Color Palette**
- **Primary**: Hetzner Red (`#d73653`)
- **Background**: Dark (`#0f1419`) / Light (`#ffffff`)
- **Surface**: Elevated cards with subtle borders
- **Text**: Semantic color hierarchy (primary, soft, muted)

### **Typography**
- **Headers**: Inter font with multiple weights
- **Body**: System font stack for optimal readability
- **Code**: Roboto Mono for technical content

### **Components**
- **Cards**: Rounded corners with hover effects
- **Buttons**: Consistent sizing and state management
- **Status Indicators**: Color-coded dots with semantic meaning
- **Loading States**: Skeleton placeholders with animations

## 🔌 API Integration

### **Mock Data Setup**
The application includes a comprehensive mock API system:

```typescript
// Environment configuration
export const environment = {
  apiBase: 'assets/mock',  // Points to mock data
  useMockFallback: true,   // Fallback to mock if real API fails
  production: false
};
```

### **Data Structure**
```typescript
interface Server {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'running' | 'stopped' | 'error';
  priceEur: number;
  created?: string;
  server_type?: {
    name: string;
    cores: number;
    memory: number;
    disk: number;
  };
  datacenter?: {
    location: {
      name: string;
      city: string;
      country: string;
    };
  };
}
```

### **Real API Integration**
To connect to the actual Hetzner Cloud API:

1. Update `environment.ts`:
```typescript
export const environment = {
  apiBase: 'https://api.hetzner.cloud/v1',
  useMockFallback: false,
  production: true
};
```

2. Add your API token to localStorage:
```javascript
localStorage.setItem('HCLOUD_TOKEN', 'your-hetzner-api-token');
```

## 🛠️ Development

### **Code Style**
- **Angular Style Guide**: Follows official Angular style conventions
- **TypeScript Strict**: Strict type checking enabled
- **ESLint**: Consistent code formatting and best practices
- **Prettier**: Automated code formatting

### **Component Architecture**
- **Standalone Components**: Modern Angular 17+ approach
- **Signal-based State**: Reactive programming with Angular signals
- **OnPush Change Detection**: Optimized performance
- **Lazy Loading**: Route-based code splitting

### **Testing Strategy**
- **Unit Tests**: Jest with Angular Testing Library
- **Component Tests**: Isolated component testing
- **Service Tests**: Mock-based service testing
- **E2E Tests**: Cypress for end-to-end testing

## 📦 Build & Deployment

### **Production Build**
```bash
# Build with optimization
npm run build

# Build with specific environment
ng build --configuration production
```

### **Docker Support**
```dockerfile
# Multi-stage build for optimal size
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### **Deployment Options**
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **Cloud Platforms**: AWS S3, Google Cloud Storage
- **Container**: Docker with Nginx
- **CDN**: Cloudflare, AWS CloudFront

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**
- Follow Angular style guide conventions
- Write unit tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team**: For the excellent framework and tooling
- **Tailwind CSS**: For the utility-first CSS framework
- **Hetzner**: For inspiration from their clean design language
- **Community**: For feedback and contributions

---

**Built with ❤️ using Angular 17+ and modern web technologies**
