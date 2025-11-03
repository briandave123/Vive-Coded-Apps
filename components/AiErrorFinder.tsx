
import React, { useState } from 'react';
import { SparklesIcon } from './Icons';

interface AiErrorFinderProps {
  apiKey: string;
  onNewKeyFound: (key: string) => void;
  displayNotification: (message: string, type: 'success' | 'error') => void;
  errorKeys: string[];
}

export const AiErrorFinder = ({ apiKey, onNewKeyFound, displayNotification, errorKeys }: AiErrorFinderProps) => {
  const [inspectorAccountId, setInspectorAccountId] = useState('');
  const [inspectorResponse, setInspectorResponse] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedKey, setSuggestedKey] = useState('');

  const handleFetchSingleAccount = async () => {
    if (!apiKey) {
      displayNotification('API Key is not set.', 'error');
      return;
    }
    if (!inspectorAccountId.trim()) {
      displayNotification('Please enter an Account ID.', 'error');
      return;
    }
    setIsFetching(true);
    setInspectorResponse('');
    setSuggestedKey('');
    try {
      const response = await fetch(`https://server.smartlead.ai/api/v1/email-accounts/${inspectorAccountId.trim()}?api_key=${encodeURIComponent(apiKey)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      setInspectorResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch account data.";
      setInspectorResponse(`Error: ${errorMessage}`);
      displayNotification(errorMessage, 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!inspectorResponse || inspectorResponse.startsWith('Error:')) {
        displayNotification('No valid account data to analyze.', 'error');
        return;
    }
    setIsAnalyzing(true);
    setSuggestedKey('');
    try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Analyze the following JSON object which represents data for a single email account from an API. Your task is to identify the field (key) that contains the error message or describes a mailbox issue. Return ONLY the key name as a single, plain text string, without any quotes, formatting, or extra explanation. For example, if the JSON contains \`"latest_mailbox_issue_message": "SMTP auth failed"\`, you should return \`latest_mailbox_issue_message\`. Here is the JSON:\n\n${inspectorResponse}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const suggested = response.text.trim();

        if (!suggested || suggested.includes(' ') || suggested.includes('{')) {
            throw new Error("AI could not determine a valid key. Please inspect the JSON manually.");
        }
        
        setSuggestedKey(suggested);
        displayNotification(`AI suggests using the key: "${suggested}"`, 'success');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI analysis.";
        displayNotification(errorMessage, 'error');
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const handleAddKey = () => {
      if(suggestedKey) {
          onNewKeyFound(suggestedKey);
          setSuggestedKey('');
      }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white">Troubleshoot & Find Error Fields with AI</h2>
        <p className="text-slate-400 mt-1 mb-4">If scans aren't showing errors you expect, use this tool to find the correct data field from the API response.</p>
        <div className="text-sm text-slate-300 space-y-2 mb-4 p-4 bg-slate-900/50 rounded-md border border-slate-700">
            <p className="font-semibold">How to use this tool:</p>
            <ol className="list-decimal list-inside space-y-1">
                <li>After running a scan, find an account with a known error and copy its ID from the table below.</li>
                <li>Paste the ID here and click "Fetch Account Data".</li>
                <li>Click "Analyze with AI" to let Gemini find the most likely error field in the data.</li>
                <li>If the suggestion is correct, click "Add Key & Update" to improve the app's error detection.</li>
            </ol>
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-400 mb-2">Currently checking for errors in these fields:</p>
          <div className="flex flex-wrap gap-2">
            {errorKeys.map(key => <span key={key} className="bg-slate-700 text-xs font-mono py-1 px-2 rounded">{key}</span>)}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
                type="text"
                value={inspectorAccountId}
                onChange={(e) => setInspectorAccountId(e.target.value)}
                placeholder="Paste Account ID here"
                className="flex-grow bg-slate-900 border border-slate-600 rounded-md py-2 px-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                aria-label="Account ID for troubleshooting"
            />
            <button onClick={handleFetchSingleAccount} disabled={isFetching || isAnalyzing} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-500/50 disabled:cursor-not-allowed">
                {isFetching ? 'Fetching...' : 'Fetch Account Data'}
            </button>
             <button onClick={handleAnalyzeWithAI} disabled={!inspectorResponse || inspectorResponse.startsWith('Error:') || isAnalyzing || isFetching} className="flex items-center justify-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-500/50 disabled:cursor-not-allowed">
                <SparklesIcon />
                {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
        </div>

        {suggestedKey && (
            <div className="my-4 p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center justify-between">
                <div>
                    <p className="font-semibold text-green-300">AI Suggestion</p>
                    <p className="font-mono text-white">{suggestedKey}</p>
                </div>
                <button onClick={handleAddKey} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                    Add Key & Update
                </button>
            </div>
        )}

        {inspectorResponse && (
            <pre className="bg-slate-900 rounded-md p-4 text-sm text-slate-300 max-h-80 overflow-auto border border-slate-700" aria-live="polite">
                <code>{inspectorResponse}</code>
            </pre>
        )}
    </div>
  );
};
