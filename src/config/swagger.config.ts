import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MEC Computer Club API",
      version: "1.0.0",
      description: "API documentation for MEC Computer Club backend",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Local server",
      },
    ],
  },

  // 👇 IMPORTANT: tell swagger where to look for docs
  apis: ["./src/docs/*.ts", "./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
