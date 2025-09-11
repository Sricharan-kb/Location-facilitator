import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase } from "lucide-react";

interface ProductInfoProps {
  productInfo?: {
    name: string;
    description: string;
    targetAudience: string;
    budget: string;
    productType: string;
  };
  onProductInfoChange?: (productInfo: {
    name: string;
    description: string;
    targetAudience: string;
    budget: string;
    productType: string;
  }) => void;
}

export const ProductInfo = ({ productInfo: initialProductInfo, onProductInfoChange }: ProductInfoProps) => {
  const [localProductInfo, setLocalProductInfo] = useState({
    name: initialProductInfo?.name || "Business Product",
    description: initialProductInfo?.description || "Product analysis for market expansion",
    targetAudience: initialProductInfo?.targetAudience || "General Market",
    budget: initialProductInfo?.budget || "Medium",
    productType: initialProductInfo?.productType || "Infrastructure"
  });

  // Update local state when props change
  useEffect(() => {
    if (initialProductInfo) {
      setLocalProductInfo(initialProductInfo);
    }
  }, [initialProductInfo]);

  // Debounced update to parent
  useEffect(() => {
    if (onProductInfoChange) {
      const timeoutId = setTimeout(() => {
        onProductInfoChange(localProductInfo);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [localProductInfo, onProductInfoChange]);

  const handleChange = (field: string, value: string) => {
    setLocalProductInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Project & Product Details
        </CardTitle>
        <CardDescription>
          Define the scope and details of your analysis project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name</Label>
          <Input 
            id="product-name" 
            placeholder="e.g., Solar Home Systems"
            value={localProductInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Textarea 
            id="product-description" 
            placeholder="A brief description of the product or service..."
            value={localProductInfo.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="budget">Budget Tier</Label>
            <Select value={localProductInfo.budget} onValueChange={(value) => handleChange('budget', value)}>
              <SelectTrigger id="budget">
                <SelectValue placeholder="Select a tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="affordable">Affordable</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-type">Product Type</Label>
            <Select value={localProductInfo.productType} onValueChange={(value) => handleChange('productType', value)}>
              <SelectTrigger id="product-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sanitation">Sanitation</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="energy">Energy</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-audience">Target Audience</Label>
          <Input 
            id="target-audience" 
            placeholder="e.g., Rural households, small businesses"
            value={localProductInfo.targetAudience}
            onChange={(e) => handleChange('targetAudience', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
