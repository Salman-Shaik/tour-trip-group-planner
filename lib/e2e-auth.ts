export function isE2EAuthEnabled(){
  return process.env.NODE_ENV!=="production"&&process.env.ROAMLY_E2E_AUTH==="true";
}
