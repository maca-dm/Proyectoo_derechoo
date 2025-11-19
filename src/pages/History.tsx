import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Document {
  id: string;
  document_type: string;
  title: string;
  created_at: string;
  file_url: string | null;
}

const History = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const documentTypeLabels: Record<string, string> = {
    arrendamiento: "Arrendamiento",
    servicios: "Servicios",
    confidencialidad: "Confidencialidad",
    denuncia: "Denuncia",
    compraventa: "Compraventa",
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado correctamente",
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar documento",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-primary" />
              Historial de Documentos
            </CardTitle>
            <CardDescription>
              Consulta y descarga tus documentos generados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando documentos...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tienes documentos generados todavía
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Badge variant="secondary">
                            {documentTypeLabels[doc.document_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{doc.title}</TableCell>
                        <TableCell>
                          {format(new Date(doc.created_at), "d 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            title="Generación de PDF próximamente"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default History;
