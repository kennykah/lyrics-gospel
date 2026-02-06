export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Gospel Lyrics
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
              Paroles synchronisées
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Importez un fichier LRC ou créez une synchronisation avec l’éditeur tap-to-sync.
            L’audio reste temporaire côté client.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/upload"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all shadow-lg"
            >
              Importer un LRC
            </a>
            <a
              href="/sync"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-purple-600 text-purple-700 rounded-full hover:bg-purple-50 transition-all"
            >
              Tap-to-sync
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
