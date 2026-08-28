import {NextRequest,NextResponse} from "next/server";
import {verifyPaystack} from "@/lib/paystack";
import {recordSuccessfulPayment} from "@/lib/record-payment";
export async function GET(request:NextRequest){const reference=request.nextUrl.searchParams.get("reference")||request.nextUrl.searchParams.get("trxref");if(!reference)return NextResponse.redirect(new URL("/dashboard/payments?payment=failed",request.url));try{const transaction=await verifyPaystack(reference);await recordSuccessfulPayment(reference,transaction);return NextResponse.redirect(new URL("/dashboard/payments?payment=success",request.url))}catch(error){console.error("Paystack callback failed",error);return NextResponse.redirect(new URL("/dashboard/payments?payment=failed",request.url))}}
