import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Crosshair } from "lucide-react";
import type { Player } from "@shared/schema";

interface AccusationModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  roomId: string;
}

export default function AccusationModal({ isOpen, onClose, player, roomId }: AccusationModalProps) {
  const [accusation, setAccusation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitAccusationMutation = useMutation({
    mutationFn: async (guess: string) => {
      const currentPlayerId = localStorage.getItem("currentPlayerId");
      if (!currentPlayerId) {
        throw new Error("No player ID found - please rejoin the room");
      }
      
      const response = await apiRequest("POST", "/api/accusations", {
        roomId,
        accuserId: currentPlayerId,
        accusedId: player?.id,
        guess,
      });
      return response.json();
    },
    onSuccess: (data) => {
      const { isCorrect } = data;
      toast({
        title: isCorrect ? "Correct!" : "Wrong!",
        description: isCorrect 
          ? `You successfully identified ${player?.name}'s mission!`
          : "That wasn't their mission. You gained a strike.",
        variant: isCorrect ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit accusation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!accusation.trim()) {
      toast({
        title: "Empty Accusation",
        description: "Please enter your guess for their mission!",
        variant: "destructive",
      });
      return;
    }

    submitAccusationMutation.mutate(accusation);
  };

  const handleClose = () => {
    setAccusation("");
    onClose();
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center">
            <Crosshair className="text-destructive mr-2" />
            Accuse Player
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            What do you think <span className="font-semibold text-foreground">{player.name}</span>'s mission is?
          </p>
          
          <Textarea
            value={accusation}
            onChange={(e) => setAccusation(e.target.value)}
            placeholder="Enter your guess for their secret mission..."
            rows={4}
            className="bg-muted border-border resize-none"
            data-testid="textarea-accusation"
          />
          
          <div className="flex space-x-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              data-testid="button-cancel-accusation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitAccusationMutation.isPending}
              className="flex-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground"
              data-testid="button-submit-accusation"
            >
              {submitAccusationMutation.isPending ? "Submitting..." : "Submit Accusation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
