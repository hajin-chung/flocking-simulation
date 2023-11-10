import { onMount } from "solid-js";
import { Flock } from "./flock";

function App() {
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;

    const flock = new Flock(canvasRef);

    let time: number = 0;
    setInterval(() => {
      const currentTime = window.performance.now();
      const dt = currentTime - time;

      flock.update(dt / 1000);
      time = currentTime;
      flock.draw();
    }, 1000 / 60);
  });

  return (
    <main class="w-screen h-screen">
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
      />
    </main>
  );
}

export default App;
