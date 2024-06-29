export function GET() {

    return new Response(null, {
        headers: {
            "Referrer-Policy": "strict-origin",
        }
    });
}