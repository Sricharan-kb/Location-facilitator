import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  MapPin, 
  Database,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileProcessed: (data: any, columns: string[]) => void;
}

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setUploadProgress(0);

    for (const file of acceptedFiles) {
      try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Process the file based on type
        if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          
          if (data.features && data.features.length > 0) {
            const sampleFeature = data.features[0];
            const columns = Object.keys(sampleFeature.properties || {});
            onFileProcessed(data, columns);
            toast.success(`GeoJSON file processed: ${data.features.length} features found`);
          }
        } else if (file.name.endsWith('.csv')) {
          // For CSV files, we'll use Papa Parse (already added as dependency)
          const Papa = await import('papaparse');
          const text = await file.text();
          
          Papa.parse(text, {
            header: true,
            complete: (results) => {
              const columns = results.meta.fields || [];
              onFileProcessed(results.data, columns);
              toast.success(`CSV file processed: ${results.data.length} rows found`);
            },
            error: (error) => {
              toast.error(`Error parsing CSV: ${error.message}`);
            }
          });
        }

        setUploadedFiles(prev => [...prev, file]);
      } catch (error) {
        toast.error(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsProcessing(false);
    setUploadProgress(0);
  }, [onFileProcessed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json', '.geojson'],
      'text/csv': ['.csv'],
      'application/vnd.apache.parquet': ['.parquet']
    },
    multiple: true
  });

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
      return <MapPin className="w-4 h-4 text-geo-success" />;
    }
    if (fileName.endsWith('.csv')) {
      return <FileText className="w-4 h-4 text-primary" />;
    }
    if (fileName.endsWith('.parquet')) {
      return <Database className="w-4 h-4 text-geo-cluster" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Data Upload
        </CardTitle>
        <CardDescription>
          Upload spatial data files (GeoJSON, CSV, Parquet) to begin analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-primary">Drop files here</p>
                <p className="text-sm text-muted-foreground">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium">Drag & drop files here</p>
                <p className="text-sm text-muted-foreground">
                  or <Button variant="link" className="p-0 h-auto">click to browse</Button>
                </p>
                <div className="flex gap-2 mt-2 justify-center">
                  <Badge variant="secondary">.geojson</Badge>
                  <Badge variant="secondary">.csv</Badge>
                  <Badge variant="secondary">.parquet</Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-geo-success" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};