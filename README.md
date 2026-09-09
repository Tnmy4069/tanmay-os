# Tanmay OS

A full-stack dashboard application with task management, scheduling, user authentication, and more. Built with [Next.js](https://nextjs.org), TypeScript, and MongoDB.

## Features

- **User Authentication**: Secure login and registration.
- **Task Management**: Create, edit, and organize daily tasks.
- **Scheduling**: Plan your day with intuitive schedule blocks.
- **Career & Education Hub**: Track DSA progress, aptitude tests, job hunts, and upskilling.
- **Personal Development**: Manage fitness routines and life goals.
- **Analytics**: Gain insights into your productivity.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (version 20 or higher) and [npm](https://www.npmjs.com/) installed. You will also need a MongoDB database cluster.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd tanmay-os
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env.local
   ```
   **Required Variables:**
   - `MONGODB_URI`: Your MongoDB connection string.
   - `AUTH_SECRET`: A secure random string for NextAuth (e.g. generated via `openssl rand -hex 32`).

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
