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
  FileJson,
  Braces
} from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onFileProcessed: (data: any, columns: string[], metadata?: Record<string, string>) => void;
}

export const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<Record<string, string> | null>(null);
  const [isProcessingMeta, setIsProcessingMeta] = useState(false);

  // --- Spatial data drop ---
  const onDropSpatial = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setUploadProgress(0);

    for (const file of acceptedFiles) {
      try {
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 80));
        }

        if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.features && data.features.length > 0) {
            const columns = Object.keys(data.features[0].properties || {});
            onFileProcessed(data, columns, parsedMetadata ?? undefined);
            toast.success(`GeoJSON processed: ${data.features.length} features`);
          }
        } else if (file.name.endsWith('.csv')) {
          const Papa = await import('papaparse');
          const text = await file.text();
          Papa.parse(text, {
            header: true,
            complete: (results) => {
              const columns = results.meta.fields || [];
              onFileProcessed(results.data, columns, parsedMetadata ?? undefined);
              toast.success(`CSV processed: ${results.data.length} rows`);
            },
            error: (error) => toast.error(`Error parsing CSV: ${error.message}`)
          });
        } else if (file.name.endsWith('.parquet')) {
          const [{ readParquet }, { tableFromIPC }] = await Promise.all([
            import('parquet-wasm'),
            import('apache-arrow')
          ]);
          const arrayBuffer = await file.arrayBuffer();
          const arrowUint8Array = readParquet(new Uint8Array(arrayBuffer));
          const table = tableFromIPC(arrowUint8Array);
          const columns = table.schema.fields.map(f => f.name);
          const data = table.toArray().map(row => row.toJSON());
          onFileProcessed(data, columns, parsedMetadata ?? undefined);
          toast.success(`Parquet processed: ${data.length} rows`);
        }

        setUploadedFiles(prev => [...prev, file]);
      } catch (error) {
        toast.error(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsProcessing(false);
    setUploadProgress(0);
  }, [onFileProcessed, parsedMetadata]);

  // --- Metadata drop ---
  const onDropMeta = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsProcessingMeta(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Accept both { "col": "description" } and { "columns": { "col": "description" } }
      const flat: Record<string, string> = parsed.columns ?? parsed;
      // Validate: all values should be strings
      const validated: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat)) {
        if (typeof v === 'string') validated[k] = v;
        else if (typeof v === 'object' && v !== null && 'description' in v) {
          validated[k] = (v as any).description;
        }
      }
      setParsedMetadata(validated);
      setMetadataFile(file);
      toast.success(`Metadata loaded: ${Object.keys(validated).length} column descriptions`);
    } catch {
      toast.error('Invalid metadata file. Expected JSON with column descriptions.');
    }
    setIsProcessingMeta(false);
  }, []);

  const { getRootProps: getSpatialProps, getInputProps: getSpatialInput, isDragActive: isSpatialDrag } = useDropzone({
    onDrop: onDropSpatial,
    accept: {
      'application/json': ['.json', '.geojson'],
      'text/csv': ['.csv'],
      'application/vnd.apache.parquet': ['.parquet']
    },
    multiple: true
  });

  const { getRootProps: getMetaProps, getInputProps: getMetaInput, isDragActive: isMetaDrag } = useDropzone({
    onDrop: onDropMeta,
    accept: { 'application/json': ['.json'] },
    multiple: false
  });

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) return <MapPin className="w-4 h-4 text-geo-success" />;
    if (fileName.endsWith('.csv')) return <FileText className="w-4 h-4 text-primary" />;
    if (fileName.endsWith('.parquet')) return <Database className="w-4 h-4 text-geo-cluster" />;
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
          Upload spatial data and an optional metadata file to enable AI feature recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Spatial data drop zone */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Spatial Data</p>
          <div
            {...getSpatialProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isSpatialDrag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <input {...getSpatialInput()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              {isSpatialDrag ? (
                <p className="text-base font-medium text-primary">Drop here</p>
              ) : (
                <>
                  <p className="text-base font-medium">Drag & drop spatial file</p>
                  <p className="text-sm text-muted-foreground">or <Button variant="link" className="p-0 h-auto">click to browse</Button></p>
                  <div className="flex gap-2 mt-1 justify-center flex-wrap">
                    <Badge variant="secondary">.geojson</Badge>
                    <Badge variant="secondary">.csv</Badge>
                    <Badge variant="secondary">.parquet</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span>Processing…</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Metadata drop zone */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Column Metadata</p>
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </div>

          {metadataFile ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Braces className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{metadataFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(parsedMetadata ?? {}).length} column descriptions loaded — AI recommendations enabled
                </p>
              </div>
              <CheckCircle className="w-4 h-4 text-geo-success shrink-0" />
            </div>
          ) : (
            <div
              {...getMetaProps()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                isMetaDrag ? 'border-primary bg-primary/5' : 'border-border border-dashed hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <input {...getMetaInput()} />
              <div className="flex flex-col items-center gap-2">
                <FileJson className="w-8 h-8 text-muted-foreground/60" />
                {isMetaDrag ? (
                  <p className="text-sm text-primary font-medium">Drop metadata file</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Drop a <span className="font-medium text-foreground">metadata.json</span> to enable AI column recommendations
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Format: <code className="bg-muted px-1 rounded">{"{ \"column_name\": \"plain english description\" }"}</code>
                    </p>
                    <Badge variant="secondary" className="text-xs">.json</Badge>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Uploaded spatial files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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