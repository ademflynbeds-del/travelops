import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
export const dynamic = 'force-dynamic';
import { requireRole } from "../../../lib/apiAuth";
import { handleApiError } from "../../../lib/apiResponse";
import { logAudit } from "../../../lib/audit";

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

export async function POST(request: Request) {
  try {
    const session = await requireRole(["administrator", "travel_designer", "sales_agent"]);
    const payload = await request.json();

    // Basic validation
    if (!payload.entityType || !payload.entityId) {
      return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 });
    }

    const created = await prisma.approvalRequest.create({
      data: {
        entityType: payload.entityType,
        entityId: payload.entityId,
        requestedById: session.user.id,
        status: "pending",
      },
    });

    await logAudit({
      entityType: "ApprovalRequest",
      entityId: created.id,
      action: "create",
      actorId: session.user.id,
      afterJson: created,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
