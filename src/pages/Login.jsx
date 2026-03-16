import { useState } from "react";
import {
  Box,
  Input,
  Text,
  Heading,
  VStack,
  HStack,
  Card,
  Field,
} from "@chakra-ui/react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import AppButton from "../components/ui/AppButton";
import { useColorTheme } from "../hooks/useColorTheme";
import useAppStore from "../store/useAppStore";

export default function Login() {
  const { signIn, signUp } = useAppStore();
  const c = useColorTheme();

  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setMensaje(null);
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (modo === "registro" && !nombre) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    setLoading(true);
    try {
      if (modo === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, nombre);
        setMensaje("¡Cuenta creada! Revisa tu correo para confirmarla.");
        setModo("login");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={c.bgPage}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      {/* Botón modo oscuro */}
      <Box position="fixed" top={4} right={4}>
        <AppButton
          variant="ghost"
          size="sm"
          onClick={c.toggleColorMode}
          color={c.textMuted}
          _hover={{ bg: c.bgHover }}
          w="40px"
          h="40px"
          p={0}
          leftIcon={
            c.isDark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />
          }
        />
      </Box>

      <Card.Root
        w="full"
        maxW="420px"
        boxShadow="lg"
        borderRadius="xl"
        bg={c.bgCard}
        borderColor={c.borderColor}
      >
        <Card.Body p={8}>
          <VStack gap={6} align="stretch">
            {/* Título */}
            <VStack gap={1} align="center">
              <Text fontSize="3xl">💰</Text>
              <Heading size="lg" textAlign="center" color={c.textPrimary}>
                Finanzas Personales
              </Heading>
              <Text fontSize="sm" color={c.textSecondary} textAlign="center">
                {modo === "login"
                  ? "Inicia sesión en tu cuenta"
                  : "Crea tu cuenta gratuita"}
              </Text>
            </VStack>

            {/* Campos */}
            <VStack gap={4} align="stretch">
              {modo === "registro" && (
                <Field.Root>
                  <Field.Label
                    fontSize="sm"
                    fontWeight="medium"
                    color={c.textPrimary}
                  >
                    Nombre
                  </Field.Label>
                  <Input
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    bg={c.bgInput}
                    borderColor={c.borderColor}
                    color={c.textPrimary}
                    borderRadius="lg"
                  />
                </Field.Root>
              )}

              <Field.Root>
                <Field.Label
                  fontSize="sm"
                  fontWeight="medium"
                  color={c.textPrimary}
                >
                  Correo electrónico
                </Field.Label>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg={c.bgInput}
                  borderColor={c.borderColor}
                  color={c.textPrimary}
                  borderRadius="lg"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label
                  fontSize="sm"
                  fontWeight="medium"
                  color={c.textPrimary}
                >
                  Contraseña
                </Field.Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  bg={c.bgInput}
                  borderColor={c.borderColor}
                  color={c.textPrimary}
                  borderRadius="lg"
                />
              </Field.Root>
            </VStack>

            {/* Mensajes */}
            {error && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="red.600">
                  ⚠️ {error}
                </Text>
              </Box>
            )}
            {mensaje && (
              <Box
                bg="green.50"
                border="1px solid"
                borderColor="green.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="green.600">
                  ✅ {mensaje}
                </Text>
              </Box>
            )}

            {/* Botón principal */}
            <AppButton
              colorPalette="green"
              size="md"
              w="full"
              loading={loading}
              loadingText={
                modo === "login" ? "Ingresando..." : "Creando cuenta..."
              }
              onClick={handleSubmit}
            >
              {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </AppButton>

            {/* Cambiar modo */}
            <HStack justify="center" gap={1}>
              <Text fontSize="sm" color={c.textSecondary}>
                {modo === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
              </Text>
              <AppButton
                variant="plain"
                size="sm"
                color="green.500"
                fontWeight="semibold"
                p={0}
                h="auto"
                onClick={() => {
                  setModo(modo === "login" ? "registro" : "login");
                  setError(null);
                  setMensaje(null);
                }}
              >
                {modo === "login" ? "Regístrate" : "Inicia sesión"}
              </AppButton>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
