import { prisma } from "../../../lib/prisma";
export const dynamic = 'force-dynamic';
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";

export async function GET(request: Request) {
  try {
    await requireRole(["administrator", "travel_designer"]);
    const approvals = await prisma.approvalRequest.findMany({
      include: {
        requestedBy: { select: { id: true, name: true, username: true } },
        decisions: {
          include: {
            decidedBy: { select: { id: true, name: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify(approvals), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
