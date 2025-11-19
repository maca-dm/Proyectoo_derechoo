import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";

interface LegalTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
}

const LegalTerms = () => {
  const [terms, setTerms] = useState<LegalTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<LegalTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTerms();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = terms.filter(
        (term) =>
          term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          term.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTerms(filtered);
    } else {
      setFilteredTerms(terms);
    }
  }, [searchQuery, terms]);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from("legal_terms")
        .select("*")
        .order("term", { ascending: true });

      if (error) throw error;

      setTerms(data || []);
      setFilteredTerms(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar términos legales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="h-6 w-6 text-primary" />
              Glosario de Términos Legales
            </CardTitle>
            <CardDescription>
              Consulta las definiciones de cláusulas y términos comunes en documentos legales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar término o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando términos...</p>
          </div>
        ) : filteredTerms.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No se encontraron términos que coincidan con tu búsqueda
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTerms.map((term) => (
              <Card key={term.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{term.term}</CardTitle>
                    <Badge variant="outline">{term.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {term.definition}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LegalTerms;
