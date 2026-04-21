// src/config/awsSesConfig.ts
import { SESClient } from "@aws-sdk/client-ses";

const Configs = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default Configs;
