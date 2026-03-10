# 🚀 Junior Dev Open Source

> A platform to help **junior developers contribute to real open source projects**

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=nextdotjs)]()
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38BDF8?logo=tailwindcss&logoColor=white)]()
[![Postgres](https://img.shields.io/badge/PostgreSQL-Database-316192?logo=postgresql&logoColor=white)]()
[![MIT License](https://img.shields.io/badge/license-MIT-green)]()

---

# 🌍 Overview

**Junior Dev Open Source** is a platform designed to make contributing to open source **accessible for junior developers**.

Many beginners want to contribute but struggle with:

- Finding beginner-friendly issues
- Understanding complex repositories
- Knowing how to contact maintainers
- Getting their first contribution accepted

This platform solves that by creating a **guided open source contribution hub**.

Developers can:

- Discover open source projects
- Browse available tasks
- Request to work on a task
- Get approved by maintainers
- Contribute to real repositories

---

# ⚙️ How It Works

```text
Discover project
↓
Explore tasks
↓
Request a task
↓
Maintainer reviews request
↓
Task approved
↓
Developer contributes
```

---

# ✨ Features

### 🔐 Authentication

- GitHub OAuth login
- Automatic profile creation

---

### 📦 Projects

Explore real open source projects including:

- project description
- tech stack
- repository links

---

### 🧠 Tasks

Each project contains tasks with:

- difficulty level
- description
- labels
- GitHub issue links

---

### ✋ Task Requests

Developers can request tasks.

Maintainers review the request and decide whether to:

- approve
- reject

---

### 📊 Personal Dashboard

Each user has access to:

**My Tasks**

Tasks assigned to the developer.

**My Requests**

Requests submitted and their status.

---

### 🛠 Maintainer Dashboard

Project maintainers can:

- create projects
- edit projects
- create tasks
- edit tasks
- review task requests
- approve or reject contributions

---

# 🖥 Example Workflow

### 1️⃣ Developer finds a project

Browse open source projects available on the platform.

---

### 2️⃣ Developer explores tasks

Tasks contain information such as:

- difficulty
- labels
- GitHub issue

---

### 3️⃣ Developer requests a task

The developer submits a request to work on a task.

---

### 4️⃣ Maintainer reviews the request

Maintainers review and approve or reject.

---

### 5️⃣ Task gets assigned

If approved:

- task status becomes **assigned**
- developer starts working

---

# 🛠 Tech Stack

## Frontend

- Next.js (App Router)
- React Server Components
- TailwindCSS

## Backend

- Supabase
- PostgreSQL
- Row Level Security

## Authentication

- GitHub OAuth

---

# 🗄 Database Schema

Main tables used by the platform:

```
profiles
projects
tasks
task_requests
```

Relationships:

```
projects → contain tasks
tasks → receive task requests
task_requests → submitted by users
```

---

# 📂 Project Structure

```
src
 ├ app
 │  ├ projects
 │  │  ├ page.tsx
 │  │  └ [slug]/page.tsx
 │  ├ tasks
 │  │  └ [id]/page.tsx
 │  ├ dashboard
 │  │  ├ page.tsx
 │  │  ├ requests
 │  │  ├ my-requests
 │  │  ├ my-tasks
 │  │  ├ projects
 │  │  │  ├ new
 │  │  │  └ [id]/edit
 │  │  └ tasks
 │  │     ├ new
 │  │     └ [id]/edit
 │
 ├ components
 │  ├ navbar
 │  ├ project-card
 │  ├ task-card
 │  └ request-task-form
 │
 └ lib
    ├ supabase
    └ create-profile-if-needed
```

---

# 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-repo/junior-dev-open-source.git
cd junior-dev-open-source
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Configure environment variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

### 4️⃣ Run the development server

```bash
npm run dev
```

The application will run at:

```
http://localhost:3000
```

---

# 🗺 Roadmap

## MVP

- [x] GitHub authentication
- [x] User profiles
- [x] Projects listing
- [x] Task management
- [x] Task requests
- [x] Maintainer approval system

---

## Future Improvements

- GitHub issue integration
- Notifications system
- Contributor leaderboard
- Better onboarding for beginners
- Automated repository invitations

---

# 🤝 Contributing

Contributions are welcome.

Steps to contribute:

1. Fork the repository

2. Create a branch

```bash
git checkout -b feature/my-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push your branch

```bash
git push origin feature/my-feature
```

5. Open a Pull Request

---

# 🎯 Vision

The goal is to create a **central hub for Spanish-speaking developers to contribute to open source**.

A place where juniors can:

- learn
- collaborate
- build real experience

---

# 📄 License

MIT License
