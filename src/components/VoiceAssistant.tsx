import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WaveformVisualizer } from './WaveformVisualizer';
import { supabase } from '@/integrations/supabase/client';

interface VoiceAssistantProps {
  className?: string;
}

export const VoiceAssistant = ({ className }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      synthRef.current = speechSynthesis;
      
      // Configure speech recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          setIsListening(false);
          processCommand(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "There was an issue with voice recognition. Please try again.",
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Your browser doesn't support voice recognition. Please use Chrome, Safari, or Edge.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      // Call Supabase Edge Function for AI processing
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          message: command,
          conversationHistory: conversationHistory 
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success && data.error?.includes('API key')) {
        setNeedsApiKey(true);
        throw new Error('OpenAI API key not configured');
      }

      const responseText = data.response;
      setResponse(responseText);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: command },
        { role: 'assistant', content: responseText }
      ]);
      
      // Speak the response
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        synthRef.current.speak(utterance);
      }
      
    } catch (error) {
      console.error('Error processing command:', error);
      let errorResponse = "I'm sorry, I encountered an error processing your request.";
      
      if (error.message?.includes('API key')) {
        errorResponse = "I need an OpenAI API key to provide intelligent responses. Please configure your API key to continue.";
        setNeedsApiKey(true);
      }
      
      setResponse(errorResponse);
      
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(errorResponse);
        synthRef.current.speak(utterance);
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not available in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Browser Not Supported</h2>
          <p className="text-muted-foreground">
            Your browser doesn't support voice recognition. Please use Chrome, Safari, or Edge for the best experience.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen space-y-8 p-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold gradient-text">
          Nova AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your advanced AI assistant powered by OpenAI. Ask questions, get explanations, solve problems, and have natural conversations.
        </p>
      </div>

      {/* Main Voice Interface */}
      <div className="flex flex-col items-center space-y-8">
        {/* Waveform Visualizer */}
        <WaveformVisualizer isActive={isListening} isProcessing={isProcessing} />
        
        {/* Voice Button */}
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`voice-button w-20 h-20 rounded-full p-0 border-0 ${
            isListening ? 'active' : ''
          }`}
          size="lg"
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          ) : isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </Button>

        {/* Status Text */}
        <div className="text-center space-y-2">
          {isListening && (
            <p className="text-primary font-medium animate-pulse">
              Listening... Speak now
            </p>
          )}
          {isProcessing && (
            <p className="text-accent font-medium">
              Processing your request...
            </p>
          )}
          {!isListening && !isProcessing && (
            <p className="text-muted-foreground">
              Click the microphone to start
            </p>
          )}
        </div>
      </div>

      {/* Transcript and Response */}
      {(transcript || response) && (
        <div className="w-full max-w-2xl space-y-4">
          {transcript && (
            <Card className="p-4">
              <h3 className="font-semibold text-primary mb-2">You said:</h3>
              <p className="text-foreground">{transcript}</p>
            </Card>
          )}
          
          {response && (
            <Card className="p-4">
              <h3 className="font-semibold text-accent mb-2">Assistant:</h3>
              <p className="text-foreground">{response}</p>
            </Card>
          )}
        </div>
      )}

      {/* API Key Setup Notice */}
      {needsApiKey && (
        <div className="w-full max-w-2xl">
          <Card className="p-6 border-destructive bg-destructive/5">
            <h3 className="font-semibold text-destructive mb-4">🔑 OpenAI API Key Required</h3>
            <p className="text-muted-foreground mb-4">
              To enable advanced AI conversations like Nova AI, you need to configure your OpenAI API key in Supabase Edge Function Secrets.
            </p>
            <div className="text-sm space-y-2">
              <p><strong>Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to Edge Functions → Secrets</li>
                <li>Add secret: <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code></li>
                <li>Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary underline">OpenAI API Keys</a></li>
                <li>Refresh this page after adding the key</li>
              </ol>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Commands */}
      <div className="w-full max-w-4xl">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Try asking Nova AI:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Explain quantum physics"</strong> - Get detailed explanations
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Write a poem about space"</strong> - Creative writing
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Help me plan my day"</strong> - Personal assistance
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Solve this math problem"</strong> - Complex calculations
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Give me coding advice"</strong> - Programming help
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"What's the capital of..."</strong> - Knowledge questions
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Tell me a joke"</strong> - Entertainment
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Analyze this situation"</strong> - Thoughtful analysis
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Brainstorm ideas for..."</strong> - Creative assistance
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};