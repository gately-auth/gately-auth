/**
 * Type definitions for API documentation
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type ParameterLocation = 'header' | 'body' | 'query' | 'path';

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  location: ParameterLocation;
  example?: any;
  default?: any;
  enum?: string[];
}

export interface ApiResponse {
  status: number;
  description: string;
  schema?: Record<string, any>;
  example?: any;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: {
    required: boolean;
    contentType: string;
    schema?: Record<string, any>;
    example?: any;
  };
  responses: ApiResponse[];
  authRequired: boolean;
  tags?: string[];
}

export interface ApiDocArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  article_type: 'article' | 'api_reference';
  api_method?: HttpMethod;
  api_path?: string;
  api_base_url?: string;
  api_auth_required?: boolean;
  api_request_schema?: Record<string, any>;
  api_response_schema?: Record<string, any>;
  api_examples?: {
    request?: any;
    responses?: ApiResponse[];
  };
}
