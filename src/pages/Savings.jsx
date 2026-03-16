import { useState } from "react";
import { useBreakpointValue } from "@chakra-ui/react";
import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  Input,
  Spinner,
  Textarea,
} from "@chakra-ui/react";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdExpandMore,
  MdExpandLess,
  MdSavings,
} from "react-icons/md";
import AppButton from "../components/ui/AppButton";
import { useColorTheme } from "../hooks/useColorTheme";
import { useSavings } from "../hooks/useSavings";
import { useToast } from "../components/ui/Toast";

const formatPEN = (n) =>
  `S/ ${Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const formatFecha = (f) =>
  new Date(f + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const hoyPeru = () => {
  const ahora = new Date();
  const peru = new Date(
    ahora.toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  return peru.toISOString().split("T")[0];
};

const diasRestantes = (fecha) => {
  if (!fecha) return null;
  const hoy = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" }),
  );
  const limite = new Date(fecha + "T00:00:00");
  return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24));
};

function Modal({ title, onClose, children }) {
  const c = useColorTheme();
  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.600"
      zIndex={200}
      display="flex"
      alignItems={{ base: "flex-end", md: "center" }}
      justifyContent="center"
      px={{ base: 0, md: 4 }}
      onClick={onClose}
      className="animate-fadeIn"
    >
      <Box
        bg={c.bgCard}
        borderRadius={{ base: "2xl 2xl 0 0", md: "xl" }}
        p={{ base: 5, md: 6 }}
        w="full"
        maxW={{ base: "100%", md: "480px" }}
        mb={{ base: "65px", md: 0 }}
        maxH={{ base: "calc(92vh - 65px)", md: "85vh" }}
        overflowY="auto"
        boxShadow={c.shadowLg}
        onClick={(e) => e.stopPropagation()}
        className="animate-scaleIn"
      >
        <Flex justify="space-between" align="center" mb={5}>
          <Text fontWeight="600" fontSize="lg" color={c.textPrimary}>
            {title}
          </Text>
          <AppButton
            variant="ghost"
            size="sm"
            p={1}
            color={c.textMuted}
            onClick={onClose}
          >
            <MdClose size={18} />
          </AppButton>
        </Flex>
        {children}
      </Box>
    </Box>
  );
}

export default function Savings() {
  const c = useColorTheme();
  const esMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  const {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
  } = useSavings();

  const hoy = hoyPeru();

  const [modalMeta, setModalMeta] = useState(null);
  const [modalAporte, setModalAporte] = useState(null);
  const [goalExpandida, setGoalExpandida] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [deletingGoalId, setDeletingGoalId] = useState(null);
  const [deletingAporteId, setDeletingAporteId] = useState(null);

  const [metaNombre, setMetaNombre] = useState("");
  const [metaObjetivo, setMetaObjetivo] = useState("");
  const [metaFechaLimite, setMetaFechaLimite] = useState("");
  const [metaError, setMetaError] = useState(null);
  const [metaLoading, setMetaLoading] = useState(false);

  const [aporteMonto, setAporteMonto] = useState("");
  const [aporteFecha, setAporteFecha] = useState(hoy);
  const [aporteNota, setAporteNota] = useState("");
  const [aporteError, setAporteError] = useState(null);
  const [aporteLoading, setAporteLoading] = useState(false);

  const abrirNuevaMeta = () => {
    setEditGoal(null);
    setMetaNombre("");
    setMetaObjetivo("");
    setMetaFechaLimite("");
    setMetaError(null);
    setModalMeta("nueva");
  };

  const abrirEditarMeta = (g) => {
    setEditGoal(g);
    setMetaNombre(g.nombre);
    setMetaObjetivo(g.monto_objetivo);
    setMetaFechaLimite(g.fecha_limite || "");
    setMetaError(null);
    setModalMeta("editar");
  };

  const abrirAporte = (goalId) => {
    setAporteMonto("");
    setAporteFecha(hoy);
    setAporteNota("");
    setAporteError(null);
    setModalAporte(goalId);
  };

  const handleSubmitMeta = async () => {
    setMetaError(null);
    if (!metaNombre.trim()) {
      setMetaError("Ingresa un nombre para la meta.");
      return;
    }
    if (!metaObjetivo || isNaN(metaObjetivo) || Number(metaObjetivo) <= 0) {
      setMetaError("Ingresa un monto objetivo válido.");
      return;
    }
    setMetaLoading(true);
    try {
      const datos = {
        nombre: metaNombre.trim(),
        monto_objetivo: Number(metaObjetivo),
        fecha_limite: metaFechaLimite || null,
      };
      if (editGoal) {
        await updateGoal(editGoal.id, datos);
        toast.success("Meta actualizada correctamente", "¡Listo!");
      } else {
        await createGoal(datos);
        toast.success("Meta creada correctamente", "¡Listo!");
      }
      setModalMeta(null);
    } catch (err) {
      setMetaError(err.message);
      toast.error(err.message, "Error");
    } finally {
      setMetaLoading(false);
    }
  };

  const handleSubmitAporte = async () => {
    setAporteError(null);
    if (!aporteMonto || isNaN(aporteMonto) || Number(aporteMonto) <= 0) {
      setAporteError("Ingresa un monto válido.");
      return;
    }
    if (!aporteFecha) {
      setAporteError("Selecciona una fecha.");
      return;
    }
    setAporteLoading(true);
    try {
      await addContribution(modalAporte, {
        monto: Number(aporteMonto),
        fecha: aporteFecha,
        nota: aporteNota || null,
      });
      toast.success(
        `${formatPEN(Number(aporteMonto))} aportados`,
        "¡Aporte registrado!",
      );
      setModalAporte(null);
    } catch (err) {
      setAporteError(err.message);
      toast.error(err.message, "Error");
    } finally {
      setAporteLoading(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    setDeletingGoalId(id);
    try {
      await deleteGoal(id);
      toast.success("Meta eliminada");
    } catch (err) {
      toast.error(err.message, "Error");
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleDeleteAporte = async (id) => {
    setDeletingAporteId(id);
    try {
      await deleteContribution(id);
      toast.success("Aporte eliminado");
    } catch (err) {
      toast.error(err.message, "Error");
    } finally {
      setDeletingAporteId(null);
    }
  };

  const totalObjetivo = goals.reduce(
    (acc, g) => acc + Number(g.monto_objetivo),
    0,
  );
  const totalAportado = goals.reduce(
    (acc, g) => acc + Number(g.total_aportado || 0),
    0,
  );
  const metasCompletas = goals.filter((g) => g.completada).length;

  const inputStyle = {
    bg: c.bgInput,
    borderColor: c.borderColor,
    color: c.textPrimary,
    borderRadius: "10px",
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={4} gap={3}>
        <Box>
          <Heading size={{ base: "md", md: "lg" }} color={c.textPrimary}>
            Metas de Ahorro
          </Heading>
          <Text
            fontSize="sm"
            color={c.textSecondary}
            mt={0.5}
            display={{ base: "none", md: "block" }}
          >
            Seguimiento de tus objetivos financieros
          </Text>
        </Box>
        <AppButton
          colorPalette="green"
          size="sm"
          onClick={abrirNuevaMeta}
          leftIcon={<MdAdd size={16} />}
        >
          <Box display={{ base: "none", md: "block" }}>Nueva meta</Box>
        </AppButton>
      </Flex>

      {/* ── Resumen ── */}
      <Box mb={4}>
        {esMobile ? (
          <>
            <HStack gap={3} mb={3}>
              <Box
                flex={1}
                bg={c.bgCard}
                border="1px solid"
                borderColor={c.borderColor}
                borderRadius="xl"
                p={3}
                boxShadow={c.shadow}
              >
                <Text fontSize="xs" color={c.textSecondary} mb={1}>
                  Objetivo total
                </Text>
                <Text fontSize="md" fontWeight="bold" color={c.textPrimary}>
                  {formatPEN(totalObjetivo)}
                </Text>
              </Box>
              <Box
                flex={1}
                bg={c.bgCard}
                border="1px solid"
                borderColor={c.borderColor}
                borderRadius="xl"
                p={3}
                boxShadow={c.shadow}
              >
                <Text fontSize="xs" color={c.textSecondary} mb={1}>
                  Total aportado
                </Text>
                <Text fontSize="md" fontWeight="bold" color="green.500">
                  {formatPEN(totalAportado)}
                </Text>
              </Box>
            </HStack>
            <Box
              bg={c.bgCard}
              border="1px solid"
              borderColor={c.borderColor}
              borderRadius="xl"
              p={3}
              boxShadow={c.shadow}
            >
              <Text fontSize="xs" color={c.textSecondary} mb={1}>
                Metas completadas
              </Text>
              <Text fontSize="md" fontWeight="bold" color="green.500">
                {metasCompletas} / {goals.length}
              </Text>
            </Box>
          </>
        ) : (
          <HStack gap={4}>
            {[
              {
                label: "Objetivo total",
                valor: formatPEN(totalObjetivo),
                color: c.textPrimary,
              },
              {
                label: "Total aportado",
                valor: formatPEN(totalAportado),
                color: "green.500",
              },
              {
                label: "Metas completadas",
                valor: `${metasCompletas} / ${goals.length}`,
                color: "green.500",
              },
            ].map((item) => (
              <Box
                key={item.label}
                flex={1}
                bg={c.bgCard}
                border="1px solid"
                borderColor={c.borderColor}
                borderRadius="xl"
                p={4}
                boxShadow={c.shadow}
              >
                <Text fontSize="xs" color={c.textSecondary} mb={1}>
                  {item.label}
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={item.color}>
                  {item.valor}
                </Text>
              </Box>
            ))}
          </HStack>
        )}
      </Box>
      {/* ── Lista ── */}
      {loading ? (
        <Flex justify="center" align="center" py={12}>
          <Spinner color="green.500" />
        </Flex>
      ) : goals.length === 0 ? (
        <Box
          bg={c.bgCard}
          border="1px solid"
          borderColor={c.borderColor}
          borderRadius="xl"
          py={14}
          boxShadow={c.shadow}
        >
          <VStack gap={3}>
            <Text fontSize="4xl">🐷</Text>
            <Text color={c.textSecondary} fontSize="sm" textAlign="center">
              No tienes metas de ahorro todavía
            </Text>
            <Text
              fontSize="xs"
              color={c.textMuted}
              textAlign="center"
              maxW="280px"
            >
              Crea metas para hacer seguimiento de tus objetivos financieros
            </Text>
            <AppButton
              colorPalette="green"
              size="sm"
              mt={1}
              onClick={abrirNuevaMeta}
            >
              Crear primera meta
            </AppButton>
          </VStack>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {goals.map((g, i) => {
            const porcentaje =
              g.monto_objetivo > 0
                ? Math.min((g.total_aportado / g.monto_objetivo) * 100, 100)
                : 0;
            const completada = g.total_aportado >= g.monto_objetivo;
            const dias = diasRestantes(g.fecha_limite);
            const expandida = goalExpandida === g.id;

            return (
              <Box
                key={g.id}
                bg={c.bgCard}
                border="1px solid"
                borderColor={completada ? "green.200" : c.borderColor}
                borderRadius="xl"
                overflow="hidden"
                boxShadow={c.shadow}
                className="animate-fadeInUp"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <Box p={{ base: 4, md: 5 }}>
                  <Flex
                    justify="space-between"
                    align="flex-start"
                    gap={2}
                    mb={3}
                  >
                    <HStack gap={3} flex={1} minW={0}>
                      <Flex
                        w="42px"
                        h="42px"
                        borderRadius="12px"
                        flexShrink={0}
                        align="center"
                        justify="center"
                        bg={completada ? "green.50" : c.bgSubtle}
                        color={completada ? "green.500" : c.textSecondary}
                      >
                        <MdSavings size={22} />
                      </Flex>
                      <Box minW={0}>
                        <HStack gap={2} flexWrap="wrap">
                          <Text
                            fontWeight="600"
                            fontSize="sm"
                            color={c.textPrimary}
                          >
                            {g.nombre}
                          </Text>
                          {completada && (
                            <Text
                              fontSize="xs"
                              color="green.600"
                              fontWeight="700"
                              bg="green.50"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                            >
                              ✓ Completada
                            </Text>
                          )}
                        </HStack>
                        <Text fontSize="xs" color={c.textSecondary}>
                          {formatPEN(g.total_aportado)} de{" "}
                          {formatPEN(g.monto_objetivo)}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack gap={1} flexShrink={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={completada ? "green.500" : c.textPrimary}
                      >
                        {Math.round(porcentaje)}%
                      </Text>
                      <AppButton
                        variant="ghost"
                        size="sm"
                        p={1}
                        color={c.textMuted}
                        _hover={{ color: "blue.500", bg: "blue.50" }}
                        onClick={() => abrirEditarMeta(g)}
                      >
                        <MdEdit size={15} />
                      </AppButton>
                      <AppButton
                        variant="ghost"
                        size="sm"
                        p={1}
                        color={c.textMuted}
                        _hover={{ color: "red.500", bg: "red.50" }}
                        loading={deletingGoalId === g.id}
                        onClick={() => handleDeleteGoal(g.id)}
                      >
                        <MdDelete size={15} />
                      </AppButton>
                    </HStack>
                  </Flex>

                  {/* Barra */}
                  <Box
                    bg={completada ? "green.100" : c.bgSubtle}
                    borderRadius="full"
                    h="8px"
                    overflow="hidden"
                    mb={2}
                  >
                    <Box
                      h="full"
                      borderRadius="full"
                      bg={completada ? "green.500" : "blue.400"}
                      w={`${porcentaje}%`}
                      transition="width 0.5s cubic-bezier(0.4,0,0.2,1)"
                    />
                  </Box>

                  <Flex
                    justify="space-between"
                    align="center"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Box>
                      {g.fecha_limite && (
                        <Text
                          fontSize="xs"
                          color={
                            dias !== null && dias < 0
                              ? "red.500"
                              : dias !== null && dias <= 30
                                ? "orange.500"
                                : c.textMuted
                          }
                        >
                          {dias === null
                            ? ""
                            : dias < 0
                              ? `⚠️ Venció hace ${Math.abs(dias)} días`
                              : dias === 0
                                ? "⚡ Vence hoy"
                                : `📅 ${dias} días restantes · ${formatFecha(g.fecha_limite)}`}
                        </Text>
                      )}
                    </Box>
                    <HStack gap={2}>
                      {!completada && (
                        <AppButton
                          size="xs"
                          colorPalette="green"
                          variant="outline"
                          onClick={() => abrirAporte(g.id)}
                          leftIcon={<MdAdd size={13} />}
                        >
                          Aportar
                        </AppButton>
                      )}
                      <AppButton
                        size="xs"
                        variant="ghost"
                        color={c.textMuted}
                        onClick={() =>
                          setGoalExpandida(expandida ? null : g.id)
                        }
                        leftIcon={
                          expandida ? (
                            <MdExpandLess size={15} />
                          ) : (
                            <MdExpandMore size={15} />
                          )
                        }
                      >
                        {(g.contributions || []).length} aportes
                      </AppButton>
                    </HStack>
                  </Flex>
                </Box>

                {/* Historial */}
                {expandida && (
                  <Box
                    borderTop="1px solid"
                    borderColor={c.borderColor}
                    bg={c.bgHover}
                    className="animate-fadeIn"
                  >
                    {(g.contributions || []).length === 0 ? (
                      <Text
                        fontSize="sm"
                        color={c.textSecondary}
                        textAlign="center"
                        py={4}
                      >
                        Sin aportes todavía
                      </Text>
                    ) : (
                      [...g.contributions]
                        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                        .map((aporte, i) => (
                          <Flex
                            key={aporte.id}
                            px={{ base: 4, md: 5 }}
                            py={3}
                            align="center"
                            justify="space-between"
                            borderTop={i > 0 ? "1px solid" : "none"}
                            borderColor={c.borderColor}
                            gap={2}
                          >
                            <Box flex={1} minW={0}>
                              <Text
                                fontSize="sm"
                                fontWeight="600"
                                color="green.500"
                              >
                                +{formatPEN(aporte.monto)}
                              </Text>
                              <Text fontSize="xs" color={c.textMuted}>
                                {formatFecha(aporte.fecha)}
                                {aporte.nota && ` · ${aporte.nota}`}
                              </Text>
                            </Box>
                            <AppButton
                              variant="ghost"
                              size="sm"
                              p={1}
                              color={c.textMuted}
                              _hover={{ color: "red.500", bg: "red.50" }}
                              loading={deletingAporteId === aporte.id}
                              onClick={() => handleDeleteAporte(aporte.id)}
                            >
                              <MdDelete size={14} />
                            </AppButton>
                          </Flex>
                        ))
                    )}
                  </Box>
                )}
              </Box>
            );
          })}
        </VStack>
      )}

      {/* ── Modal meta ── */}
      {modalMeta && (
        <Modal
          title={
            modalMeta === "editar" ? "Editar meta" : "Nueva meta de ahorro"
          }
          onClose={() => setModalMeta(null)}
        >
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Nombre de la meta
              </Text>
              <Input
                placeholder="Ej: Viaje a Europa, Fondo de emergencia..."
                value={metaNombre}
                onChange={(e) => setMetaNombre(e.target.value)}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Monto objetivo (S/)
              </Text>
              <Input
                type="number"
                placeholder="0.00"
                value={metaObjetivo}
                onChange={(e) => setMetaObjetivo(e.target.value)}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Fecha límite{" "}
                <Text as="span" color={c.textMuted} fontWeight="400">
                  (opcional)
                </Text>
              </Text>
              <Input
                type="date"
                value={metaFechaLimite}
                min={hoy}
                onChange={(e) => setMetaFechaLimite(e.target.value)}
                {...inputStyle}
              />
            </Box>
            {metaError && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="10px"
                p={3}
              >
                <Text fontSize="sm" color="red.600">
                  ⚠️ {metaError}
                </Text>
              </Box>
            )}
            <HStack gap={3} pt={1}>
              <AppButton
                flex={1}
                variant="outline"
                borderColor={c.borderColor}
                color={c.textSecondary}
                onClick={() => setModalMeta(null)}
              >
                Cancelar
              </AppButton>
              <AppButton
                flex={1}
                colorPalette="green"
                loading={metaLoading}
                loadingText="Guardando..."
                onClick={handleSubmitMeta}
              >
                {modalMeta === "editar" ? "Guardar cambios" : "Crear meta"}
              </AppButton>
            </HStack>
          </VStack>
        </Modal>
      )}

      {/* ── Modal aporte ── */}
      {modalAporte && (
        <Modal title="Agregar aporte" onClose={() => setModalAporte(null)}>
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Monto (S/)
              </Text>
              <Input
                type="number"
                placeholder="0.00"
                value={aporteMonto}
                onChange={(e) => setAporteMonto(e.target.value)}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Fecha
              </Text>
              <Input
                type="date"
                value={aporteFecha}
                max={hoy}
                onChange={(e) => setAporteFecha(e.target.value)}
                {...inputStyle}
              />
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="500" color={c.textPrimary} mb={2}>
                Nota{" "}
                <Text as="span" color={c.textMuted} fontWeight="400">
                  (opcional)
                </Text>
              </Text>
              <Textarea
                placeholder="Ej: Quincena de marzo..."
                value={aporteNota}
                onChange={(e) => setAporteNota(e.target.value)}
                rows={2}
                resize="none"
                {...inputStyle}
              />
            </Box>
            {aporteError && (
              <Box
                bg="red.50"
                border="1px solid"
                borderColor="red.200"
                borderRadius="10px"
                p={3}
              >
                <Text fontSize="sm" color="red.600">
                  ⚠️ {aporteError}
                </Text>
              </Box>
            )}
            <HStack gap={3} pt={1}>
              <AppButton
                flex={1}
                variant="outline"
                borderColor={c.borderColor}
                color={c.textSecondary}
                onClick={() => setModalAporte(null)}
              >
                Cancelar
              </AppButton>
              <AppButton
                flex={1}
                colorPalette="green"
                loading={aporteLoading}
                loadingText="Guardando..."
                onClick={handleSubmitAporte}
              >
                Agregar aporte
              </AppButton>
            </HStack>
          </VStack>
        </Modal>
      )}
    </Box>
  );
}
