export async function GET() {
  try {
    return Response.json({
      message: "Found DATA",
      data: JSON.stringify({ name: "successfully message send" }),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
    }

    return Response.json({ message: "NOT FOUND" });
  }
}
