export function validateRequest(reqbody, schema) {
  
  const response = schema.safeParse(reqbody);
  // console.log(response);
  if (!response.success) {
    return { success: false, errors: response.error.errors };
  }

  return { success: true, data: response.data };
}
