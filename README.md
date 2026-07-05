# ⚡ Next.js Modern Template

A powerful, production-ready template for Next.js developers, pre-configured with the latest technologies to jumpstart your next project.

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Better Auth](https://img.shields.io/badge/Better_Auth-black?style=for-the-badge)
![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
![React Toastify](https://img.shields.io/badge/React_Toastify-F04D54?style=for-the-badge&logo=react&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

## ✨ Features

- **Auth**: [Better Auth](https://better-auth.com) for secure and easy authentication.
- **Styling**: [Tailwind CSS](https://tailwindcss.com) & [Shadcn UI](https://ui.shadcn.com) for beautiful, accessible components.
- **Theming**: [Next Themes](https://github.com/pacocoursey/next-themes) for seamless dark mode support.
- **Notifications**: [React Toastify](https://fkhadra.github.io/react-toastify/) for elegant toast notifications.
- **Icons**: [Lucide React](https://lucide.dev) for crisp, consistent icons.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for declarative animations.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Tailwind Merge, CLSX
- **Authentication:** Better Auth
- **UI Components:** Shadcn UI, Radix UI

## 🚀 Getting Started

Follow these steps to get your project up and running:

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd next-template-ts
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Variables

Copy the example environment file to create your local configuration:

```bash
cp .env.example .env
```

Open `.env` and configure the following variables:

- `NODE_ENV` (e.g., `development` or `production`)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` (for Google Auth)
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` (for GitHub Auth)
- `BETTER_AUTH_SECRET` (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` (e.g., `http://localhost:3000`)
- `PRODUCTION_APP_URL` (e.g., `https://your-app.com`)

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
