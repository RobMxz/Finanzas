import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  VStack,
  HStack,
  Input,
  Spinner,
} from "@chakra-ui/react";
import {
  MdPerson,
  MdLock,
  MdDelete,
  MdSave,
  MdLightMode,
  MdDarkMode,
  MdLogout,
} from "react-icons/md";
import AppButton from "../components/ui/AppButton";
import { useColorTheme } from "../hooks/useColorTheme";
import useAppStore from "../store/useAppStore";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";

// ── Sección con título ────────────────────────────────
function Section({ title, children }) {
  const c = useColorTheme();
  const toast = useToast();
  return (
    <Box
      bg={c.bgCard}
      border="1px solid"
      borderColor={c.borderColor}
      borderRadius="xl"
      overflow="hidden"
    >
      <Box
        px={{ base: 4, md: 5 }}
        py={3}
        borderBottom="1px solid"
        borderColor={c.borderColor}
        bg={c.bgHover}
      >
        <Text fontSize="sm" fontWeight="semibold" color={c.textPrimary}>
          {title}
        </Text>
      </Box>
      <Box p={{ base: 4, md: 5 }}>{children}</Box>
    </Box>
  );
}

export default function Profile() {
  const c = useColorTheme();
  const navigate = useNavigate();
  const { user, signOut } = useAppStore();

  const nombreInicial = user?.user_metadata?.nombre || "";
  const email = user?.email || "";

  // ── Form: datos personales ────────────────────────
  const [nombre, setNombre] = useState(nombreInicial);
  const [nombreLoading, setNombreLoading] = useState(false);
  const [nombreMsg, setNombreMsg] = useState(null);
  const [nombreError, setNombreError] = useState(null);

  // ── Form: cambiar contraseña ──────────────────────
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [passError, setPassError] = useState(null);

  // ── Eliminar cuenta ───────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // ── Guardar nombre ────────────────────────────────
  const handleGuardarNombre = async () => {
    setNombreError(null);
    setNombreMsg(null);
    if (!nombre.trim()) {
      setNombreError("El nombre no puede estar vacío.");
      return;
    }
    setNombreLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nombre: nombre.trim() },
      });
      if (error) throw error;
      await supabase
        .from("profiles")
        .update({ nombre: nombre.trim() })
        .eq("user_id", user.id);
      setNombreMsg("¡Nombre actualizado correctamente!");
      toast.success("Nombre actualizado correctamente", "¡Listo!");
    } catch (err) {
      setNombreError(err.message);
      toast.error(err.message, "Error");
    } finally {
      setNombreLoading(false);
    }
  };

  // ── Cambiar contraseña ────────────────────────────
  const handleCambiarPassword = async () => {
    setPassError(null);
    setPassMsg(null);
    if (!passNueva || passNueva.length < 6) {
      setPassError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (passNueva !== passConfirm) {
      setPassError("Las contraseñas no coinciden.");
      return;
    }
    setPassLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: passActual,
      });
      if (signInError) throw new Error("La contraseña actual es incorrecta.");
      const { error } = await supabase.auth.updateUser({ password: passNueva });
      if (error) throw error;
      setPassMsg("¡Contraseña actualizada correctamente!");
      toast.success("Contraseña actualizada correctamente", "¡Listo!");
      setPassActual("");
      setPassNueva("");
      setPassConfirm("");
    } catch (err) {
      setPassError(err.message);
      toast.error(err.message, "Error");
    } finally {
      setPassLoading(false);
    }
  };

  // ── Cerrar sesión ─────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  // ── Eliminar cuenta ───────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (deleteInput !== email) {
      setDeleteError("El email ingresado no coincide.");
      return;
    }
    setDeleteLoading(true);
    try {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      await supabase.from("budgets").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase
        .from("savings_contributions")
        .delete()
        .eq("user_id", user.id);
      await supabase.from("savings_goals").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      await signOut();
      navigate("/login");
    } catch (err) {
      setDeleteError(err.message);
      toast.error(err.message, "Error al eliminar cuenta");
      setDeleteLoading(false);
    }
  };

  const inputStyle = {
    bg: c.bgInput,
    borderColor: c.borderColor,
    color: c.textPrimary,
    borderRadius: "lg",
  };

  const inicial = (user?.user_metadata?.nombre || email)
    .charAt(0)
    .toUpperCase();

  return (
    <Box maxW="600px" mx="auto">
      {/* ── Header ── */}
      <Box mb={5}>
        <Heading size={{ base: "md", md: "lg" }} color={c.textPrimary}>
          Perfil
        </Heading>
        <Text fontSize="sm" color={c.textSecondary} mt={0.5}>
          Administra tu cuenta y preferencias
        </Text>
      </Box>

      {/* ── Avatar + info ── */}
      <Box
        bg={c.bgCard}
        border="1px solid"
        borderColor={c.borderColor}
        borderRadius="xl"
        p={{ base: 4, md: 5 }}
        mb={4}
      >
        <Flex align="center" gap={4}>
          <Flex
            w="64px"
            h="64px"
            borderRadius="full"
            bg="green.500"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Text fontSize="2xl" fontWeight="bold" color="white">
              {inicial}
            </Text>
          </Flex>
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={c.textPrimary}>
              {user?.user_metadata?.nombre || "Sin nombre"}
            </Text>
            <Text fontSize="sm" color={c.textSecondary}>
              {email}
            </Text>
            <Text fontSize="xs" color={c.textMuted} mt={0.5}>
              Miembro desde{" "}
              {new Date(user?.created_at).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </Box>
        </Flex>
      </Box>

      <VStack gap={4} align="stretch">
        {/* ── Datos personales ── */}
        <Section title="👤 Datos personales">
          <VStack gap={4} align="stretch">
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={c.textPrimary}
                mb={2}
              >
                Nombre
              </Text>
              <Input
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setNombreMsg(null);
                  setNombreError(null);
                }}
                placeholder="Tu nombre"
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={c.textPrimary}
                mb={2}
              >
                Correo electrónico
              </Text>
              <Input
                value={email}
                disabled
                {...inputStyle}
                opacity={0.6}
                cursor="not-allowed"
              />
              <Text fontSize="xs" color={c.textMuted} mt={1}>
                El correo no se puede cambiar
              </Text>
            </Box>

            {nombreError && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="red.600">
                  ⚠️ {nombreError}
                </Text>
              </Box>
            )}
            {nombreMsg && (
              <Box
                bg="green.50"
                border="1px solid"
                borderColor="green.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="green.600">
                  ✅ {nombreMsg}
                </Text>
              </Box>
            )}

            <AppButton
              colorPalette="green"
              loading={nombreLoading}
              loadingText="Guardando..."
              onClick={handleGuardarNombre}
              leftIcon={<MdSave size={16} />}
            >
              Guardar nombre
            </AppButton>
          </VStack>
        </Section>

        {/* ── Apariencia ── */}
        <Section title="🎨 Apariencia">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={c.textPrimary}>
                Modo {c.isDark ? "oscuro" : "claro"}
              </Text>
              <Text fontSize="xs" color={c.textSecondary}>
                {c.isDark ? "Cambia al modo claro" : "Cambia al modo oscuro"}
              </Text>
            </Box>
            <AppButton
              variant="outline"
              size="sm"
              borderColor={c.borderColor}
              color={c.textSecondary}
              onClick={c.toggleColorMode}
              leftIcon={
                c.isDark ? <MdLightMode size={16} /> : <MdDarkMode size={16} />
              }
            >
              {c.isDark ? "Modo claro" : "Modo oscuro"}
            </AppButton>
          </Flex>
        </Section>

        {/* ── Cambiar contraseña ── */}
        <Section title="🔒 Cambiar contraseña">
          <VStack gap={4} align="stretch">
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={c.textPrimary}
                mb={2}
              >
                Contraseña actual
              </Text>
              <Input
                type="password"
                placeholder="••••••••"
                value={passActual}
                onChange={(e) => {
                  setPassActual(e.target.value);
                  setPassError(null);
                }}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={c.textPrimary}
                mb={2}
              >
                Nueva contraseña
              </Text>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passNueva}
                onChange={(e) => {
                  setPassNueva(e.target.value);
                  setPassError(null);
                }}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={c.textPrimary}
                mb={2}
              >
                Confirmar nueva contraseña
              </Text>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                value={passConfirm}
                onChange={(e) => {
                  setPassConfirm(e.target.value);
                  setPassError(null);
                }}
                {...inputStyle}
              />
            </Box>

            {passError && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="red.600">
                  ⚠️ {passError}
                </Text>
              </Box>
            )}
            {passMsg && (
              <Box
                bg="green.50"
                border="1px solid"
                borderColor="green.200"
                borderRadius="lg"
                p={3}
              >
                <Text fontSize="sm" color="green.600">
                  ✅ {passMsg}
                </Text>
              </Box>
            )}

            <AppButton
              colorPalette="green"
              variant="outline"
              loading={passLoading}
              loadingText="Actualizando..."
              onClick={handleCambiarPassword}
              leftIcon={<MdLock size={16} />}
            >
              Actualizar contraseña
            </AppButton>
          </VStack>
        </Section>

        {/* ── Sesión ── */}
        <Section title="🚪 Sesión">
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="sm" fontWeight="medium" color={c.textPrimary}>
                Cerrar sesión
              </Text>
              <Text fontSize="xs" color={c.textSecondary}>
                Salir de tu cuenta en este dispositivo
              </Text>
            </Box>
            <AppButton
              variant="outline"
              size="sm"
              borderColor="red.200"
              color="red.500"
              _hover={{ bg: "red.50" }}
              onClick={handleSignOut}
              leftIcon={<MdLogout size={16} />}
            >
              Salir
            </AppButton>
          </Flex>
        </Section>

        {/* ── Zona de peligro ── */}
        <Section title="⚠️ Zona de peligro">
          {!confirmDelete ? (
            <Flex
              justify="space-between"
              align="center"
              flexWrap="wrap"
              gap={3}
            >
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="red.500">
                  Eliminar cuenta
                </Text>
                <Text fontSize="xs" color={c.textSecondary}>
                  Elimina permanentemente tu cuenta y todos tus datos
                </Text>
              </Box>
              <AppButton
                variant="outline"
                size="sm"
                borderColor="red.300"
                color="red.500"
                _hover={{ bg: "red.50" }}
                onClick={() => setConfirmDelete(true)}
                leftIcon={<MdDelete size={16} />}
              >
                Eliminar cuenta
              </AppButton>
            </Flex>
          ) : (
            <VStack gap={3} align="stretch">
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="lg"
                p={3}
              >
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="red.700"
                  mb={1}
                >
                  ¿Estás seguro? Esta acción no se puede deshacer.
                </Text>
                <Text fontSize="xs" color="red.600">
                  Se eliminarán todas tus transacciones, presupuestos,
                  categorías y metas de ahorro permanentemente.
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" color={c.textPrimary} mb={2}>
                  Escribe tu email{" "}
                  <Text as="span" fontWeight="bold">
                    {email}
                  </Text>{" "}
                  para confirmar:
                </Text>
                <Input
                  placeholder={email}
                  value={deleteInput}
                  onChange={(e) => {
                    setDeleteInput(e.target.value);
                    setDeleteError(null);
                  }}
                  {...inputStyle}
                  borderColor="red.300"
                />
              </Box>

              {deleteError && (
                <Box
                  bg="red.50"
                  border="1px solid"
                  borderColor="red.200"
                  borderRadius="lg"
                  p={3}
                >
                  <Text fontSize="sm" color="red.600">
                    ⚠️ {deleteError}
                  </Text>
                </Box>
              )}

              <HStack gap={3}>
                <AppButton
                  flex={1}
                  variant="outline"
                  borderColor={c.borderColor}
                  color={c.textSecondary}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteInput("");
                  }}
                >
                  Cancelar
                </AppButton>
                <AppButton
                  flex={1}
                  colorPalette="red"
                  loading={deleteLoading}
                  loadingText="Eliminando..."
                  onClick={handleDeleteAccount}
                  leftIcon={<MdDelete size={16} />}
                >
                  Eliminar todo
                </AppButton>
              </HStack>
            </VStack>
          )}
        </Section>
      </VStack>
    </Box>
  );
}
