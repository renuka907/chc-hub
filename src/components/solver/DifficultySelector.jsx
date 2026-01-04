import React from "react";
import { GraduationCap, BookOpen, Brain, Sparkles, Check } from "lucide-react";

const difficulties = [
  {
    id: "elementary",
    label: "Elementary",
    icon: BookOpen,
    color: "from-green-200 to-mint-200",
    selectedColor: "from-green-300 to-mint-300",
    description: "Basic arithmetic, simple fractions"
  },
  {
    id: "middle_school",
    label: "Middle School",
    icon: GraduationCap,
    color: "from-blue-200 to-cyan-200",
    selectedColor: "from-blue-300 to-cyan-300",
    description: "Pre-algebra, basic geometry"
  },
  {
    id: "high_school",
    label: "High School",
    icon: Brain,
    color: "from-purple-200 to-pink-200",
    selectedColor: "from-purple-300 to-pink-300",
    description: "Algebra, trigonometry, calculus"
  },
  {
    id: "college",
    label: "College",
    icon: Sparkles,
    color: "from-orange-200 to-red-200",
    selectedColor: "from-orange-300 to-red-300",
    description: "Advanced calculus, statistics"
  }
];

export default function DifficultySelector({ selectedDifficulty, onSelect }) {
  return (
    <div className="clay-element bg-gradient-to-br from-mint-100 to-blue-100 p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="clay-element bg-gradient-to-br from-mint-200 to-blue-200 p-3">
          <GraduationCap className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Choose Difficulty Level</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {difficulties.map((difficulty) => {
          const Icon = difficulty.icon;
          const isSelected = selectedDifficulty === difficulty.id;
          
          return (
            <button
              key={difficulty.id}
              onClick={() => onSelect(difficulty.id)}
              className={`clay-element bg-gradient-to-br ${isSelected ? difficulty.selectedColor : difficulty.color} hover:scale-105 transition-all duration-300 border-0 p-4 md:p-6 h-auto flex flex-col items-center justify-start gap-3 w-full relative ${
                isSelected ? "clay-pressed ring-4 ring-green-400 ring-offset-4 ring-offset-blue-50 shadow-2xl" : ""
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 clay-element bg-green-400 p-1.5 rounded-full">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`clay-element bg-gradient-to-br ${isSelected ? difficulty.selectedColor : difficulty.color} p-3`}>
                <Icon className={`w-6 h-6 ${isSelected ? 'text-gray-800' : 'text-gray-700'}`} />
              </div>
              <div className="text-center">
                <div className={`font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                  {difficulty.label}
                </div>
                <div className={`text-sm mt-1 ${isSelected ? 'text-gray-700' : 'text-gray-600'}`}>
                  {difficulty.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}