import Phosphor from "./components/Phosphor";

function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#08090d",
        color: "#ffffff",
        padding: "40px 24px",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "32px" }}>
        <p
          style={{
            color: "#9bdcff",
            letterSpacing: "4px",
            fontSize: "12px",
          }}
        >
          WEBGL EXPERIMENT / 001
        </p>

        <h1 style={{ fontSize: "clamp(40px, 8vw, 80px)", margin: "16px 0" }}>
          PHOSPHOR
        </h1>

        <p style={{ color: "#a5a5b3" }}>
          Light, color, and motion — an interactive visual experiment.
        </p>
      </header>

      <section
        style={{
          width: "100%",
          maxWidth: "1000px",
          height: "min(65vh, 600px)",
          minHeight: "320px",
          margin: "0 auto",
          border: "1px solid #252833",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
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
      </section>

      <footer
        style={{
          textAlign: "center",
          marginTop: "24px",
          color: "#777b89",
          fontSize: "13px",
        }}
      >
        Built with React, WebGL & GLSL
      </footer>
    </main>
  );
}

export default App;
