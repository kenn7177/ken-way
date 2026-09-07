type TlottieExports = {
  memory: WebAssembly.Memory;
  tlottie_alloc: (length: number) => number;
  tlottie_free: (pointer: number, length: number) => void;
  tlottie_new_with_options: (
    pointer: number,
    length: number,
    fitzModifier: number,
    colorReplacementsPointer: number,
    colorReplacementsLength: number,
  ) => number;
  tlottie_drop: (animation: number) => void;
  tlottie_width: (animation: number) => number;
  tlottie_height: (animation: number) => number;
  tlottie_frame_rate: (animation: number) => number;
  tlottie_frame_count: (animation: number) => number;
  tlottie_render_with_options: (
    animation: number,
    frame: number,
    width: number,
    height: number,
    antialias: number,
    curveTolerance: number,
  ) => number;
};

export type TlottieAnimation = {
  frameCount: number;
  frameRate: number;
  render: (context: CanvasRenderingContext2D, frame: number, width: number, height: number) => void;
  dispose: () => void;
};

let runtime: Promise<TlottieExports> | undefined;

async function loadRuntime() {
  if (!runtime) {
    runtime = fetch("/vendor/tlottie/tlottie.wasm")
      .then(async (response) => {
        if (!response.ok) throw new Error(`tlottie renderer failed to load (${response.status})`);
        return WebAssembly.instantiate(await response.arrayBuffer(), {});
      })
      .then(({ instance }) => instance.exports as unknown as TlottieExports);
  }
  return runtime;
}

// This intentionally follows tlottie's Web example rule: re-read memory after
// every renderer call because WebAssembly memory can grow and detach old views.
export async function createTlottieAnimation(data: unknown): Promise<TlottieAnimation> {
  const api = await loadRuntime();
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const input = api.tlottie_alloc(bytes.length);
  if (!input) throw new Error("tlottie could not allocate animation input");

  let handle = 0;
  try {
    new Uint8Array(api.memory.buffer, input, bytes.length).set(bytes);
    handle = api.tlottie_new_with_options(input, bytes.length, 0, 0, 0);
  } finally {
    api.tlottie_free(input, bytes.length);
  }
  if (!handle) throw new Error("tlottie could not parse the bundled animation");

  const frameCount = Math.max(1, api.tlottie_frame_count(handle));
  const frameRate = Math.max(1, api.tlottie_frame_rate(handle));
  let disposed = false;

  return {
    frameCount,
    frameRate,
    render(context, frame, width, height) {
      if (disposed) return;
      const pixels = api.tlottie_render_with_options(handle, frame % frameCount, width, height, 1, 0.125);
      if (!pixels) throw new Error("tlottie could not render this animation frame");

      const copy = new Uint8ClampedArray(api.memory.buffer.slice(pixels, pixels + width * height * 4));
      context.putImageData(new ImageData(copy, width, height), 0, 0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      api.tlottie_drop(handle);
    },
  };
}
