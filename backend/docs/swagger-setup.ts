import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

/**
 * Setup Swagger UI for API documentation
 * @param app Express application instance
 */
export function setupSwagger(app: Express): void {
  try {
    // Load OpenAPI specification
    const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
    
    // Swagger UI options
    const options = {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'LabTech GeoLab API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        }
      }
    };
    
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument, options));
    
    // Serve raw OpenAPI spec
    app.get('/api-docs/openapi.yaml', (req, res) => {
      res.sendFile(path.join(__dirname, 'openapi.yaml'));
    });
    
    app.get('/api-docs/openapi.json', (req, res) => {
      res.json(swaggerDocument);
    });
    
    console.log('✓ Swagger UI available at /api-docs');
    console.log('✓ OpenAPI spec available at /api-docs/openapi.yaml');
  } catch (error) {
    console.error('Failed to setup Swagger UI:', error);
  }
}
