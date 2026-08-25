const required=["AUTH_SECRET","AUTH_GOOGLE_ID","AUTH_GOOGLE_SECRET","AUTH_URL"] as const;
const missing=required.filter((key)=>!process.env[key]?.trim());
if(missing.length)throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
if(process.env.AUTH_SECRET!.length<32)throw new Error("AUTH_SECRET must contain at least 32 characters.");
const authUrl=new URL(process.env.AUTH_URL!);if(authUrl.protocol!=="https:"&&authUrl.hostname!=="localhost")throw new Error("AUTH_URL must use HTTPS outside localhost.");
console.log("Production environment configuration is valid.");
