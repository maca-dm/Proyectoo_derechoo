-- Create enum for document types
CREATE TYPE document_type AS ENUM (
  'arrendamiento',
  'servicios',
  'confidencialidad',
  'denuncia',
  'compraventa'
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  fields_data JSONB NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create legal terms table
CREATE TABLE public.legal_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access)
ALTER TABLE public.legal_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view legal terms"
  ON public.legal_terms
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample legal terms
INSERT INTO public.legal_terms (term, definition, category) VALUES
  ('Confidencialidad', 'Obligación de mantener en secreto información privada o sensible compartida entre las partes del contrato.', 'Protección de datos'),
  ('Responsabilidad civil', 'Obligación de reparar el daño causado a otra persona por acción u omisión, ya sea dolosa o culposa.', 'Responsabilidad'),
  ('Duración del contrato', 'Período de tiempo durante el cual el contrato tiene validez y las partes están obligadas a cumplir sus términos.', 'Vigencia'),
  ('Jurisdicción', 'Autoridad que tiene un juez o tribunal para conocer y resolver un asunto legal en un territorio determinado.', 'Legal'),
  ('Rescisión', 'Terminación anticipada del contrato por incumplimiento de una de las partes o por mutuo acuerdo.', 'Terminación'),
  ('Cláusula penal', 'Cantidad de dinero que una parte debe pagar a la otra en caso de incumplimiento del contrato.', 'Penalizaciones'),
  ('Fuerza mayor', 'Evento imprevisible e inevitable que impide el cumplimiento de las obligaciones contractuales.', 'Excepciones'),
  ('Notificaciones', 'Comunicaciones formales entre las partes del contrato respecto a temas relacionados con el mismo.', 'Comunicación');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);