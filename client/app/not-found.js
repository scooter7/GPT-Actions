export default function NotFound() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-200">
      <h1 className="text-5xl font-bold text-red-600 mb-4">404</h1>
      <p className="text-lg text-gray-700 mb-8">Page Not Found</p>
      <a
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Go Home
      </a>
    </main>
  );
}