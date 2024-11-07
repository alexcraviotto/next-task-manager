# 📋 Next-Based Task Manager

A modern task management application built with Next.js that helps you organize and prioritize tasks based on their weight/importance.

## 🎯 Overview

This project allows users to:

- ✨ Create and manage tasks
- ⚖️ Assign weights to tasks for prioritization
- 🎨 Organize tasks in a visual interface
- ✅ Track task completion status
- 🔍 Filter and sort tasks by different criteria

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Git

### 🛠️ Installation

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

3. Create environment file

```bash
cp .env.example .env.local
```

4. Start development server

```bash
npm run dev
# or
yarn dev
```

5. Visit [`http://localhost:3000`](http://localhost:3000) in your browser

## 🏗️ Tech Stack

- ⚛️ [Next.js](https://nextjs.org/) - React Framework
- 🎨 [Tailwind CSS](https://tailwindcss.com/) - Styling
- 📝 [TypeScript](https://www.typescriptlang.org/) - Type Safety
- 🗄️ [Prisma](https://www.prisma.io/) - Database ORM

## 🤝 Contributing

Please follow these steps:

### 🔒 Branch Protection

The `main` branch is protected. Changes through PRs only:

1. Fork the repository
2. Create feature branch:

```bash
git checkout -b feature/amazing-feature
```

### 📝 Commit Rules

Use conventional commits:

- 🎯 `feat:` - New features
- 🐛 `fix:` - Bug fixes
- 📚 `docs:` - Documentation
- 💅 `style:` - Code style
- ♻️ `refactor:` - Code refactoring
- 🧪 `test:` - Tests
- 🔧 `chore:` - Maintenance

Example:

```bash
git commit -m "feat: add task weight calculation"
```

### 📥 Pull Request Steps

1. Update README.md if needed
2. Document new features
3. Create detailed PR
4. Await review
5. Address feedback
6. Merge after approval

## 🔄 Database Migrations

This will be used when a change is made in the schema.prisma.

```bash
# Authenticate with Turso
turso auth login

# Initialize Prisma migrations
npx prisma migrate dev --name init

# Apply migrations to Turso database
turso db shell next-task-manager < ./prisma/migrations/20241026142205_init/migration.sql
```
