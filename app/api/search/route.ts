export async function GET() {
  return new Response(JSON.stringify({ message: 'Search functionality temporarily disabled during build' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST() {
  return new Response(JSON.stringify({ message: 'Search functionality temporarily disabled during build' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
