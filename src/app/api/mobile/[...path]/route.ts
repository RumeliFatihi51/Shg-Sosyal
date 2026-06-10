import { NextResponse, type NextRequest } from "next/server";
import { corsHeaders } from "../_lib/shared";
import { handleMobileRequest, type MobileRouteContext } from "../_lib/handlers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export function GET(request: NextRequest, context: MobileRouteContext) {
  return handleMobileRequest(request, context, "GET");
}

export function POST(request: NextRequest, context: MobileRouteContext) {
  return handleMobileRequest(request, context, "POST");
}

export function PUT(request: NextRequest, context: MobileRouteContext) {
  return handleMobileRequest(request, context, "PUT");
}

export function DELETE(request: NextRequest, context: MobileRouteContext) {
  return handleMobileRequest(request, context, "DELETE");
}
