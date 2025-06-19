// swaggerOptions.ts
const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Your API Documentation',
        version: '1.0.0',
        description: 'This is the API documentation for your Node server',
      },
      servers: [
        {
          url: 'http://localhost:' + process.env.PORT || 5000, // adjust your port accordingly
        },
      ],
    },
    apis: ['./routes/*.ts', './controllers/*.ts'], // Paths to files containing Swagger annotations
  };
  
  export default options;
  