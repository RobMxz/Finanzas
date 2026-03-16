import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import {
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfo,
  MdClose,
} from "react-icons/md";

const ToastContext = createContext(null);

const ICONS = {
  success: {
    icon: MdCheckCircle,
    color: "green.500",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  error: { icon: MdError, color: "red.500", bg: "#fef2f2", border: "#fecaca" },
  warning: {
    icon: MdWarning,
    color: "orange.500",
    bg: "#fff7ed",
    border: "#fed7aa",
  },
  info: { icon: MdInfo, color: "blue.500", bg: "#eff6ff", border: "#bfdbfe" },
};

function ToastItem({ toast, onRemove }) {
  const config = ICONS[toast.type] || ICONS.info;
  const Icon = config.icon;

  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), toast.duration || 3500);
    return () => clearTimeout(t);
  }, [toast.id]);

  return (
    <Box
      bg={config.bg}
      border="1px solid"
      borderColor={config.border}
      borderRadius="12px"
      px={4}
      py={3}
      boxShadow="0 8px 24px rgba(0,0,0,0.10)"
      minW="280px"
      maxW="360px"
      className="animate-slideInRight"
      position="relative"
      overflow="hidden"
    >
      {/* Barra de progreso */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        h="3px"
        bg={config.border}
        borderRadius="0 0 12px 12px"
        style={{
          animation: `shrink ${toast.duration || 3500}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <Flex align="flex-start" gap={3}>
        <Box color={config.color} flexShrink={0} mt={0.5}>
          <Icon size={18} />
        </Box>
        <Box flex={1}>
          {toast.title && (
            <Text fontSize="13px" fontWeight="600" color="gray.800" mb={0.5}>
              {toast.title}
            </Text>
          )}
          <Text fontSize="13px" color="gray.600" lineHeight="1.4">
            {toast.message}
          </Text>
        </Box>
        <Box
          cursor="pointer"
          color="gray.400"
          flexShrink={0}
          onClick={() => onRemove(toast.id)}
          _hover={{ color: "gray.600" }}
          transition="color 0.15s"
        >
          <MdClose size={15} />
        </Box>
      </Flex>
    </Box>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    ({ type = "info", title, message, duration }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Contenedor de toasts */}
      <Box
        position="fixed"
        bottom={{ base: "80px", md: "24px" }}
        right="16px"
        zIndex={9999}
      >
        <VStack gap={2} align="flex-end">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </VStack>
      </Box>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");

  return {
    success: (message, title) =>
      ctx.addToast({ type: "success", title, message }),
    error: (message, title) => ctx.addToast({ type: "error", title, message }),
    warning: (message, title) =>
      ctx.addToast({ type: "warning", title, message }),
    info: (message, title) => ctx.addToast({ type: "info", title, message }),
  };
}
