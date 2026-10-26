import { prisma } from "@/lib/prisma";

export interface PaymentMethodConfig {
  enabled: boolean;
  account: string;
  beneficiary: string;
  instructions: string;
}

export interface PaymentConfig {
  INSTAPAY: PaymentMethodConfig;
  VODAFONE_CASH: PaymentMethodConfig;
}

const DEFAULT_CONFIG: PaymentConfig = {
  INSTAPAY: {
    enabled: true,
    account: "",
    beneficiary: "VENA Platform",
    instructions:
      "Send the exact amount via InstaPay to the account above. Include the payment reference in the transfer note. Then upload your receipt below.",
  },
  VODAFONE_CASH: {
    enabled: true,
    account: "",
    beneficiary: "VENA Platform",
    instructions:
      "Send the exact amount via Vodafone Cash to the number above. Include the payment reference in the transfer note. Then upload your receipt below.",
  },
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: { key: { startsWith: "PAYMENT_" } },
    });
    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      INSTAPAY: {
        enabled: map.get("PAYMENT_INSTAPAY_ENABLED") !== "false",
        account: map.get("PAYMENT_INSTAPAY_ACCOUNT") || "",
        beneficiary: map.get("PAYMENT_INSTAPAY_BENEFICIARY") || "VENA Platform",
        instructions: map.get("PAYMENT_INSTAPAY_INSTRUCTIONS") || DEFAULT_CONFIG.INSTAPAY.instructions,
      },
      VODAFONE_CASH: {
        enabled: map.get("PAYMENT_VODAFONE_CASH_ENABLED") !== "false",
        account: map.get("PAYMENT_VODAFONE_CASH_ACCOUNT") || "",
        beneficiary: map.get("PAYMENT_VODAFONE_CASH_BENEFICIARY") || "VENA Platform",
        instructions: map.get("PAYMENT_VODAFONE_CASH_INSTRUCTIONS") || DEFAULT_CONFIG.VODAFONE_CASH.instructions,
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function updatePaymentConfig(config: PaymentConfig): Promise<void> {
  const updates = [
    { key: "PAYMENT_INSTAPAY_ENABLED", value: String(config.INSTAPAY.enabled), type: "BOOLEAN" as const },
    { key: "PAYMENT_INSTAPAY_ACCOUNT", value: config.INSTAPAY.account, type: "STRING" as const },
    { key: "PAYMENT_INSTAPAY_BENEFICIARY", value: config.INSTAPAY.beneficiary, type: "STRING" as const },
    { key: "PAYMENT_INSTAPAY_INSTRUCTIONS", value: config.INSTAPAY.instructions, type: "STRING" as const },
    { key: "PAYMENT_VODAFONE_CASH_ENABLED", value: String(config.VODAFONE_CASH.enabled), type: "BOOLEAN" as const },
    { key: "PAYMENT_VODAFONE_CASH_ACCOUNT", value: config.VODAFONE_CASH.account, type: "STRING" as const },
    { key: "PAYMENT_VODAFONE_CASH_BENEFICIARY", value: config.VODAFONE_CASH.beneficiary, type: "STRING" as const },
    { key: "PAYMENT_VODAFONE_CASH_INSTRUCTIONS", value: config.VODAFONE_CASH.instructions, type: "STRING" as const },
  ];

  for (const u of updates) {
    await prisma.platformSetting.upsert({
      where: { key: u.key },
      create: u,
      update: { value: u.value },
    });
  }
}

export function snapshotPaymentConfig(
  config: PaymentConfig,
  method: string
): PaymentMethodConfig {
  const methodConfig = method === "INSTAPAY" ? config.INSTAPAY : config.VODAFONE_CASH;
  return { ...methodConfig };
}

export function generatePaymentReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VENA-${timestamp}-${random}`;
}

export function getEnabledMethods(config: PaymentConfig): string[] {
  const methods: string[] = [];
  if (config.INSTAPAY.enabled) methods.push("INSTAPAY");
  if (config.VODAFONE_CASH.enabled) methods.push("VODAFONE_CASH");
  return methods;
}