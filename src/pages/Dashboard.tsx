import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const [documentType, setDocumentType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const documentTypes = [
    { value: "arrendamiento", label: "Contrato de Arrendamiento" },
    { value: "servicios", label: "Contrato de Servicios" },
    { value: "confidencialidad", label: "Acuerdo de Confidencialidad" },
    { value: "denuncia", label: "Denuncia" },
    { value: "compraventa", label: "Contrato de Compraventa" },
  ];

  const getFormFields = (type: string) => {
    const commonFields = [
      { name: "titulo", label: "Título del Documento", type: "text", required: true },
      { name: "parte1_nombre", label: "Nombre Parte 1", type: "text", required: true },
      { name: "parte1_identificacion", label: "Identificación Parte 1", type: "text", required: true },
      { name: "parte2_nombre", label: "Nombre Parte 2", type: "text", required: true },
      { name: "parte2_identificacion", label: "Identificación Parte 2", type: "text", required: true },
    ];

    switch (type) {
      case "arrendamiento":
        return [
          ...commonFields,
          { name: "direccion_inmueble", label: "Dirección del Inmueble", type: "text", required: true },
          { name: "canon_mensual", label: "Canon Mensual", type: "number", required: true },
          { name: "duracion_meses", label: "Duración (meses)", type: "number", required: true },
          { name: "deposito_garantia", label: "Depósito de Garantía", type: "number", required: true },
        ];
      case "servicios":
        return [
          ...commonFields,
          { name: "descripcion_servicio", label: "Descripción del Servicio", type: "textarea", required: true },
          { name: "valor_total", label: "Valor Total", type: "number", required: true },
          { name: "plazo_entrega", label: "Plazo de Entrega (días)", type: "number", required: true },
        ];
      case "confidencialidad":
        return [
          ...commonFields,
          { name: "informacion_confidencial", label: "Descripción de Información Confidencial", type: "textarea", required: true },
          { name: "duracion_anos", label: "Duración (años)", type: "number", required: true },
        ];
      case "denuncia":
        return [
          { name: "titulo", label: "Título de la Denuncia", type: "text", required: true },
          { name: "denunciante_nombre", label: "Nombre del Denunciante", type: "text", required: true },
          { name: "denunciante_identificacion", label: "Identificación del Denunciante", type: "text", required: true },
          { name: "denunciado_nombre", label: "Nombre del Denunciado", type: "text", required: true },
          { name: "hechos", label: "Descripción de los Hechos", type: "textarea", required: true },
          { name: "fecha_hechos", label: "Fecha de los Hechos", type: "date", required: true },
          { name: "lugar_hechos", label: "Lugar de los Hechos", type: "text", required: true },
        ];
      case "compraventa":
        return [
          ...commonFields,
          { name: "descripcion_bien", label: "Descripción del Bien", type: "textarea", required: true },
          { name: "precio_venta", label: "Precio de Venta", type: "number", required: true },
          { name: "forma_pago", label: "Forma de Pago", type: "text", required: true },
        ];
      default:
        return commonFields;
    }
  };

  const handleGeneratePDF = async () => {
    if (!documentType) {
      toast({
        title: "Error",
        description: "Por favor selecciona un tipo de documento",
        variant: "destructive",
      });
      return;
    }

    const fields = getFormFields(documentType);
    const missingFields = fields.filter(
      (field) => field.required && !formData[field.name]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Save document to database
      const { data: document, error: dbError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          document_type: documentType as Database["public"]["Enums"]["document_type"],
          title: formData.titulo || "Documento sin título",
          fields_data: formData,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Documento generado",
        description: "El documento se ha creado correctamente. La generación del PDF estará disponible pronto.",
      });

      // Reset form
      setFormData({});
      setDocumentType("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al generar el documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-primary" />
              Crear Documento Legal
            </CardTitle>
            <CardDescription>
              Completa el formulario para generar tu documento automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Selecciona un tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {documentType && (
              <div className="space-y-4 pt-4 border-t border-border">
                {getFormFields(documentType).map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleGeneratePDF}
                  disabled={loading}
                  className="w-full mt-6"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {loading ? "Generando documento..." : "Generar PDF"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
