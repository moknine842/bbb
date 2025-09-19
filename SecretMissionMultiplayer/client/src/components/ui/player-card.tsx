import { Card, CardContent } from "./card";
import { Button } from "./button";
import type { Player } from "@shared/schema";

interface PlayerCardProps {
  player: Player;
  onAccuse?: () => void;
  eliminated?: boolean;
  className?: string;
}

export default function PlayerCard({ player, onAccuse, eliminated = false, className = "" }: PlayerCardProps) {
  const getPlayerColor = (name: string) => {
    const colors = [
      "bg-secondary",
      "bg-accent", 
      "bg-yellow-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-blue-500"
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Card className={`bg-card border-border hover:bg-card/80 transition-colors ${eliminated ? 'opacity-60' : ''} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-10 h-10 ${eliminated ? 'bg-muted' : getPlayerColor(player.name)} rounded-full flex items-center justify-center mr-3`}>
              <span className={`${eliminated ? 'text-muted-foreground' : 'text-white'} font-bold`}>
                {player.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-foreground" data-testid="player-name">
                {player.name}
              </div>
              <div className={`text-xs ${eliminated ? 'text-destructive' : 'text-accent'}`}>
                {eliminated ? 'Eliminated' : 'Active'}
              </div>
            </div>
          </div>
          {!eliminated && onAccuse && (
            <Button
              onClick={onAccuse}
              size="sm"
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
              data-testid="button-accuse"
            >
              Accuse
            </Button>
          )}
          {eliminated && (
            <div className="bg-destructive/20 text-destructive px-3 py-1 rounded-lg text-sm font-medium">
              Out
            </div>
          )}
        </div>
        
        {eliminated && player.mission && (
          <div className="text-xs text-muted-foreground mb-2">
            Mission: {player.mission}
          </div>
        )}
        
        {!eliminated && (
          <>
            <div className="text-xs text-muted-foreground mb-2">
              Last seen: {getRandomActivity()}
            </div>
            <div className="flex space-x-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (player.strikes || 0) ? 'bg-destructive' : 'bg-muted'
                  }`}
                  data-testid={`strike-${i}`}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getRandomActivity(): string {
  const activities = [
    "Acting suspiciously near the kitchen",
    "Asking everyone about their favorite colors", 
    "Whispering to other players",
    "Looking around nervously",
    "Trying to change the subject",
    "Making everyone laugh",
    "Being unusually quiet",
    "Checking their phone constantly"
  ];
  
  return activities[Math.floor(Math.random() * activities.length)];
}
