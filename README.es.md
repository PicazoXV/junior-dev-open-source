# 🚀 Junior Dev Open Source

> Una plataforma para ayudar a **desarrolladores junior a contribuir en proyectos open source reales**

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=nextdotjs)]()
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)]()
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38BDF8?logo=tailwindcss&logoColor=white)]()
[![Postgres](https://img.shields.io/badge/PostgreSQL-Database-316192?logo=postgresql&logoColor=white)]()
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green)]()

---

# 🌍 Descripción

**Junior Dev Open Source** es una plataforma diseñada para facilitar que **desarrolladores junior puedan contribuir a proyectos open source reales**.

Muchos desarrolladores principiantes quieren participar en open source pero se encuentran con varios problemas:

- No saben **por dónde empezar**
- Los repositorios son **demasiado complejos**
- No encuentran **issues o tareas adaptadas a su nivel**
- No saben **cómo contactar con maintainers**

Esta plataforma resuelve ese problema creando un **hub de contribuciones guiadas**.

Los desarrolladores pueden:

- descubrir proyectos open source
- explorar tareas disponibles
- solicitar una tarea
- ser aprobados por maintainers
- contribuir a repositorios reales

---

# ⚙️ Cómo funciona

El flujo de la plataforma es el siguiente:

```
Descubrir proyecto
↓
Explorar tareas
↓
Solicitar una tarea
↓
Maintainer revisa la solicitud
↓
Solicitud aprobada
↓
El developer contribuye al proyecto
```

---

# ✨ Funcionalidades

## 🔐 Autenticación

- Login con **GitHub OAuth**
- Creación automática de perfil de usuario

---

## 📦 Proyectos

Explorar proyectos open source disponibles incluyendo:

- descripción del proyecto
- tecnologías utilizadas
- enlace al repositorio

---

## 🧠 Tareas

Cada proyecto contiene tareas con información como:

- nivel de dificultad
- descripción
- etiquetas (labels)
- enlace a una issue de GitHub

---

## ✋ Solicitud de tareas

Los desarrolladores pueden solicitar trabajar en una tarea.

Un maintainer revisará la solicitud y podrá:

- aprobarla
- rechazarla

---

## 📊 Panel personal

Cada usuario tiene acceso a:

### Mis tareas

Tareas que han sido asignadas al usuario.

### Mis solicitudes

Lista de solicitudes enviadas y su estado:

- pendiente
- aprobada
- rechazada
- cancelada

---

## 🛠 Panel de administración

Los maintainers del proyecto pueden:

- crear proyectos
- editar proyectos
- crear tareas
- editar tareas
- revisar solicitudes
- aprobar o rechazar solicitudes

---

# 🖥 Flujo de uso

### 1️⃣ Un developer encuentra un proyecto

Explora proyectos open source disponibles en la plataforma.

---

### 2️⃣ Explora las tareas

Cada tarea muestra:

- dificultad
- etiquetas
- descripción
- enlace a issue de GitHub

---

### 3️⃣ Solicita una tarea

El developer envía una solicitud para trabajar en una tarea.

---

### 4️⃣ El maintainer revisa

El maintainer revisa la solicitud y decide si aprobar o rechazar.

---

### 5️⃣ La tarea se asigna

Si se aprueba:

- la tarea pasa a estado **assigned**
- el developer puede empezar a trabajar

---

# 🛠 Stack tecnológico

## Frontend

- **Next.js (App Router)**
- **React Server Components**
- **TailwindCSS**

## Backend

- **Supabase**
- **PostgreSQL**
- **Row Level Security**

## Autenticación

- **GitHub OAuth**

---

# 🗄 Base de datos

Tablas principales utilizadas por la plataforma:

```
profiles
projects
tasks
task_requests
```

Relaciones principales:

```
projects → contienen tareas
tasks → reciben solicitudes
task_requests → solicitudes enviadas por usuarios
```

---

# 📂 Estructura del proyecto

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

# 🚀 Cómo ejecutar el proyecto

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/tu-repo/junior-dev-open-source.git
cd junior-dev-open-source
```

---

### 2️⃣ Instalar dependencias

```bash
npm install
```

---

### 3️⃣ Configurar variables de entorno

Crear un archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

### 4️⃣ Ejecutar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

```
http://localhost:3000
```

---

# 🗺 Roadmap

## MVP

- [x] Autenticación con GitHub
- [x] Perfiles de usuario
- [x] Listado de proyectos
- [x] Gestión de tareas
- [x] Solicitudes de tareas
- [x] Sistema de aprobación por maintainers

---

## Próximas mejoras

- Integración directa con **GitHub Issues**
- Sistema de **notificaciones**
- **Ranking de contributors**
- Mejor **onboarding para desarrolladores junior**
- Invitaciones automáticas a repositorios

---

# 🤝 Contribuir

Las contribuciones son bienvenidas.

Pasos para contribuir:

1. Haz un fork del repositorio

2. Crea una nueva rama

```bash
git checkout -b feature/nueva-funcionalidad
```

3. Realiza los cambios

4. Haz commit

```bash
git commit -m "feat: nueva funcionalidad"
```

5. Sube la rama

```bash
git push origin feature/nueva-funcionalidad
```

6. Abre un Pull Request

---

# 🎯 Visión del proyecto

El objetivo es crear una **plataforma de referencia para contribuir a open source en español**.

Un lugar donde los desarrolladores junior puedan:

- aprender
- colaborar
- ganar experiencia real
- construir portfolio

---

# 📄 Licencia

Este proyecto está bajo licencia **MIT**.
