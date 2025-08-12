import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceAssistantProps {
  className?: string;
}

export const VoiceAssistant = ({ className }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  
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
      // Simple AI-like responses for common commands
      let responseText = generateResponse(command.toLowerCase());
      
      setResponse(responseText);
      
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
      const errorResponse = "I'm sorry, I encountered an error processing your request.";
      setResponse(errorResponse);
      
      if (synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(errorResponse);
        synthRef.current.speak(utterance);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateResponse = (command: string): string => {
    // Simple command processing - can be enhanced with real AI integration
    if (command.includes('hello') || command.includes('hi')) {
      return "Hello! I'm your personal voice assistant. How can I help you today?";
    }
    
    if (command.includes('time')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}.`;
    }
    
    if (command.includes('date')) {
      const now = new Date();
      return `Today is ${now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.`;
    }
    
    if (command.includes('weather')) {
      return "I'd love to help with the weather, but I need to be connected to a weather service. For now, I recommend checking your local weather app.";
    }
    
    if (command.includes('remind') || command.includes('reminder')) {
      return "I've noted your reminder request. In a full implementation, I would set up notifications for you.";
    }
    
    if (command.includes('play music') || command.includes('play song')) {
      return "I'd be happy to play music for you. In a full implementation, I would connect to your music streaming service.";
    }
    
    if (command.includes('calculate') || command.includes('math')) {
      return "I can help with calculations. Try asking me specific math questions like 'what is 25 times 4?'";
    }
    
    if (command.includes('search') || command.includes('look up')) {
      return "I can help you search for information. In a full implementation, I would perform web searches and provide results.";
    }
    
    // Basic math operations
    const mathMatch = command.match(/what is (\d+) (plus|minus|times|divided by) (\d+)/);
    if (mathMatch) {
      const [, num1, operation, num2] = mathMatch;
      const a = parseInt(num1);
      const b = parseInt(num2);
      let result = 0;
      
      switch (operation) {
        case 'plus':
          result = a + b;
          break;
        case 'minus':
          result = a - b;
          break;
        case 'times':
          result = a * b;
          break;
        case 'divided by':
          result = a / b;
          break;
      }
      
      return `${a} ${operation} ${b} equals ${result}.`;
    }
    
    return "I heard you say: '" + command + "'. I'm still learning, but I can help with time, date, simple math, and basic commands. What would you like me to do?";
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
          Voice Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Your personal AI assistant that works on any device. Press the microphone and speak your command.
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

      {/* Quick Commands */}
      <div className="w-full max-w-4xl">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Try these commands:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Hello"</strong> - Greet the assistant
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"What time is it?"</strong> - Get current time
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"What's the date?"</strong> - Get today's date
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"What is 25 times 4?"</strong> - Simple math
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Remind me to..."</strong> - Set reminders
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>"Play music"</strong> - Music commands
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};