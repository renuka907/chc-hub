import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Sparkles } from "lucide-react";

export default function ProblemInput({ onSolve, isLoading }) {
  const [problem, setProblem] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (problem.trim()) {
      onSolve(problem.trim());
    }
  };

  return (
    <div className="clay-element bg-gradient-to-br from-purple-100 to-pink-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="clay-element bg-gradient-to-br from-purple-200 to-pink-200 p-3">
          <Calculator className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Enter Your Math Problem</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="clay-inset rounded-2xl p-1">
          <Textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Type your math problem here... (e.g., 'Solve 2x + 5 = 13' or 'Find the derivative of x²')"
            className="min-h-32 border-0 bg-white/90 rounded-2xl text-lg resize-none focus:ring-0 focus:outline-none"
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!problem.trim() || isLoading}
            className={`clay-element bg-gradient-to-r from-blue-200 to-green-200 hover:from-blue-300 hover:to-green-300 text-gray-800 font-semibold px-8 py-4 text-lg border-0 ${
              isLoading ? "clay-pressed" : ""
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                Solving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Solve Problem
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}