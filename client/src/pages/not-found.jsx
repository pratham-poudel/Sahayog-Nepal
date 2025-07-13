import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Sorry, the page you are looking for doesn't exist.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Go back home
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
