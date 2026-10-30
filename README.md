# ✦ Phosphor

### Interactive WebGL Visual Experiment

An exploration of light, color, and motion — built with React, WebGL, and GLSL.

**Phosphor** is a creative coding experiment that brings an immersive animated visual effect to the browser. It combines shader-based graphics with a reusable React component to explore the possibilities of real-time rendering on the web.

---

## ✨ Preview

A dynamic visual experience inspired by light, color, and fluid motion.

> Add a screenshot or GIF of the project here to give visitors an immediate look at the experience.

## ![project-photo](<Phosphor_ Interactive Particle Orb.png>)

## 🚀 Features

- **Real-Time Visuals** — Animated graphics rendered with WebGL.
- **GLSL Shaders** — Shader-based rendering for rich visual effects.
- **Customizable Parameters** — Adjust colors, brightness, speed, and other visual properties.
- **Reusable React Component** — Integrate the effect into a React application.
- **Responsive Canvas** — Adapts to the available container size.

## 🛠️ Tech Stack

- React
- JavaScript
- WebGL
- GLSL
- Vite

## 📦 Getting Started

### Prerequisites

Make sure you have Node.js and npm installed.

### Installation

Clone the repository:

```bash
git clone https://github.com/leilasharifidev/Phosphor.git
```

Navigate to the project folder:

```bash
cd Phosphor
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal.

### Build for Production

```bash
npm run build
```

## 🎨 Component Usage

Import the component into your React application:

```jsx
import Phosphor from "./components/Phosphor";

function App() {
  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Phosphor
        background="#08090d"
        baseColor="#9bdcff"
        spectrum={100}
        size={100}
        distance={12}
        turbulence={49}
        brightness={176}
        speed={50}
      />
    </div>
  );
}

export default App;
```

## 🧠 What I Explored

This project was an opportunity to explore:

- Integrating WebGL effects into React
- Working with GLSL shader code
- Rendering animated graphics in the browser
- Creating configurable visual components
- Exploring creative coding beyond traditional UI development

AI-assisted coding was part of my implementation process.

## 💡 Inspiration

This experiment was inspired by an existing online visual project. I used the concept as a starting point to explore its implementation with React and WebGL.

**Original inspiration:** [[https://www.originkit.dev/](https://www.originkit.dev/)]

## 👩🏻‍💻 About Me

I'm **Leila Sharifi**, a frontend developer focused on building projects, expanding my technical skills, and exploring creative ways to bring ideas to life on the web.

I share my learning journey through code, experiments, and personal projects.

- **GitHub:** [@leilasharifidev](https://github.com/leilasharifidev)
- **Portfolio:** [leilasharifi.com](https://leilasharifi.com)

---

_Building my skills, one project at a time._ ✦
