import { Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";

interface InvoiceDocumentsProps {
  documents: string[];
}

export function InvoiceDocuments({ documents }: InvoiceDocumentsProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Documentos adjuntos</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay documentos adjuntos.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc, index) => (
              <li key={`${doc}-${index}`}>
                <a
                  href={doc}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Paperclip className="h-4 w-4" />
                  Documento {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
