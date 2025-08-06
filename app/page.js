export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200">
      <h1 className="text-4xl font-bold mb-4 text-black">Welcome to GPT Auth</h1>
      <p className="text-lg text-gray-700 mb-8">Authenticate your custom GPTs with ease.</p>
      <a
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Go to Dashboard
      </a>
    </main>
  );
}