import { PaymentMethod } from "@/types";

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  enabled: boolean;
  requiresProof: boolean;
  requiresReference: boolean;
  instructions: string[];
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: "INSTAPAY",
    name: "InstaPay",
    enabled: true,
    requiresProof: true,
    requiresReference: true,
    instructions: [
      "Open your InstaPay app.",
      "Transfer the exact amount to: example@instapay.vena",
      "Copy the transaction reference number.",
      "Take a screenshot of the confirmation.",
      "Upload the screenshot and paste the reference below.",
    ]
  },
  {
    id: "VODAFONE_CASH",
    name: "Vodafone Cash",
    enabled: true,
    requiresProof: true,
    requiresReference: true,
    instructions: [
      "Open your Vodafone Cash app.",
      "Send the amount to: 01000000000",
      "Note the transaction reference SMS.",
      "Take a screenshot of the confirmation.",
      "Upload the screenshot and enter the reference below.",
    ]
  },
  {
    id: "CASH",
    name: "Cash Payment",
    enabled: true,
    requiresProof: false,
    requiresReference: false,
    instructions: [
      "Visit our physical registration desk.",
      "Pay the exact amount to the cashier.",
      "The cashier will manually approve your enrollment.",
      "No upload is required for this method.",
    ]
  }
];