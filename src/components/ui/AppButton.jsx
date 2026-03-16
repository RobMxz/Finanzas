import { Button } from "@chakra-ui/react";

export default function AppButton({ children, leftIcon, rightIcon, ...props }) {
  return (
    <Button
      borderRadius="10px"
      gap={leftIcon || rightIcon ? 2 : undefined}
      fontFamily="'DM Sans', sans-serif"
      fontWeight="500"
      fontSize="14px"
      transition="all 0.15s ease"
      _active={{ transform: "scale(0.98)" }}
      {...props}
    >
      {leftIcon && leftIcon}
      {children}
      {rightIcon && rightIcon}
    </Button>
  );
}
