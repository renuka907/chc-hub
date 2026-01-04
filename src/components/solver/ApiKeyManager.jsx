import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";


import { Input } from "@/components/ui/input";
import { Key, Info, Save, CheckCircle } from "lucide-react";

export default function ApiKeyManager({ isVisible }) {
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("openai_api_key", apiKey);
    setIsKeySaved(true);
    setIsOpen(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className="flex justify-center -mt-4 mb-4">
        <Button 
          variant="ghost" 
          onClick={() => setIsOpen(true)}
          className="clay-element bg-white/50 text-gray-600 hover:text-purple-600 hover:bg-white/90 text-sm font-medium text-center px-4 py-2"
        >
          <Key className="w-4 h-4 mr-2" />
          <span className="whitespace-nowrap">
            {isKeySaved ? "Update API Key for Advanced Solutions" : "Use Your Own API Key for Advanced Solutions"}
          </span>
        </Button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="clay-element bg-gradient-to-br from-white to-gray-50 border-0 w-full max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-800 text-lg font-semibold mb-2">
                  <Key className="w-5 h-5 text-purple-600" />
                  Bring Your Own API Key
                </div>
                <p className="text-gray-600 text-sm">
                  For advanced problems (High School & College), you can use your own OpenAI API key for potentially more capable models.
                </p>
              </div>
              
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your OpenAI API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="clay-inset bg-white/90 border-0"
                />
                <div className="clay-element bg-blue-100/50 p-3 text-sm text-blue-800 flex items-start gap-3">
                  <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>Your API key is stored locally in your browser and is never sent to our servers. It's only used to make direct requests to OpenAI from your browser for the problem you submit.</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="clay-element bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSave} 
                  className="clay-element bg-gradient-to-r from-blue-200 to-green-200 hover:from-blue-300 hover:to-green-300 text-gray-800 font-semibold border-0"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Key
                </Button>
              </div>
              
              {isKeySaved && (
                <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2 mt-4">
                  <CheckCircle className="w-4 h-4"/>
                  <span>API Key is saved in this browser.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}