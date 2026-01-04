
import React from "react";
import { CheckCircle, BookOpen, Lightbulb } from "lucide-react";

export default function SolutionDisplay({ solution, isLoading }) {
  if (isLoading) {
    return (
      <div className="clay-element bg-gradient-to-br from-blue-100 to-purple-100 p-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xl font-semibold text-gray-800">Working on your solution...</span>
        </div>
      </div>
    );
  }

  if (!solution) return null;

  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <div className="clay-element bg-gradient-to-br from-blue-100 to-purple-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="clay-element bg-gradient-to-br from-blue-200 to-purple-200 p-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Problem</h3>
        </div>
        <p className="text-lg text-gray-700 font-medium break-words">{solution.problem}</p>
      </div>

      {/* Step-by-Step Solution */}
      <div className="clay-element bg-gradient-to-br from-green-100 to-mint-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="clay-element bg-gradient-to-br from-green-200 to-mint-200 p-2">
            <Lightbulb className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Step-by-Step Solution</h3>
        </div>
        
        <div className="space-y-4">
          {solution.steps?.map((step, index) => (
            <div key={index} className="clay-element bg-white/80 p-4 hover:bg-white/90 transition-colors">
              <div className="flex items-start gap-4">
                <div className="clay-element bg-gradient-to-br from-green-200 to-mint-200 p-2 min-w-fit">
                  <span className="font-bold text-green-700">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium mb-2 break-words">{step.description}</p>
                  {step.calculation && (
                    <div className="clay-inset bg-gray-50 p-3 rounded-xl overflow-x-auto">
                      <code className="text-purple-700 font-mono whitespace-pre">{step.calculation}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Answer */}
      <div className="clay-element bg-gradient-to-br from-purple-100 to-pink-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="clay-element bg-gradient-to-br from-purple-200 to-pink-200 p-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Final Answer</h3>
        </div>
        <div className="clay-element bg-white/80 p-4 overflow-x-auto">
          <p className="text-2xl font-bold text-purple-700">{solution.final_answer}</p>
        </div>
      </div>

      {/* Explanation */}
      {solution.explanation && (
        <div className="clay-element bg-gradient-to-br from-orange-100 to-peach-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="clay-element bg-gradient-to-br from-orange-200 to-peach-200 p-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Explanation</h3>
          </div>
          <div className="clay-element bg-white/80 p-4">
            <p className="text-gray-700 leading-relaxed break-words">{solution.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
