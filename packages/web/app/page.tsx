import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-950">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-7xl font-bold text-blue-600 dark:text-blue-400">
            HouseRater
          </h1>
          <p className="text-2xl text-gray-700 dark:text-gray-200">
            Find Your Perfect Home
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-900">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Rate Categories</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Set importance levels for features that matter to you
            </p>
          </div>
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-900">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Score Houses</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Rate each house against your criteria
            </p>
          </div>
          <div className="p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow bg-white dark:bg-gray-900">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Compare Results</h2>
            <p className="text-gray-600 dark:text-gray-400">
              See which house is the best fit for your needs
            </p>
          </div>
        </div>

        <div className="pt-8 flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
