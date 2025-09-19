import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Wifi, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full mb-6">
            <div className="text-4xl">🎭</div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight" data-testid="title-main">
            Secret Missions
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-subtitle">
            The ultimate party game of deception and discovery
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Local Mode */}
          <Link href="/local" data-testid="link-local-mode">
            <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer group h-full">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mr-4">
                    <Users className="text-accent-foreground text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Local Mode</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Play together on one device. Perfect for parties and gatherings.
                </p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    Shared device gameplay
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    Privacy screens
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    4+ players
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Online Mode */}
          <Link href="/online" data-testid="link-online-mode">
            <Card className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer group h-full">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
                    <Wifi className="text-primary-foreground text-xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Online Mode</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Connect with friends remotely. Each player uses their own device.
                </p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    Private room codes
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    Real-time sync
                  </li>
                  <li className="flex items-center">
                    <Check className="text-accent mr-2 h-4 w-4" />
                    Voice chat support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent" data-testid="stat-games">1,247</div>
              <div className="text-muted-foreground text-sm">Games Played</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary" data-testid="stat-success">94%</div>
              <div className="text-muted-foreground text-sm">Success Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary" data-testid="stat-players">8.4</div>
              <div className="text-muted-foreground text-sm">Avg Players</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
