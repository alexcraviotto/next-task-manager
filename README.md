# 📋 Next-Based Task Manager

A modern task management application built with Next.js that helps you organize and prioritize tasks based on their weight/importance.

## 🎯 Overview

This project allows users to:

- Create and manage tasks
- Assign weights to tasks for prioritization
- Organize tasks in a visual interface
- Track task completion status
- Filter and sort tasks by different criteria

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Git

### Installation

1. Clone the repository

```bash
git clone https://github.com/alexcraviotto/next-task-manager.git
cd weight-task-manager
```

2. Install dependencies

```bash
npm install
# or
yarn install

```

3. Create a `.env.local` file following the `.env.example` template

```bash

cp .env.example .env.local
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser

## 🛠️ Built With

- [Next.js](https://nextjs.org/) - React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Prisma](https://www.prisma.io/) - Database ORM

## 👥 Contributing

Please follow these steps to contribute:

### Branch Protection

The `main` branch is protected. All changes must be made through Pull Requests:

1. Fork the repository
2. Create your feature branch:

```bash
git checkout -b feature/amazing-feature
```

### Commit Convention

We use conventional commits to maintain a clean git history. Your commits must follow this pattern:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes

- `style:` - Code style changes (formatting, etc)
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

Example:

```bash
git commit -m "feat: add task weight calculation"
```

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation if you introduce new features
3. Create a Pull Request with a comprehensive description of changes
4. Wait for code review
5. Address any feedback received
6. Once approved, your PR will be merged
