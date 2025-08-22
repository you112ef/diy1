import { useState, useEffect } from 'react';
import { useParams, Link } from '@remix-run/react';
import type { RealityTransformationResult } from '~/lib/.server/llm/reality-transformer';

export default function RealityTransformResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<RealityTransformationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the transformation result from localStorage
    const storedResult = localStorage.getItem(`transformation_${id}`);
    
    if (storedResult) {
      try {
        const parsedResult = JSON.parse(storedResult) as RealityTransformationResult;
        setResult(parsedResult);
        setLoading(false);
      } catch (parseError) {
        setError('Failed to parse transformation result');
        setLoading(false);
      }
    } else {
      // If no stored result, show error
      setError('Transformation result not found. Please try the transformation again.');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading Your Transformed Reality...</h2>
          <p className="text-gray-300 mt-2">Retrieving your concept transformation</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-red-400">Transformation Failed</h2>
          <p className="text-gray-300 mt-2">{error}</p>
          <Link to="/reality-transform" className="mt-4 inline-block px-6 py-3 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Reality Transformation Complete!
            </h1>
            <p className="text-xl text-gray-300">
              Your concept has been successfully transformed into a working reality
            </p>
          </div>

          {/* Success Summary */}
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">✅</div>
              <h2 className="text-2xl font-semibold text-green-300">Transformation Successful</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Mode:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.transformationMode.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-gray-300">Level:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.realityLevel}</span>
              </div>
              <div>
                <span className="text-gray-300">Complexity:</span>
                <span className="ml-2 text-white font-medium capitalize">{result.metadata.complexity}</span>
              </div>
            </div>
          </div>

          {/* Generated Files */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-cyan-300">Generated Files</h2>
            <div className="space-y-4">
              {Object.entries(result.transformedContent).map(([filename, file]) => (
                <div key={filename} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{filename}</h3>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                      {file.type}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3 text-sm font-mono text-gray-300 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{file.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions and Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-300">🚀 Getting Started</h3>
              <ol className="space-y-2 text-sm">
                {result.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-300">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-300">🔮 Next Steps</h3>
              <ul className="space-y-2 text-sm">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">→</span>
                    <span className="text-gray-300">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-cyan-300">📊 Transformation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Estimated Time:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.estimatedTime}</span>
              </div>
              <div>
                <span className="text-gray-300">Dependencies:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.dependencies.join(', ')}</span>
              </div>
              {result.metadata.warnings.length > 0 && (
                <div className="md:col-span-2">
                  <span className="text-gray-300">Warnings:</span>
                  <div className="mt-2 space-y-1">
                    {result.metadata.warnings.map((warning, index) => (
                      <div key={index} className="text-yellow-300 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-x-4">
            <Link
              to="/reality-transform"
              className="inline-block px-8 py-3 bg-cyan-500 rounded-xl hover:bg-cyan-600 transition-colors font-semibold"
            >
              Transform Another Concept
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-block px-8 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors font-semibold"
            >
              📄 Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}