import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";

type CheckoutLabels = {
  payButton: string;
  continueCheckout: string;
};

export function useListingCheckout(itemId: string, labels: CheckoutLabels) {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const startCheckout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axios.post("/api/items/payment/initialize", {
        itemId,
        locale: router.locale === "am" ? "am" : "en",
      });
      const checkoutUrl = response.data?.checkoutUrl;
      if (typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://")) {
        throw new Error("Secure checkout link was not returned");
      }
      window.location.assign(checkoutUrl);
    } catch (error: any) {
      toast({
        title: "Could not start payment",
        description: error?.response?.data?.err || error?.message || "Please try again.",
        status: "error",
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  return { startCheckout, isLoading };
}
