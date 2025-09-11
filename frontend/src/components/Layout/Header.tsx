import { Button } from "@/components/ui/button";
import { 
  Map, 
  Database, 
  Download, 
  Settings, 
  FileSpreadsheet,
  BarChart3
} from "lucide-react";

interface HeaderProps {
  onExport: () => void;
  onSettings: () => void;
}

export const Header = ({ onExport, onSettings }: HeaderProps) => {
  return (
    <header className="h-16 bg-card border-b border-border shadow-panel flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Map className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">GeoSuitability</h1>
            <p className="text-xs text-muted-foreground">Spatial Analysis Platform</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">Data</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Analysis</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <Database className="w-4 h-4" />
          <span className="hidden sm:inline">Connect DB</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};