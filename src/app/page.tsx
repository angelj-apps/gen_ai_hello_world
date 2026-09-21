export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <main className="flex max-w-xl flex-col items-center gap-4 text-center">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          HW1
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Hello, world
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          gen_ai_hello_world — a Next.js app for Gen UI.
        </p>
      </main>
    </div>
  );
}
