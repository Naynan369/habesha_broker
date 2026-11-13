import { Flex, Image, Text, useColorModeValue } from "@chakra-ui/react";

/** Pairs the original Habesha emblem with the HB monogram on every surface. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const markSize = compact ? { base: "34px", sm: "38px" } : { base: "40px", sm: "44px" };
  const monogramColor = useColorModeValue("#2b1e17", "#f4e8d9");

  return (
    <Flex
      role="img"
      aria-label="Habesha Brokers, HB"
      align="center"
      gap={{ base: 1, sm: 2 }}
      flexShrink={0}
      h={compact ? { base: "38px", sm: "42px" } : { base: "44px", sm: "50px" }}
      whiteSpace="nowrap"
    >
      <Image
        aria-hidden="true"
        alt=""
        src="/habesha-mark.png"
        w={markSize}
        h={markSize}
        objectFit="contain"
      />
      <Text
        aria-hidden="true"
        color={monogramColor}
        fontSize={{ base: compact ? "xl" : "2xl", sm: "3xl" }}
        fontWeight="extrabold"
        lineHeight="1"
        letterSpacing="-.065em"
        fontFamily="var(--font-space-grotesk), sans-serif"
      >
        HB
      </Text>
    </Flex>
  );
}
