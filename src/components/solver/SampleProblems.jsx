import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";

const sampleProblems = {
  elementary: [
    "What is 25 + 37?",
    "Solve 144 ÷ 12",
    "Find 3/4 + 1/2",
    "What is 15% of 80?"
  ],
  middle_school: [
    "Solve for x: 3x + 7 = 22",
    "Find the area of a rectangle with length 8 and width 5",
    "What is the square root of 144?",
    "Solve 2(x - 3) = 10"
  ],
  high_school: [
    "Solve the quadratic equation: x² - 5x + 6 = 0",
    "Find the derivative of f(x) = 3x² + 2x - 1",
    "What is sin(30°)?",
    "Solve the system: x + y = 5, 2x - y = 1"
  ],
  college: [
    "Find the integral of ∫(2x³ + 3x² - x + 1)dx",
    "Solve the differential equation: dy/dx = 2xy",
    "Find the limit: lim(x→0) (sin(x)/x)",
    "Calculate the probability of getting exactly 3 heads in 5 coin flips"
  ]
};

export default function SampleProblems({ difficulty, onSelectProblem }) {
  const problems = sampleProblems[difficulty] || [];

  return (
    <div className="clay-element bg-gradient-to-br from-peach-100 to-yellow-100 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="clay-element bg-gradient-to-br from-peach-200 to-yellow-200 p-3">
          <BookOpen className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Sample Problems</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {problems.map((problem, index) => (
          <button
            key={index}
            onClick={() => onSelectProblem(problem)}
            className="clay-element bg-gradient-to-br from-white to-yellow-50 hover:from-yellow-50 hover:to-yellow-100 border-0 p-4 min-h-[4rem] w-full flex items-center justify-between group transition-all duration-200"
          >
            <span 
              className="flex-1 text-gray-800 font-medium text-left pr-3 leading-relaxed text-sm md:text-base break-words overflow-hidden"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                hyphens: 'auto'
              }}
            >
              {problem}
            </span>
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-orange-600 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}