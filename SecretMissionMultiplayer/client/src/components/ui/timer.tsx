import { Clock } from "lucide-react";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  className?: string;
}

export default function Timer({ timeRemaining, totalTime, className = "" }: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeRemaining / totalTime;
  const circumference = 125.6;
  const offset = circumference - (progress * circumference);

  let colorClass = "text-accent";
  if (timeRemaining < 60) {
    colorClass = "text-destructive";
  } else if (timeRemaining < 180) {
    colorClass = "text-yellow-500";
  }

  return (
    <div className={`flex items-center bg-card border border-border rounded-xl px-4 py-3 ${className}`}>
      <div className="relative w-12 h-12 mr-3">
        <svg className="w-12 h-12 timer-ring">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted opacity-25"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            className={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`${colorClass} h-5 w-5`} />
        </div>
      </div>
      <div>
        <div className={`text-lg font-bold ${colorClass.replace('text-', 'text-')}`} data-testid="timer-display">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-xs text-muted-foreground">Time Left</div>
      </div>
    </div>
  );
}
