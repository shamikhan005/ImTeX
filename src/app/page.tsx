import ImageUploader from "./components/ImageUploader";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="bg-gray-800 shadow-md py-6">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">ImTeX</h1>
          <p className="text-gray-400 mt-1">Convert images to LaTeX</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">
              Image to LaTeX Converter
            </h2>
            <p className="mb-6 text-gray-300">
              Upload an image containing mathematical equations, tables, or
              structured content and convert it to LaTeX code. For best results,
              select the appropriate document type before conversion.
            </p>

            <ImageUploader />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Equation Detection"
            description="Accurately converts mathematical equations and formulas to LaTeX code."
            icon="📐"
          />
          <FeatureCard
            title="Table Structure Preservation"
            description="Maintains the structure of tables and converts them to proper LaTeX tabular environments."
            icon="📊"
          />
          <FeatureCard
            title="Document Structure Analysis"
            description="Analyzes document structure to apply the most appropriate LaTeX formatting."
            icon="📄"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-700">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
