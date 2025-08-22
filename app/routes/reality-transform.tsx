import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import { REALITY_TRANSFORMATION_MODES, TRANSFORMATION_PRIORITIES, REALITY_LEVELS } from '~/lib/common/reality-constants';
import type { RealityTransformationResult } from '~/lib/.server/llm/reality-transformer';

export default function RealityTransformPage() {
  const [selectedMode, setSelectedMode] = useState<keyof typeof REALITY_TRANSFORMATION_MODES>('IDEA_TO_CODE');
  const [selectedPriority, setSelectedPriority] = useState<keyof typeof TRANSFORMATION_PRIORITIES>('MEDIUM');
  const [selectedLevel, setSelectedLevel] = useState<keyof typeof REALITY_LEVELS>('FUNCTIONAL');
  const [concept, setConcept] = useState('');
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState<string[]>(['']);
  const [expectedOutcome, setExpectedOutcome] = useState('');

  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const addConstraint = () => {
    setConstraints([...constraints, '']);
  };

  const removeConstraint = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...constraints];
    newConstraints[index] = value;
    setConstraints(newConstraints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      mode: selectedMode,
      priority: selectedPriority,
      targetLevel: selectedLevel,
      concept,
      context: context || undefined,
      constraints: constraints.filter(c => c.trim() !== ''),
      expectedOutcome: expectedOutcome || undefined
    };

    try {
      const response = await fetch('/api/reality-transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result: RealityTransformationResult = await response.json();
        
        if (result.success) {
          // Generate a unique ID for the transformation
          const transformationId = `rt_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          
          // Store the result in localStorage for the results page
          localStorage.setItem(`transformation_${transformationId}`, JSON.stringify(result));
          
          // Redirect to results page
          window.location.href = `/reality-transform/result/${transformationId}`;
        } else {
          alert('Transformation failed. Please try again.');
        }
      } else {
        const errorData = await response.json();
        alert(`Transformation failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during transformation:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Reality Transformer
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Transform your virtual ideas, simulations, and dreams into real, working applications. 
              Bridge the gap between imagination and implementation.
            </p>
          </div>

          {/* Transformation Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <Form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Transformation Mode Selection */}
              <div>
                <label className="block text-lg font-semibold mb-4 text-cyan-300">
                  Choose Your Transformation Path
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(REALITY_TRANSFORMATION_MODES).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedMode === key
                          ? 'border-cyan-400 bg-cyan-400/20'
                          : 'border-white/30 bg-white/5 hover:border-white/50'
                      }`}
                      onClick={() => setSelectedMode(key as keyof typeof REALITY_TRANSFORMATION_MODES)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {getModeIcon(key)}
                        </div>
                        <div className="font-medium text-white">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          {getModeDescription(key)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority and Target Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold mb-3 text-cyan-300">
                    Transformation Priority
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as keyof typeof TRANSFORMATION_PRIORITIES)}
                    className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {Object.entries(TRANSFORMATION_PRIORITIES).map(([key, value]) => (
                      <option key={key} value={key} className="bg-gray-800 text-white">
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-3 text-cyan-300">
                    Target Reality Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as keyof typeof REALITY_LEVELS)}
                    className="w-full p-3 bg-white/10 border border-white/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {Object.entries(REALITY_LEVELS).map(([key, value]) => (
                      <option key={key} value={key} className="bg-gray-800 text-white">
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Concept Input */}
              <div>
                <label className="block text-lg font-semibold mb-3 text-cyan-300">
                  Describe Your Concept
                </label>
                <textarea
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Describe the virtual idea, simulation, or concept you want to transform into reality..."
                  className="w-full p-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none min-h-[120px] resize-y"
                  required
                />
              </div>

              {/* Context Input */}
              <div>
                <label className="block text-lg font-semibold mb-3 text-cyan-300">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Provide additional context, background, or specific requirements..."
                  className="w-full p-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none min-h-[100px] resize-y"
                />
              </div>

              {/* Constraints */}
              <div>
                <label className="block text-lg font-semibold mb-3 text-cyan-300">
                  Constraints & Limitations
                </label>
                <div className="space-y-3">
                  {constraints.map((constraint, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={constraint}
                        onChange={(e) => updateConstraint(index, e.target.value)}
                        placeholder={`Constraint ${index + 1} (e.g., budget, time, technology)`}
                        className="flex-1 p-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                      />
                      {constraints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeConstraint(index)}
                          className="px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addConstraint}
                    className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    + Add Constraint
                  </button>
                </div>
              </div>

              {/* Expected Outcome */}
              <div>
                <label className="block text-lg font-semibold mb-3 text-cyan-300">
                  Expected Outcome (Optional)
                </label>
                <textarea
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="Describe what you expect the final result to look like or accomplish..."
                  className="w-full p-4 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none min-h-[100px] resize-y"
                />
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || !concept.trim()}
                  className={`px-12 py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isSubmitting || !concept.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Transforming Reality...
                    </div>
                  ) : (
                    '🚀 Transform to Reality'
                  )}
                </button>
              </div>
            </Form>
          </div>

          {/* Info Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-300">
              Our advanced AI system will analyze your concept and create a complete, 
              working implementation that bridges the gap between imagination and reality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getModeIcon(mode: string): string {
  const icons: Record<string, string> = {
    VIRTUAL_TO_REAL: '🌐',
    SIMULATION_TO_ACTUAL: '🔬',
    CONCEPT_TO_IMPLEMENTATION: '💡',
    IDEA_TO_CODE: '⚡',
    DREAM_TO_APPLICATION: '✨'
  };
  return icons[mode] || '🚀';
}

function getModeDescription(mode: string): string {
  const descriptions: Record<string, string> = {
    VIRTUAL_TO_REAL: 'Convert virtual concepts to real applications',
    SIMULATION_TO_ACTUAL: 'Transform simulations into working systems',
    CONCEPT_TO_IMPLEMENTATION: 'Turn abstract ideas into concrete code',
    IDEA_TO_CODE: 'Rapidly prototype ideas into functional apps',
    DREAM_TO_APPLICATION: 'Create apps from creative dreams and visions'
  };
  return descriptions[mode] || 'Transform your concept into reality';
}