import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/auth-utils";
import { getPaymentConfig, getEnabledMethods } from "@/lib/paymentConfig";

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const config = await getPaymentConfig();
  const enabledMethods = getEnabledMethods(config);

  return NextResponse.json({
    methods: enabledMethods,
    config: {
      INSTAPAY: {
        account: config.INSTAPAY.account,
        beneficiary: config.INSTAPAY.beneficiary,
        instructions: config.INSTAPAY.instructions,
      },
      VODAFONE_CASH: {
        account: config.VODAFONE_CASH.account,
        beneficiary: config.VODAFONE_CASH.beneficiary,
        instructions: config.VODAFONE_CASH.instructions,
      },
    },
  });
}