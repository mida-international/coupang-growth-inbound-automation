export async function hasProfile(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return false;
  }

  const response = await fetch(
    `${url}/rest/v1/Profile?id=eq.${encodeURIComponent(userId)}&select=id`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return false;
  }

  const data: unknown = await response.json();

  return Array.isArray(data) && data.length > 0;
}
